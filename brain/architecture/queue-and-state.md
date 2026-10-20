# Queue Architecture & State Transitions

This document details the queue state machine, FIFO stack discipline, pointer event drag-and-drop mechanics, and cubicle routing rules implemented across **Heart Check PHC**.

---

## 1. Patient Queue State Machine

Patients transition through a strictly defined lifecycle from kiosk check-in to consultation completion:

```
[Patient Arrival at Kiosk]
             │
             ▼
      (State: waiting)  ──► Created in `patients` table with patientNum (e.g. C001)
             │
             ▼
   [Triage / Transfer Desk]
   - Evaluates queue stack
   - Drags top patient (index 0) to Counter or Cubicle
             │
             ▼
   (State: in-progress) ──► Assigned to counter or cubicleNum
   - Sets reg_start or consult_start timestamp
   - Realtime channel updates monitor callout and room badge
             │
             ▼
    [Clinical Service]
   - Staff completes intake / doctor consultation
             │
             ▼
      (State: Done)     ──► Sets consult_end timestamp
                           Queue position released
```

---

## 2. Strict FIFO Queue Stack Discipline

To maintain clinical fairness, adhere to PHC policy, and prevent queue jumping:

1. **Top-Item-Only Lock (`index === 0`):**
   - In `/transfer` and `/nurse`, only the top patient card in the waiting lane ("Serving Next") is draggable or assignable.
   - All subsequent patient cards (`index > 0`) are locked and display their waiting position.
2. **Pointer Event Drag-and-Drop:**
   - Implemented using native Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`) rather than HTML5 Drag and Drop.
   - Guarantees seamless functionality across hospital touchscreen displays, nurse tablet pens, and desktop mice.
3. **Optimistic UI Updates with Realtime Fallback:**
   - When a patient card is dropped onto a counter or cubicle, the local React state updates immediately.
   - An asynchronous PATCH request updates Supabase. If the network drops, state reverts and alerts the clinical operator.

---

## 3. Cubicle and Counter Allocation Mechanics

- **Registration Counters:**
  - Dedicated to initial document verification and screening (e.g. Counters 1-6).
  - Track `reg_start` and `reg_end` to monitor registration desk bottlenecks.
- **Consultation Cubicles:**
  - Assigned to specific doctors and subcategories (e.g. Room 1 Cubicles 1-8).
  - Support multi-patient queue stacks per cubicle with live consultation duration timers.
- **Rotation and Cooldown Handling:**
  - If a patient is called but temporarily unavailable (e.g., attending laboratory testing), staff can rotate the patient.
  - `rotation_count` increments and `cooldown_until` applies a temporary throttle, preventing the patient from blocking subsequent arrivals.

---

## 4. Real-Time Room and Counter Synchronization

- The `/monitor` and `/transfer` stations maintain active Supabase Realtime Channel subscriptions.
- Room badges display dynamic ratios: `Patients Queued : Patients Currently Assigned`.
- Cubicle cards highlight active consultation duration in minutes, flashing subtle warning states when exceeding department averages.

---

## Cross-References

- [ADR 002: Strict FIFO Queue Lock Discipline](../decisions/adr-002-fifo-queue-lock.md)
- [Transfer Station Handbooks (`app/transfer/README.md`)](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/README.md)
- [Nurse Station Architecture](../knowledge/nurse-and-kanban.md)
