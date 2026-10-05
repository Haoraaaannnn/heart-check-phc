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
6. **Premature State Rollback from Asynchronous Writes:** When clinical or transfer staff move a patient across columns, the local UI updates optimistically. Over high-latency WiFi (1000ms+ round trip), an interim background poll or WebSocket re-fetch returns the pre-mutation database row before the write commits. Without mutation pinning, the lagging read overwrites the optimistic state, teleporting the patient card back to the original column until the write eventually completes.
7. **Realtime Write-Back Echo Loops:** Hooks that derive timestamps or counter associations on read and immediately write them back to Supabase trigger new `postgres_changes` events. Over high latency, this creates an infinite self-triggering cycle of WebSocket notifications and network queries.

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

#### A4. Concurrency & Trailing-Edge Throttle (500ms Lock)

To prevent simultaneous requests from fallback timers and WebSocket events colliding on weak connections while guaranteeing zero event loss, `guardedFetch()` enforces a 500ms throttle lock with an automatic trailing-edge timer (`trailingTimerRef`). If a trigger occurs within 500ms of an active or recent query, it is not dropped; instead, a trailing timer executes the fetch immediately upon window expiration, ensuring that incoming Realtime updates are never delayed until the next polling tick.

#### A5. Inbound Event Debouncing (50ms – 100ms Window)

In high-throughput hooks, database events are debounced with a micro-window (50ms for Nurse and Transfer, 100ms for Monitor). Rapid burst events coalesce into a single fetch without introducing noticeable human lag.

#### A6. Immediate Resubscription Reconciliation

When a degraded channel recovers to `SUBSCRIBED`, hooks immediately fire a reconciliation fetch (`guardedFetch()`). Any patient status transitions that occurred while the client was disconnected are synchronized on the first render.

#### A7. Production Polling Cadence by Subsystem

| Workstation / Hook | Fallback Poll Cadence | Debounce Window | Overlap & Trailing Throttle | Monotonic Guard & Pinning | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Nurse Station (`app/nurse/hooks/useRealtimeSubscription.ts`) | 5 seconds | Direct 0ms payload dispatch + 50ms fallback | 500ms trailing lock | Monotonic sequence guard + 5s in-flight mutation pinning + metadata memoization | Instantaneous response for consultation room intake without UI bounce |
| Transfer Dashboard (`app/transfer/hooks/useRealtimeSubscription.ts`) | 5 seconds | 150ms debounce + 0ms direct payload patch | 500ms trailing lock | Monotonic sequence guard + 8s confirmed pin (2.5s post-match grace) + getConfirmedPin guard + 4s write throttle | Critical live state for drag-and-drop counter flow |
| Public Monitor (`app/monitor/hooks/useRealtimeSubscription.ts`) | 8 seconds | 100ms | 500ms trailing lock | In-flight flag + category filter | Public waiting display; audio chime trigger |
| Service Queue Panel (`app/dashboard/pages/patients/hooks/useServiceQueue.ts`) | 10 seconds | Direct | 500ms | `fetchSequenceRef` | Active service department queue auditing |
| Admin Overview (`app/dashboard/hooks/useOverviewData.ts`) | 30 seconds | 300ms reconciliation | 500ms | `todayFetchIdRef` | Executive KPI cards and daily flow aggregates |

#### A8. In-Flight Mutation Pinning & Confirmed Pin Guard (Anti-Teleportation State Lock)

To eliminate patient card teleportation when background polling or WebSocket events return lagging pre-mutation rows over weak connections:
- In Nurse Station (`useNurseData.ts`), `pinInFlightMutation(patientId, stage, 5000)` records an optimistic destination stage with a 5-second Time-To-Live (TTL). When `fetchData()` returns server data, it checks `inFlightMutationsRef`. If a patient has an active pin, the server stage is overridden with the pinned stage until the database transaction is guaranteed to have committed.
- In Transfer Dashboard (`usePatientData.ts`), `pinConfirmedPatient(patientId, cubicleNum, 'Assigned')` pins confirmed room assignments with an 8-second TTL and a 2.5-second post-match grace window. When `fetchData()` matches the server row, the pin is retained for at least 2.5 seconds to absorb out-of-order WebSocket echo packets. If server rows temporarily omit the patient, the pin retains the patient in the cubicle rather than dropping them.
- In Transfer Dashboard (`app/transfer/page.tsx`), `handleRealtimePayload` checks `getConfirmedPin(patient.id)`. Any incoming Realtime payload that arrives with an older or conflicting status (such as `status: 'On Progress'` or `cubicleNum: null`) while a pin is active is discarded immediately, preventing patient cards from jumping back to the queue.
- Drag and drop (`useDragAndDrop.ts`) and tap-to-select (`useTransferSelection.ts`) update `pendingUpdatesRef.current` synchronously at the exact millisecond of the user interaction, closing the race-condition gap before React render effects execute.

#### A9. Direct 0ms Realtime In-Memory Payload Patching

Rather than waiting for a full HTTP round-trip (`fetchData()`) when a Postgres change event arrives:
- `useRealtimeSubscription` hooks accept an `onPayload` callback that fires immediately upon receiving a `postgres_changes` event (`INSERT`, `UPDATE`, `DELETE`).
- `applyRealtimeUpdate` in Nurse Station and `handleRealtimePayload` in Transfer Dashboard patch patient records in component memory within 0ms, moving cards to their new columns instantly without waiting for network query resolution.
- Incoming payloads are strictly guarded by `pendingUpdatesRef` and active confirmed pins (`getConfirmedPin`) so stale packets cannot undo in-flight user decisions.

