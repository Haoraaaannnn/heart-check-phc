# Network Resilience & Offline Safeguards

This document specifies the resilience strategies, weak-signal safeguards, WebSocket fallback mechanisms, and offline data buffering engineered into **Heart Check PHC**.

---

## 1. Operating Environment Challenges

The Philippine Heart Center Outpatient Department operates across sprawling clinical wings, thick reinforced concrete walls, and fluctuating hospital Wi-Fi networks. The queue system must remain operational under intermittent connectivity, sudden packet drops, and high-latency conditions.

---

## 2. Weak-Signal Safeguards & Hysteresis

To prevent UI flickering and rapid connect/disconnect loops:

- **300ms Debounce:**
  - Network state transitions (online/offline) are debounced by 300ms before triggering state updates in UI components.
  - Eliminates false-positive disconnect alerts during momentary ping jitter.
- **2-Second Hysteresis Gate:**
  - When returning from an offline state, the system enforces a 2-second stabilization window before declaring full connectivity.
  - Ensures underlying WebSocket handshakes and DNS lookups have completed before flushing queued operations.

---

## 3. Real-Time Channel Reconnection & Polling Fallback

1. **Supabase Realtime Channel Lifecycle:**
   - Client stations maintain persistent WebSocket connections to Supabase.
   - Upon connection loss, the Supabase client automatically executes exponential backoff reconnect attempts.
2. **Periodic Polling Fallback:**
   - If WebSocket reconnects fail after 3 consecutive attempts, stations activate a background HTTP polling loop (fetching active queue state every 5 to 10 seconds).
   - Once WebSocket connectivity re-establishes, the polling loop disengages cleanly.

---

## 4. Clinical Station Offline Outbox (IndexedDB)

The nurse consultation station (`/nurse`) implements an offline outbox pattern:

```
[Nurse Marks Patient Complete]
              │
              ▼
    Check Connection State
     ├── [Online]  ──► Direct PATCH to Supabase API
     └── [Offline] ──► Write state transition to IndexedDB Outbox
                            │
                            ▼
                    Display "Offline Outbox Queued"
                            │
                    [Network Reconnected]
                            │
                            ▼
                    Flush Outbox in FIFO order to Supabase
```

- Guarantees that clinical workflow does not halt if the hospital Wi-Fi drops.
- Prevents data loss during patient consultations.

---

## 5. Local Area Network (LAN) Migration Strategy

- **Multi-Device Local Binding:**
  - During hospital deployment, the Next.js server binds to the local subnet IP (`0.0.0.0:3000`).
  - Allows kiosk terminals, staff laptops, and Android/iOS tablets to communicate over an isolated clinical LAN without traversing external internet hops.
- **On-Premises Database Ready:**
  - Schema, migrations, and backend connectors are engineered to switch from Supabase Cloud to an internal PHC PostgreSQL server by altering environment connection strings.

---

## Cross-References

- [System Architecture Overview](./overview.md)
- [Nurse Station Architecture](../knowledge/nurse-and-kanban.md)
- [Common System Issues & Troubleshooting](../debugging/common-issues.md)
