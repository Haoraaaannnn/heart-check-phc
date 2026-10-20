# PHC Outpatient Department (OPD) Operational Workflow

This document details the patient journey, clinical triage stages, service routing pathways, and operational constraints characteristic of the **Philippine Heart Center Outpatient Department**.

---

## 1. Outpatient Workflow Overview

The Philippine Heart Center Outpatient Department handles hundreds of cardiac patients daily across diverse socio-economic backgrounds and medical acuity levels. The digital system mirrors and accelerates the hospital's five-stage flow:

```
[1. Self-Service Kiosk]
       │  - Category & Patient Type (New vs Old)
       │  - Department Selection & SMS Contact
       │  - Prints thermal queue ticket (e.g. C001)
       ▼
[2. Registration & Triage Desk (/transfer)]
       │  - Document inspection & vital signs screening
       │  - Counter assignment (Counters 1-6)
       ▼
[3. Clinical Queue Allocation]
       │  - Transfer hub routes patient to Consultation or Diagnostic Services
       │  - Enforces FIFO queue discipline
       ▼
[4. Consultation Cubicles (/nurse)]
       │  - 3-column Kanban intake
       │  - Physician examination & medication titration
       ▼
[5. Public Waiting Room Displays (/monitor)]
       │  - Multi-category queue roster
       │  - Active ticket chime & TTS callout
```

---

## 2. Detailed Patient Stages

### Stage 1: Self-Service Kiosk Check-In (`/kiosk`)
- **Arrival Window:** Patients typically arrive between 6:00 AM and 11:00 AM.
- **Categorization:**
  - **Patient Type:** "Old Patient" (returning patient with hospital chart) vs "New Patient" (first-time registration).
  - **Clinical Service:** Consultation, OPD Screening, Warfarin Clinic, Benzathine Penicillin Injection, ECG, 2D-Echo, Holter Monitoring, Laboratory.
- **Contact Ingestion:** Optional mobile phone number input for SMS notifications. Automatically encrypted using AES-256-GCM.
- **Ticket Dispensing:** USB/Serial thermal printer outputs queue slip with ticket number, service name, barcode, and estimated wait time.

### Stage 2: Registration & Initial Triage (`/transfer`)
- Staff at registration desks call patients from the waiting queue stack.
- Documents (PhilHealth, senior citizen IDs, referral slips) are validated.
- Initial vital signs (blood pressure, heart rate, oxygen saturation) are recorded.
- Timestamps logged: `reg_start` and `reg_end`.

### Stage 3: Clinical Routing & Cubicle Assignment
- Patients needing multi-stage diagnostics are assigned to intermediate services (e.g., ECG prior to cardiology consultation).
- In `/transfer`, clinical operators assign the patient to a designated consultation room (e.g., Room 1) and specific doctor cubicle (Cubicles 1 to 8).
- Only the top patient (`index === 0`) in the triage stack can be moved.

### Stage 4: Doctor Consultation (`/nurse`)
- The clinical nurse at the consultation station pulls the patient into "In-Progress".
- Timestamps logged: `consult_start` and `consult_end`.
- The doctor conducts the cardiology consultation, reviews diagnostics, adjusts cardiovascular medications, and schedules follow-up appointments.
- Marking the patient "Done" releases the cubicle for the next patient.

### Stage 5: Waiting Room Broadcast (`/monitor`)
- Large wall-mounted monitors in the OPD waiting areas display real-time rosters.
- Displays are categorized by service lane.
- When a counter or cubicle calls a ticket, the monitor triggers an audio chime followed by text-to-speech announcement: *"Ticket C001, please proceed to Cubicle 4."*

---

## 3. Operational Constraints & Caps

- **Daily Patient Caps:** Certain specialized cardiac clinics enforce maximum patient caps per session (e.g. 50 patients for specific subspecialties) to avoid doctor fatigue.
- **Fixed Cubicle Capacities:** Rooms 1 through 3 have a fixed number of physical doctor cubicles.
- **Historical Data Realities:** Historical consultation data (March 2024 to December 2025) imported into the system reflects real-world variability in doctor arrival times, morning rush hours (7:00 AM - 9:30 AM), and post-lunch consultation surges.

---

## Cross-References

- [Self-Service Kiosk & Printing](./kiosk-and-printing.md)
- [Nurse Station & Kanban](./nurse-and-kanban.md)
- [Queue & State Transitions](../architecture/queue-and-state.md)
