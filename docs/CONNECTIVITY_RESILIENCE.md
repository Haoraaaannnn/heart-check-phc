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

The system's real-time layer relies on Supabase Realtime, which maintains persistent WebSocket connections from every browser session to Supabase's cloud servers. These connections:

- Drop when internet is unstable or packet loss is high.
- Do not automatically re-deliver missed events after reconnection.
- Require a full re-subscribe cycle after a disconnect.

Currently, none of the three `useRealtimeSubscription` hooks (`app/nurse/`, `app/transfer/`, `app/monitor/`) implement:
- Connection state tracking.
- Automatic reconnection with backoff.
- A polling fallback when the WebSocket channel is degraded.

---

## 3. Solution Architecture: Dual-Mode Resilience

The strategy operates in two layers: a short-term resilience improvement for the current cloud deployment, and the long-term LAN-first architecture for PHC's on-premises handoff.

### Layer A: Short-Term — Polling Fallback + Channel Health Guard

This layer improves the existing cloud-based system without architectural changes.

#### A1. Connection State Detection

Each `useRealtimeSubscription` hook should track whether the Supabase Realtime channel is actually connected. The `subscribe()` method accepts a status callback:

```typescript
channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
        // WebSocket live — pause polling fallback
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        // WebSocket dead — activate polling fallback
    }
});
```

Supabase channels emit one of these status strings:
- `SUBSCRIBED` — connected and receiving events.
- `CHANNEL_ERROR` — connection failure.
- `TIMED_OUT` — server did not respond in time.
- `CLOSED` — channel was removed or connection was terminated.

#### A2. Polling Fallback Mechanism

When the channel status is not `SUBSCRIBED`, each hook activates an `setInterval` polling fallback that directly queries the database on a fixed cadence (e.g., every 5-10 seconds). When the channel recovers to `SUBSCRIBED`, the polling interval is cleared.

Pseudocode pattern for all three subscription hooks:

```typescript
useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
        if (pollInterval) return; // Already polling
        pollInterval = setInterval(() => onFetchRef.current(), POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    };

    const channel = supabase
        .channel('patients-nurse-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
            handleUpdate();
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                stopPolling(); // Realtime is live — no need to poll
            } else {
                startPolling(); // Connection degraded — activate polling
            }
        });

    return () => {
        stopPolling();
        void supabase.removeChannel(channel);
    };
}, [debounceMs]);
```

#### A3. Recommended Poll Intervals by Page

| Page | Recommended Interval | Rationale |
| :--- | :--- | :--- |
| Nurse Dashboard (`/nurse`) | 5 seconds | Staff must see queue changes quickly |
| Transfer Dashboard (`/transfer`) | 5 seconds | Drag-and-drop assignments require near-live state |
| Monitor Display (`/monitor`) | 8 seconds | Public display, slight delay acceptable |
| Analytics Dashboard (`/dashboard`) | 30 seconds | Aggregated data, not operationally critical |

#### A4. Browser `navigator.onLine` Guard

Wrap all fetch operations in a guard that checks `navigator.onLine` before making a network request. Register `window` event listeners for `online` and `offline` events to reactively start or stop polling and surface a status banner to the user.

```typescript
window.addEventListener('online', () => {
    // Attempt to re-subscribe and trigger a fresh fetch
});

window.addEventListener('offline', () => {
    // Notify user; activate local state / last-known data display
});
```

#### A5. Optimistic UI for Kiosk Writes

The kiosk's patient creation flow (`KioskPhoneEntry.tsx` → Supabase RPC `create_patient`) currently fails hard if the network is down. An optimistic approach:

1. The kiosk writes the patient record to `localStorage` as a pending entry.
2. A `navigator.onLine` check determines whether to flush immediately or queue.
3. A `service worker` background sync (or a simple `setInterval` retry) attempts to flush the pending entries to Supabase when connectivity returns.

This is the acceptable interim design. The definitive fix is the LAN-first architecture below.

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

## 4. Implementation Priority

| Priority | Item | Effort | Impact |
| :--- | :--- | :--- | :--- |
| 1 | Add polling fallback to all three `useRealtimeSubscription` hooks | Low | Immediate resilience improvement |
| 2 | Add `navigator.onLine` banner / connection status indicator to nurse and transfer dashboards | Low | User awareness, reduces confusion during outages |
| 3 | Kiosk optimistic write with `localStorage` queue and retry | Medium | Kiosk survives short network blips |
| 4 | FastAPI `/ws/patients` WebSocket endpoint | Medium | Prerequisite for LAN-first architecture |
| 5 | Replace `useRealtimeSubscription` with native WebSocket hook | Medium | Removes Supabase Realtime dependency |
| 6 | Docker packaging for PHC on-premises deployment | Medium | Enables clean LAN handoff to PHC MIS |
| 7 | Middleware config update for local FastAPI URL | Low | Finalizes LAN handoff |

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

## 6. Short-Term Action Plan (Before PHC Handoff)

These are the minimum changes required to make the current cloud-based deployment tolerant of weak internet conditions:

1. **Update `app/nurse/hooks/useRealtimeSubscription.ts`** to track channel status and activate a polling fallback at 5-second intervals when the WebSocket is not `SUBSCRIBED`.

2. **Update `app/transfer/hooks/useRealtimeSubscription.ts`** with the same dual-mode pattern.

3. **Update `app/monitor/hooks/useRealtimeSubscription.ts`** with the same dual-mode pattern (8-second poll interval).

4. **Add a `ConnectionStatusBanner` component** to the nurse and transfer layout shells — a slim, non-intrusive bar that reads "Reconnecting..." when `navigator.onLine` is false or the Supabase channel status is not `SUBSCRIBED`, and disappears when restored.

5. **Add the `online`/`offline` event listeners** in each hook to trigger a fresh fetch on reconnect and suppress fetch attempts while offline.

These five changes require no new packages and no architectural changes to the existing codebase. They can be implemented incrementally, one hook at a time, without breaking existing behavior.

---

_Last updated: reflects the current cloud-based Supabase Realtime architecture with the documented LAN-first handoff plan for PHC on-premises production deployment._