#### A10. Echo-Loop Write Throttling

To prevent derived database updates from triggering self-inflicted WebSocket storms:
- `persistDerivedFields()` in Transfer Dashboard is gated by a 4-second timestamp throttle (`lastDerivedWriteAt`). Read operations that calculate progress timestamps or counter associations do not re-commit to the database if a write occurred within the past 4 seconds.
- `fetchRegistrationPatients()` similarly enforces a 4-second throttle (`lastRegWriteAtRef`) and monotonic sequence guarding (`regFetchSeqRef`).

#### A11. Nurse Workstation Query Memoization

To prevent authorization and room metadata lookups from starving bandwidth on every 5-second poll tick, `useNurseData.ts` caches cubicle numbers and doctor mappings in `cachedCubicleNumsRef` and `cachedCubiclesRef`. Repetitive queries (`getSession`, `users`, `cubicles`, `doctors`) are eliminated during background polling.

#### A12. Non-Blocking Asynchronous Side-Effects (SMS & Queue Renumbering)

In `app/transfer/page.tsx`, manual assignment confirmation (`handleConfirm`) commits changes to Supabase and immediately dismisses the modal and clears pending updates. Heavy secondary operations—such as sending SMS notifications to patient phones and recalculating queue indices for non-assigned patients—are decoupled into asynchronous background promises (`void (async () => { ... })()`). This prevents third-party SMS API round-trips from blocking staff interaction or delaying UI state transitions.

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

2. **`app/nurse/` Station Resilience (`useNurseData.ts`, `useNurseActions.ts`, `useRealtimeSubscription.ts`):**
   - 0ms direct in-memory payload dispatch (`applyRealtimeUpdate`) moving cards across stages instantly on WebSocket event.
   - 5-second in-flight mutation pinning (`inFlightMutationsRef`) preventing background polling from rolling back optimistic column transitions during weak signal.
   - Monotonic sequence guard (`fetchSeqRef`) discarding delayed out-of-order network responses.
   - Authorization and cubicle metadata query memoization (`cachedCubicleNumsRef`, `cachedCubiclesRef`) eliminating 4 redundant SQL queries on every 5-second poll tick.
   - 5-second polling fallback activated upon channel degradation with 2-second hysteresis grace period.
   - 500ms overlap throttle eliminating concurrent poll and realtime executions.
   - Immediate reconciliation fetch upon reconnecting to `SUBSCRIBED`.
   - `disposed` cleanup guard preventing state updates on unmounted workstations.

3. **`app/transfer/` Dashboard Resilience (`usePatientData.ts`, `page.tsx`, `useRealtimeSubscription.ts`):**
   - Direct 0ms in-memory payload dispatch (`handleRealtimePayload`) patching assigned, on-progress, and registration queues without waiting for network re-fetch.
   - 150ms event debounce coalescing burst Postgres changes into a single database query.
   - 5-second confirmed assignment pinning (`inFlightConfirmedRef`) preventing background queries from reverting assigned patients to unassigned during server upsert.
   - Write-throttle guards (4 seconds) on `persistDerivedFields` and `fetchRegistrationPatients` suppressing self-triggering Realtime echo loops.
   - Passing `pendingUpdatesRef` into `usePatientData` ensuring local pending moves overlay fresh fetches before render.
   - 5-second polling fallback with 2-second channel hysteresis.
   - 500ms overlap throttle lock and immediate reconciliation on recovery.

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

7. **`components/reusables/ConnectionStatusBanner.tsx` (Connection Status Banner Recovery Rule):**
   - **Silent Initial Boot:** `isInitialConnectionEstablished` ensures that normal application boot and channel handshake never flash a recovery banner.
   - **Confirmed Outage Requirement:** Recovery banners (`Live - Real-time updates restored`) appear strictly after a confirmed sustained network outage (`!isOnline` or channel `TIMED_OUT` / `CHANNEL_ERROR` lasting > 1.5 seconds).
   - **Stable Operation Invisibility:** During stable connections, component unmount/remount (`CLOSED`), normal channel establishment (`CONNECTING`), and offline outbox synchronization (`pendingCount > 0`), the recovery banner remains completely hidden.
   - **2.5-Second Auto-Dismiss:** Upon verified reconnection after an outage, the green banner displays for 2.5 seconds and automatically dismisses.

8. **Workstation Interaction Standard (Tap-to-Act Quick Dropdowns):**
   - **No Lingering UI on Tap:** Replaced persistent bottom floating banners (`SelectionBanner`, `NurseSelectionBanner`) with self-contained, contextual popovers (`QuickAssignDropdown.tsx` in Transfer and `NurseQuickActionDropdown.tsx` in Nurse).
   - **Immediate Contextual Action:** Tapping a patient immediately presents a focused menu of available clinical transitions (Doctor Consultation, Carryout, Complete/Done, Audio Announcement, or station reassignment) with live capacity and physician designations.
   - **Resilient Auto-Dismiss:** The dropdown automatically dismisses upon action execution, outside click (`pointerdown` outside panel), backdrop tap, or `Escape` key press, ensuring zero lingering or stuck UI elements.

---

_Last updated: reflects the implemented Layer A weak-signal stabilization, ConnectionStatusBanner recovery rules, Tap-to-Act interaction standard, and documented Layer B LAN-first handoff plan for PHC on-premises deployment._
