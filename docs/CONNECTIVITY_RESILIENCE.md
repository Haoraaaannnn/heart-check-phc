# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Connectivity Resilience and LAN-First Strategy

This document defines the architectural strategy for operating Heart Check PHC reliably under low or intermittent internet conditions, while preserving real-time queue synchronization across all connected devices (kiosk, monitor, nurse station, transfer dashboard).

---

## 1. Problem Statement

The current system depends entirely on a stable external internet connection:

| Dependency | Impact When Internet is Weak or Lost |
| :--- | :--- |
| Supabase PostgreSQL (cloud) | All reads and writes fail — kiosk cannot register patients, staff cannot update status |
| Supabase Realtime (WebSocket) | Live queue updates stop across monitor, nurse, and transfer dashboards |
| FastAPI analytics backend (Railway) | Analytics dashboard shows stale or empty data |
| Next.js deployment (Vercel) | The application itself may fail to load for new browser sessions |

At PHC's Outpatient Department, dropped connectivity during peak hours directly blocks patient flow. Queue counters stop calling numbers. Nurses lose visibility. The kiosk fails silently.

---

## 2. Root Cause Analysis

The system's real-time layer relies on Supabase Realtime, which maintains persistent WebSocket connections from every browser session to Supabase's cloud servers. Under weak WiFi or high packet loss conditions, multiple failure modes compounded to cause visual glitches:

1. **Queue "Teleportation" (Out-of-Order Responses):** Under packet delay, an older HTTP fetch initiated during high latency could return *after* a newer fetch had already updated state. Because responses lacked monotonic sequence tracking, the older stale data overwrote the fresh data, causing patients to appear to jump backward or disappear.
2. **Channel Thrashing (Ping Jitter):** Transient packet drops caused channel status to cycle rapidly between `SUBSCRIBED` and `TIMED_OUT`. Without a hysteresis buffer, polling intervals were repeatedly started, destroyed, and restarted within milliseconds.
3. **Event Burst Collisions:** Reconnecting channels frequently delivered multiple backlog Postgres changes in rapid succession. In un-debounced hooks (such as Transfer), each event triggered an independent network query, overwhelming the weak uplink.
4. **Concurrent Poll and Realtime Collisions:** Fallback timers and WebSocket events could fire simultaneously, initiating parallel overlapping database queries that competed for limited bandwidth.
5. **Premature Socket Teardowns:** Default Supabase heartbeat timeouts (40s) were shorter than typical round-trip delays on congested mobile hotspots, triggering premature disconnections and aggressive reconnect loops.

---

## 3. Solution Architecture: Dual-Mode Resilience

The strategy operates in two layers: the implemented short-term resilience improvements (Layer A) running on the cloud deployment, and the long-term LAN-first architecture (Layer B) for PHC's on-premises handoff.

### Layer A: Implemented — Weak-Signal Resilience & Dual-Mode Fallback

Layer A stabilizes queue presentation across all clinical and administrative workstations without requiring infrastructural changes.

#### A1. Supabase Client Socket Tuning (`lib/supabase.ts`)

The centralized Supabase browser client is tuned specifically for high-latency, packet-loss environments:

- `heartbeatIntervalMs: 25_000`: Sends WebSocket keep-alive pings every 25 seconds (slightly faster than the server-side 30s cadence) so the client detects genuine connection drops promptly.
- `timeout: 60_000`: Increases heartbeat acknowledgment grace from 40 seconds to 60 seconds, preventing premature channel teardown when a single ping is delayed by a congested uplink.
- `reconnectAfterMs: (attempts) => Math.min(2_000 * Math.pow(1.5, attempts), 10_000)`: Implements stepped exponential backoff with a 2-second floor and 10-second ceiling, eliminating aggressive reconnect loops that compete with polling requests for bandwidth.

#### A2. Fetch Sequence Guard (Anti-Teleportation)

