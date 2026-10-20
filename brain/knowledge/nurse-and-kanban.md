# Nurse Station & Consultation Kanban

This document details the clinical ergonomics, state progression, audio callout system, and offline capabilities of the **Heart Check PHC Nurse Station (`/nurse`)**.

---

## 1. Ergonomic 3-Column Kanban Layout

The nurse consultation workstation is structured around an intuitive 3-column Kanban board:

```
┌────────────────────┬────────────────────┬────────────────────┐
│      WAITING       │       ACTIVE       │     COMPLETED      │
│     (Next in Line) │    (In Cubicle)    │      (Done)        │
├────────────────────┼────────────────────┼────────────────────┤
│ [Ticket C001]      │ [Ticket C002]      │ [Ticket C003]      │
│ Old Patient        │ Duration: 12m 45s  │ Finished: 09:15 AM │
│ Top lock: draggable│ Doctor: Dr. Ramos  │ Doctor: Dr. Ramos  │
│                    │                    │                    │
│ [Ticket C004]      │                    │ [Ticket C005]      │
│ Locked (Pos: #2)   │                    │ Finished: 08:50 AM │
└────────────────────┴────────────────────┴────────────────────┘
```

### Column Roles
1. **Waiting Lane:** Displays patients assigned to the active room or cubicle. Enforces FIFO discipline (only top card is interactive).
2. **Active Lane:** Represents the patient currently undergoing consultation. Displays live consultation timer, assigned doctor, and stage actions ("Complete Consultation", "Hold / Rotate").
3. **Completed Lane:** Roster of completed consultations for the current day with timestamp records.

---

## 2. Consultation State Progression

When a patient is called into the cubicle:
1. Moving the patient into "Active" triggers an optimistic UI update and writes `consult_start = NOW()` to Supabase.
2. The active consultation duration timer starts ticking.
3. If the timer exceeds department average duration thresholds (e.g., > 20 minutes), the card badge subtly shifts color to indicate potential clinical delays without alarming patients.
4. Clicking "Complete" writes `consult_end = NOW()`, sets `status = 'Done'`, and moves the card to "Completed".

---

## 3. Web Speech API Audio Callout System

When a nurse clicks "Call Patient":
1. **Chime Sound:** The browser AudioContext plays a gentle double-chime.
2. **Text-to-Speech (TTS):** The Web Speech API (`window.speechSynthesis`) generates a clear voice prompt:
   *"Ticket C001, please proceed to Cubicle 3."*
3. **Monitor Broadcast:** A message is simultaneously dispatched over the Supabase Realtime channel to flash the ticket number on the public waiting room monitor (`/monitor`).

---

## 4. IndexedDB Offline Outbox Pattern

To guard against erratic hospital network connections:
- All status transitions are logged to a local browser IndexedDB outbox before network dispatch.
- If the network drops, the nurse UI continues functioning seamlessly.
- Once connectivity is restored, an automatic synchronization loop flushes all pending status updates in chronological order.

---

## Cross-References

- [Queue Architecture & State Transitions](../architecture/queue-and-state.md)
- [Network Resilience & Offline Safeguards](../architecture/network-resilience.md)
- [Nurse Developer Guide (`app/nurse/README.md`)](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/README.md)