Every state-fetching hook maintains a monotonic request identifier (`fetchSequenceRef` or `todayFetchIdRef`). When a fetch completes, the hook verifies that the returning response corresponds to the latest issued request. Stale out-of-order responses from earlier slow requests are discarded, ensuring patients never jump to obsolete queue positions:

```typescript
const fetchSeqRef = useRef<number>(0);

const guardedFetch = async () => {
    const currentSeq = ++fetchSeqRef.current;
    const data = await queryDatabase();
    if (currentSeq !== fetchSeqRef.current) {
        // Discard: a newer fetch was initiated while this one was in flight
        return;
    }
    applyState(data);
};
```

#### A3. Channel Health Guard & 2-Second Hysteresis Buffer

To prevent poll start/stop thrashing when channel status flickers during temporary packet jitter, hooks implement a 2-second hysteresis grace timer before degrading to polling:

```typescript
channel.subscribe((status) => {
    setChannelStatus(status);
    if (status === 'SUBSCRIBED') {
        if (degradeTimerRef.current) {
            clearTimeout(degradeTimerRef.current);
            degradeTimerRef.current = null;
        }
        stopPolling();
        // Immediately reconcile missed mutations
        void guardedFetch();
    } else {
        if (!degradeTimerRef.current) {
            degradeTimerRef.current = setTimeout(() => {
                startPolling();
                degradeTimerRef.current = null;
            }, 2000);
        }
    }
});
```

#### A4. Concurrency & Overlap Throttle (500ms Lock)

To prevent simultaneous requests from fallback timers and WebSocket events colliding on weak connections, `guardedFetch()` enforces a 500ms throttle lock (`isFetchingRef` and `lastFetchTimeRef`). If a trigger occurs within 500ms of an active or recent query, the duplicate invocation is dropped.

#### A5. Inbound Event Debouncing (300ms Window)

In high-throughput hooks (`app/transfer/hooks/useRealtimeSubscription.ts` and `app/monitor/hooks/useRealtimeSubscription.ts`), database events are debounced with a 300ms timer. A burst of 10 simultaneous patient assignments coalesces into a single database query.

#### A6. Immediate Resubscription Reconciliation

When a degraded channel recovers to `SUBSCRIBED`, hooks immediately fire a reconciliation fetch (`guardedFetch()`). Any patient status transitions that occurred while the client was disconnected are synchronized on the first render.

#### A7. Production Polling Cadence by Subsystem

| Workstation / Hook | Fallback Poll Cadence | Debounce Window | Overlap Throttle | Monotonic Guard | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Nurse Station (`app/nurse/hooks/useRealtimeSubscription.ts`) | 5 seconds | Direct (UI debounce) | 500ms | In-flight flag + disposed check | Rapid response for consultation room intake |
| Transfer Dashboard (`app/transfer/hooks/useRealtimeSubscription.ts`) | 5 seconds | 300ms | 500ms | In-flight flag + timestamp lock | Critical live state for drag-and-drop counter flow |
| Public Monitor (`app/monitor/hooks/useRealtimeSubscription.ts`) | 8 seconds | 300ms | 500ms | In-flight flag + category filter | Public waiting display; audio chime trigger |
| Service Queue Panel (`app/dashboard/patients/hooks/useServiceQueue.ts`) | 10 seconds | Direct | 500ms | `fetchSequenceRef` | Active service department queue auditing |
| Admin Overview (`app/dashboard/hooks/useOverviewData.ts`) | 30 seconds | 300ms reconciliation | 500ms | `todayFetchIdRef` | Executive KPI cards and daily flow aggregates |

---

### Layer B: Long-Term — LAN-First Architecture for PHC On-Premises Handoff

This is the correct target architecture for PHC's production environment, where the system runs on a local area network with no external internet dependency.

#### B1. Why LAN Solves the Problem

The PHC OPD operates within a single building. All devices — kiosk, monitor, nurse station laptops, and transfer dashboard tablets — are on the same LAN. A locally hosted stack removes the cloud intermediary entirely:

- No internet required for any real-time operation.
- Sub-millisecond latency between all devices.
- Network stability governed by PHC's own LAN infrastructure (PHC MIS responsibility).

#### B2. Target Stack for On-Premises Deployment

```
PHC On-Premises Server (single machine or two-machine setup)
|
+-- PostgreSQL (on-prem)
|   - Replaces Supabase cloud PostgreSQL
|   - All patient, service, cubicle, user data stored locally
|
+-- FastAPI Backend (on-prem)
|   - Already built and deployable via uvicorn
|   - Serves analytics, realtime WebSocket events, and kiosk writes
|   - Add a /ws WebSocket endpoint for real-time push to all clients
|
+-- Next.js Application (on-prem)
    - Served from the same machine or a second machine on the LAN
    - All browsers connect to the local IP (e.g., 192.168.1.x)
    - No Vercel dependency
```

#### B3. Replacing Supabase Realtime with FastAPI WebSocket

Supabase Realtime is a Supabase-specific feature that requires cloud connectivity. The documented replacement plan (referenced in `ARCHITECTURE.md`) is a FastAPI WebSocket endpoint. Here is the target design:

**FastAPI WebSocket endpoint (`python_backend/main.py`):**

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

connected_clients: List[WebSocket] = []

@app.websocket("/ws/patients")
async def patients_ws(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive ping/pong
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

async def broadcast_patient_update():
    """Called after any INSERT or UPDATE on the patients table."""
    for client in connected_clients:
        try:
            await client.send_json({"event": "patients_updated"})
        except Exception:
            connected_clients.remove(client)
```

Every POST/PATCH route that mutates the `patients` table calls `broadcast_patient_update()` after committing the change. All connected browser clients receive the event and re-fetch their local view.

**Next.js client hook (replaces `useRealtimeSubscription.ts`):**

```typescript
useEffect(() => {
    const ws = new WebSocket('ws://192.168.1.x:8000/ws/patients');

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'patients_updated') {
            onFetchRef.current();
        }
    };

    ws.onclose = () => {
        // Start polling fallback — LAN can still have temporary blips
        startPolling();
    };

    ws.onopen = () => stopPolling();

    return () => ws.close();
}, []);
```

This gives identical real-time behavior to Supabase Realtime, but over a LAN WebSocket with no cloud dependency. The kiosk write, nurse update, and transfer drag-and-drop operations all call FastAPI endpoints, which then broadcast to all WebSocket subscribers — delivering sub-100ms UI updates across all devices on the LAN.

#### B4. Kiosk Write Path (LAN)

Under the LAN architecture, the kiosk no longer writes to Supabase directly using the anon key. The write path becomes:

```
Kiosk Browser
    -> POST /api/kiosk/create-patient (FastAPI, on LAN)
        -> INSERT INTO patients (PostgreSQL, on LAN)
        -> broadcast_patient_update() (push to all WebSocket clients)
```

This also closes the security concern in `SECURITY.md` regarding the anon key on kiosk inserts.

#### B5. Local IP Configuration

The current `next.config.ts` already defines `allowedDevOrigins: ['192.168.1.42']`, showing that multi-device LAN access is an established practice in this project. For production, all hardcoded Supabase URLs and anon keys in `.env.local` are replaced with local PostgreSQL credentials and the FastAPI local host.

---

## 4. Implementation Priority & Status

| Priority | Item | Effort | Impact | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Polling fallback, debounce, hysteresis, and sequence guards on all subscription hooks | Low | Immediate resilience improvement across all displays | Completed |
| 2 | Supabase client socket timeout and exponential backoff reconnect tuning (`lib/supabase.ts`) | Low | Eliminates premature timeout teardowns and reconnect storms | Completed |
| 3 | Add `navigator.onLine` banner / connection status indicator to nurse and transfer dashboards | Low | User awareness, reduces confusion during outages | Completed |
| 4 | Kiosk optimistic write with `localStorage` queue and retry | Medium | Kiosk survives short network blips | Planned (Layer B interim) |
| 5 | FastAPI `/ws/patients` WebSocket endpoint | Medium | Prerequisite for LAN-first architecture | Planned (Layer B on-prem) |
| 6 | Replace `useRealtimeSubscription` with native WebSocket hook | Medium | Removes Supabase Realtime dependency | Planned (Layer B on-prem) |
| 7 | Docker packaging for PHC on-premises deployment | Medium | Enables clean LAN handoff to PHC MIS | Planned (Layer B on-prem) |
| 8 | Middleware config update for local FastAPI URL | Low | Finalizes LAN handoff | Planned (Layer B on-prem) |

---

## 5. What Changes, What Stays the Same

| Component | Current (Cloud) | LAN-First (PHC On-Premises) |
| :--- | :--- | :--- |
| Database | Supabase PostgreSQL (cloud) | PostgreSQL (on-prem, same machine) |
| Real-time events | Supabase Realtime (WebSocket to cloud) | FastAPI WebSocket (`/ws/patients`) |
| Kiosk write path | Supabase RPC `create_patient` (anon key, cloud) | FastAPI POST `/api/kiosk/create-patient` (LAN) |
| Nurse/Transfer mutations | Supabase client direct updates (cloud) | FastAPI PATCH endpoints (LAN) |
| Analytics | FastAPI on Railway (cloud) | FastAPI on-prem (same server) |
| Auth | Supabase Auth (cloud) | Supabase Auth (cloud) OR migrated to local JWT |
| Next.js serving | Vercel (cloud) | `next start` on LAN server, accessed by all devices via local IP |

Auth is the one component where Supabase cloud may be retained even in the on-premises deployment, since PHC MIS are unlikely to manage their own auth service. This is acceptable — auth tokens still work on a LAN with internet access for login only.

---

## 6. Implementation Record: Layer A Stabilization

The weak-signal resilience enhancements have been implemented across all real-time ingestion paths:

1. **`lib/supabase.ts`:**
   - Client-level `heartbeatIntervalMs: 25_000` for proactive disconnect detection.
   - `timeout: 60_000` heartbeat acknowledgment window preventing premature disconnects on congested uplinks.
   - `reconnectAfterMs`: Exponential backoff (`2s` floor, `10s` cap) suppressing reconnect storms.

2. **`app/nurse/hooks/useRealtimeSubscription.ts`:**
   - 5-second polling fallback activated upon channel degradation.
   - 2-second hysteresis grace period preventing poll oscillation on transient packet drops.
   - 500ms overlap throttle eliminating concurrent poll and realtime executions.
   - Immediate reconciliation fetch upon reconnecting to `SUBSCRIBED`.
   - `disposed` cleanup guard preventing state updates on unmounted workstations.

3. **`app/transfer/hooks/useRealtimeSubscription.ts`:**
   - 300ms event debounce coalescing burst Postgres changes into a single database query.
   - 5-second polling fallback with 2-second channel hysteresis.
   - 500ms overlap throttle lock.
   - Immediate reconciliation on recovery.

4. **`app/monitor/hooks/useRealtimeSubscription.ts`:**
   - 300ms event debounce for waiting room displays.
   - 8-second polling fallback with 2-second hysteresis.
   - Category filtering preserved with 500ms overlap throttling.
   - Immediate reconciliation upon reconnect.

5. **`app/dashboard/hooks/useOverviewData.ts`:**
   - `todayFetchIdRef` monotonic request sequence guard discarding stale out-of-order network responses.
   - 500ms reconciliation throttle.
   - 2-second hysteresis before activating the 30-second polling fallback.
   - Hook dependency stabilization breaking channel teardown loops caused by callback identity changes.

6. **`app/dashboard/patients/hooks/useServiceQueue.ts`:**
   - 10-second polling fallback for active department queue auditing.
   - Monotonic `fetchSequenceRef` sequence guard preventing queue teleportation.
   - 500ms overlap throttle and 2-second channel hysteresis.

---

_Last updated: reflects the implemented Layer A weak-signal stabilization and documented Layer B LAN-first handoff plan for PHC on-premises deployment._
