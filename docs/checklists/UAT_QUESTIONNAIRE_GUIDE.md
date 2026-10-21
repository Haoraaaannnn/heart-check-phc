# Heart Check PHC: System Functional Capabilities & ISO/IEC 25010:2023 UAT Question Formulation Guide

**Last Updated:** 2026-10-21

This guide provides hospital evaluators, clinical leads, quality assurance engineers, and researchers with an exhaustive, subsystem-by-subsystem operational blueprint of the **Heart Check PHC** Queue Management and Analytics System. It details what every component of the system is capable of doing—arranged in the exact operational sequence of the hospital outpatient department (OPD) patient journey: **Kiosk -> Transfer -> Nurse -> Monitor -> Dashboard -> SuperAdmin**—and explains how to translate each functional capability into role-based User Acceptance Testing (UAT) questions grounded in the **ISO/IEC 25010:2023** Software Product Quality Model.

---

## 1. How to Use this Guide to Create UAT Questions

When designing a role-based UAT questionnaire, evaluators must avoid generic questions (such as *"Was the system easy to use?"*). Instead, questions must test **verifiable system capabilities** against specific quality characteristics defined in **ISO/IEC 25010:2023**.

### 1.1 The 4-Step Question Formulation Workflow

```
+----------------------------------------------------------------------------------------------------+
|                               QUESTION FORMULATION WORKFLOW                                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Step 1: Select Subsystem & Capability]                                                           |
|  Identify the exact feature, screen, or operational rule in Sections 3 through 10 of this guide.  |
|  Example: Kiosk Estimated Wait Time (EWT) computation & receipt printing.                         |
|                                     |                                                              |
|                                     v                                                              |
|  [Step 2: Map to ISO/IEC 25010:2023 Characteristic]                                                |
|  Identify which of the 9 quality dimensions this capability impacts:                              |
|  - Functional Suitability (Completeness, Correctness)                                              |
|  - Interaction Capability (Learnability, Operability, Accessibility, UI Aesthetics)                |
|  - Performance Efficiency (Time Behavior, Capacity)                                                |
|  - Reliability (Fault Tolerance, Availability, Recoverability)                                     |
|  - Security (Confidentiality, Integrity, Accountability)                                           |
|  - Safety (Operational Constraints, Risk Mitigation, Safe Failover)                                |
|                                     |                                                              |
|                                     v                                                              |
|  [Step 3: Target the Appropriate Evaluator Role]                                                   |
|  Scope the statement to the stakeholder group that directly operates or experiences the feature:  |
|  - Role 1: Outpatient / Patient Visitor (Kiosk, Waiting Area TV Monitor, SMS Alerts)               |
|  - Role 2: Floor Coordinator / Transfer Officer (Transfer Dashboard / Cubicle Routing)             |
|  - Role 3: Clinical Station Nurse (Nurse Workstation / Consultation Queue Progression)          |
|  - Role 4: Hospital Administrator / Department Head (Executive Analytics Dashboard)                |
|  - Role 5: PHC MIS / System Administrator (SuperAdmin Governance Workstation)                      |
|  - Role 6: Technical QA & Security Auditor (Cross-Cutting Platform & Resilience)                   |
|                                     |                                                              |
|                                     v                                                              |
|  [Step 4: Draft Unambiguous Likert Statement]                                                      |
|  Write a single-barreled statement of observed behavior using a 5-point agreement scale.            |
|  Example: "The printed thermal receipt clearly displayed an Estimated Wait Time range that        |
|            accurately reflected my actual waiting period."                                         |
+----------------------------------------------------------------------------------------------------+
```

### 1.2 ISO/IEC 25010:2023 Quality Characteristics Reference

The 2023 revision of ISO/IEC 25010 establishes 9 product quality characteristics:
1. **Functional Suitability:** Completeness (all required tasks covered), Correctness (precise, accurate outputs), Appropriateness (facilitates goals).
2. **Performance Efficiency:** Time Behavior (response times, latency), Resource Utilization (CPU, memory, bandwidth), Capacity (limits and volumes).
3. **Compatibility:** Co-existence (running alongside other tools), Interoperability (seamless data exchange between Next.js, FastAPI, and PostgreSQL).
4. **Interaction Capability:** (Replaced legacy Usability) Appropriateness Recognisability, Learnability, Operability, User Error Protection, UI Aesthetics, User Engagement, Inclusivity/Accessibility, Self-Descriptiveness.
5. **Reliability:** Faultlessness / Maturity (stable normal operation), Availability (operational uptime), Fault Tolerance (handles hardware/network errors), Recoverability (restores state after failure).
6. **Security:** Confidentiality (PII protected), Integrity (unauthorized changes prevented), Non-Repudiation, Accountability, Authenticity, Resistance (defends against brute-force/injection).
7. **Maintainability:** Modularity, Reusability, Analysability, Modifiability (configuration without code edits), Testability.
8. **Flexibility:** (Replaced legacy Portability) Adaptability (adapts to varying clinic environments), Scalability (scales with patient volume), Installability, Replaceability.
9. **Safety:** (New 9th Characteristic in 2023) Operational Constraints (prevents entering hazardous states), Hazard Identification (detects clinical bottlenecks and overdues), Risk Mitigation (undo protection, locked FIFO), Safe State Preservation (fallbacks during printer or network failure).

---

## 2. Full-System Operational Patient Journey & Topology

The Heart Check PHC OPD clinical workflow follows a strict, sequential three-stage operational patient path, supported continuously by live displays, analytics, and administrative governance:

```
+====================================================================================================+
|                              HEART CHECK PHC: OPD PATIENT JOURNEY                                  |
+====================================================================================================+
|                                                                                                    |
|    [STAGE 1: PATIENT INTAKE]           [STAGE 2: TRIAGE ROUTING]          [STAGE 3: EXAMINATION]   |
|     +---------------------+             +---------------------+            +--------------------+  |
|     |  1. SELF-SERVICE    |   ======>   |  2. TRANSFER &      |  =======>  |  3. NURSE & CLINIC |  |
|     |     KIOSK           |             |     TRIAGE DESK     |            |     WORKSTATION    |  |
|     |  (app/kiosk/)       |             |  (app/transfer/)    |            |  (app/nurse/)      |  |
|     +---------------------+             +---------------------+            +--------------------+  |
|     - Check-in & Type                   - Central Queue Stack              - Scoped Cubicle Board  |
|     - Category/Service                  - FIFO Drag-and-Drop               - Audio Call & TTS      |
|     - Mobile Number SMS                 - Room Buffer Counts               - 3-Column Pipeline     |
|     - Thermal Ticket                    - Doctor Break Toggle              - Drag & Tap Progression|
|     - Status: WAITING                   - 20s Undo Rollback                - Carryout & Done Drawer|
|                                                                                                    |
|                                                    |                                               |
|                                                    v                                               |
|                                                                                                    |
|                                    +-------------------------------+                               |
|                                    |  4. PUBLIC WAITING MONITOR    |                               |
|                                    |     (app/monitor/)            |                               |
|                                    |  - Real-time Sub-second Sync  |                               |
|                                    |  - Emerald Pulse Highlight    |                               |
|                                    |  - Taglish Audio TTS Chime    |                               |
|                                    |  - Screen Wake-Lock Continuous|                               |
|                                    +-------------------------------+                               |
|                                                    |                                               |
|                                                    v                                               |
|                                                                                                    |
|    +-------------------------------+                               +--------------------------+    |
|    |  5. EXECUTIVE DASHBOARD       |                               |  6. SUPERADMIN CONSOLE   |    |
|    |     (app/dashboard/)          |                               |     (app/superadmin/)    |    |
|    |  - Real-time Overview KPIs    |                               |  - Enterprise Left Rail  |    |
|    |  - Route Flowchart & Alerts   |                               |  - Live Manila PST Clock |    |
|    |  - ML MAE Model Selection     |                               |  - RBAC User Management  |    |
|    |  - PHC Excel Multi-Tab Export |                               |  - Service Customization |    |
|    +-------------------------------+                               +--------------------------+    |
|                                                                                                    |
|    +------------------------------------------------------------------------------------------+    |
|    |  7. PLATFORM CORE & 8. NOTIFICATIONS (proxy.ts, Supabase RLS, python_backend, Bell Drop) |    |
|    |  - AES-256-GCM Phone Encryption & Display Masking (0917 •••• 567)                        |    |
|    |  - Zero Clinical Text Truncation / Ellipsis Standard (ADR 004)                           |    |
|    |  - 10-Second AbortController Timeout Resilience & Universal Header Alert Telemetry       |    |
|    +------------------------------------------------------------------------------------------+    |
+====================================================================================================+
```

---

## 3. Subsystem 1: Patient Self-Service Kiosk (`app/kiosk/`)

### 3.1 Operational Role & Clinical Purpose
The Self-Service Kiosk is the primary physical entry point for outpatients arriving at the Philippine Heart Center lobby. It allows arriving patients to register their arrival in seconds, classifies them by patient category, routes them to designated clinical services, and issues a printed thermal ticket with an Estimated Wait Time (EWT) range, initializing their state to `WAITING`.

### 3.2 Exhaustive Functional Capabilities
1. **Welcome & Idle Slideshow with Gesture Overlay:**
   - Runs an automated visual slideshow of PHC informational slides when idle.
   - Overlays a low-profile bottom scrim gradient (11-stop upward ease from 85% to 0% opacity, ~16vh) with a touch hand gesture icon (`bx bxs-hand-up`) and tap prompt, inviting interaction without obscuring slides.
   - Tap gesture immediately transitions to the intake workflow with zero lag.
2. **Patient Category Classification (New vs. Old Patient):**
   - Segregates check-in flow into **New Patient** (*Bagong Pasyente*) and **Old / Returning Patient** (*Dating Pasyente*).
   - Tapping either category automatically appends the `type` parameter (`type=new` or `type=old`) and routes directly to `/kiosk/pages/kiosk-services`, dynamically filtering available clinic services. No manual Patient ID entry is required at the kiosk.
3. **Dynamic Clinical Service Catalog (`kiosk-services`):**
   - Renders available clinic services directly from the PostgreSQL `services` table rather than hardcoded arrays.
   - Evaluates service capability flags configured by SuperAdmin:
     - `requires_registration`: Routes patient to triage desk first.
     - `has_subcategories`: Opens sub-specialty selection screen (e.g., Adult Cardiology vs. Pediatric Cardiology).
     - `requires_cubicle`: Prompts for doctor/cubicle selection.
     - `requires_nurse`: Assigns patient to nursing assessment queue.
     - `show_on_monitor`: Controls whether this service broadcasts on public TV.
   - Automatically respects operating hours; closed services display a polite notice.
4. **Service Confirmation Modal (`ConfirmationModal.tsx`):**
   - Opens a centered modal detailing service expectations, requirements, and next steps before proceeding.
   - Cancel returns to service list; Continue routes dynamically based on service flags.
5. **Mobile Number Intake & Data Privacy:**
   - Collects an optional 11-digit Philippine mobile number (`09xxxxxxxxx`).
   - Validates format on keystroke, disabling the proceed action until valid.
   - Provides a prominent "Skip" option, ensuring patients without mobile devices are never blocked from joining the queue.
   - Encrypts submitted phone numbers using authenticated AES-256-GCM prior to database storage; displays masked phone format (`0917 •••• 567`) on review dialogs.
6. **Estimated Wait Time (EWT) Computation:**
   - Server-side algorithm calculates projected waiting minutes based on queue depth, active serving stations, and rolling duration averages.
   - Formats raw projections into bounded human-friendly ranges (e.g., *"15 to 25 mins"*, *"Under 10 mins"*) to manage patient expectations realistically.
7. **Hardware Thermal Ticket Printing (Hybrid WebUSB / Network Port 9100 / Linux udev):**
   - Issues a physical receipt via ESC/POS commands containing: PHC Institutional Header, Ticket Number (e.g. `C-101`), Service Name, EWT Range, Check-In Timestamp, and Masked Mobile Number.
   - Supports Direct WebUSB streaming, Network socket printing (Port 9100), and Linux `/dev/usb/lp*` drivers with permanent udev rules.
   - **Hardware Error Fallback:** If the printer is disconnected or out of paper, the kiosk safely catches the error and displays a high-contrast on-screen ticket with instructions to take a smartphone photo or receive SMS, preventing terminal crashes.
8. **Session Inactivity Protection:**
   - Monitored by a 45-second inactivity timer.
   - Triggers an audible chime and centered countdown modal (15-second grace window) asking *"Are you still there?"*.
   - If ignored, purges temporary in-memory session data and resets cleanly to the Welcome screen.
9. **Ergonomic Centering & In-Flow Navigation:**
   - All interactive cards, keypad grids, and modals are centered vertically and horizontally between the top navigation bar and wave footer per Rule 9.
   - In-flow Back button allows patients to return to prior steps without losing context; floating buttons are prohibited.
   - Strictly complies with ADR 004: zero text truncation or ellipsis on clinic titles or doctor names.

### 3.3 How to Formulate UAT Questions from Kiosk Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **Idle Tap Gesture & Responsiveness** | Interaction Capability (User Engagement) | *"Tapping the idle Welcome screen immediately initiated the intake process without delay or unresponsive touches."* | Role 1 (Patient) |
| **Dynamic Service Selection** | Functional Suitability (Completeness) | *"The kiosk displayed all active clinic services clearly without missing departments or confusing labels."* | Role 1 (Patient) |
| **Mobile Number Validation & Skip** | Interaction Capability (User Error Protection) | *"The keypad prevented invalid phone numbers from being submitted while allowing me to easily skip if I preferred."* | Role 1 (Patient) |
| **EWT Range on Printed Receipt** | Functional Suitability (Correctness) | *"The printed ticket clearly showed an Estimated Wait Time range that set realistic expectations for my queue wait."* | Role 1 (Patient) |
| **Inactivity Warning Countdown** | Safety (Risk Mitigation) | *"The kiosk warned me with an audible countdown modal before resetting, giving me enough time to continue my check-in."* | Role 1 (Patient) |
| **Printer Failure Fallback** | Reliability (Fault Tolerance) | *"When the printer was simulated as out of paper, the screen safely presented a digital ticket fallback without crashing."* | Role 6 (QA Auditor) |

---

## 4. Subsystem 2: Patient Transfer & Doctor Routing Dashboard (`app/transfer/`)

### 4.1 Operational Role & Clinical Purpose
The Transfer Dashboard is the critical second stage of the outpatient journey. Operated by outpatient floor coordinators and triage supervisors, it receives all newly registered patients from the kiosk, inspects the active queue, and routes/transfers each patient to an assigned doctor cubicle or clinical examination bay.

### 4.2 Exhaustive Functional Capabilities
1. **Interactive Station Occupancy Visual Grid:**
   - Renders a real-time grid of all physician cubicles (Cubicle 1 to Cubicle N).
   - Each cubicle card displays: Assigned Doctor Name, Clinical Specialty, Active Serving Patient, and Queued Buffer Count.
   - Updates occupancy indicators live via Supabase Realtime WebSocket subscriptions.
2. **Pointer-Events Drag-and-Drop Assignment:**
   - Allows coordinators to drag waiting patient cards directly onto destination cubicle tiles using mouse, touchscreen, or stylus.
   - Target cubicle highlights with emerald border on drag hover, providing unmistakable visual drop feedback.
   - Releasing the card assigns the patient and increments the cubicle's room buffer count.
3. **Strict FIFO Queue Card Locking:**
   - Enforces ADR 002 (Strict FIFO Queue Discipline): only the topmost patient card in the waiting queue is draggable.
   - All subsequent cards have pointer-events disabled and display locked styling, preventing coordinators from accidentally dragging lower patients ahead of longer-waiting individuals.
4. **Room Buffer Indicators (Active vs. Waiting):**
   - Clearly separates the currently served patient (`active`) from buffer patients awaiting consultation (`waiting in room`).
   - Prevents overloading any single physician cubicle beyond clinical capacity caps.
5. **20-Second Rollback Undo Toast:**
   - When a patient card is dropped onto a cubicle, a high-contrast toast notification appears at the bottom-right: *"Assigned ticket C-101 to Cubicle 3 [Undo]"*.
   - Clicking "Undo" within 20 seconds reverses the assignment atomically, returning the patient to their exact prior position in the queue.
   - After 20 seconds, the window closes and the transfer is finalized.
6. **Physician Break & Availability Toggling:**
   - Coordinators can toggle a physician's status badge between **Available** and **On Break** (or Rounding).
   - Toggling to "On Break" visually dims the cubicle, disables drop targeting, and prevents automated routing algorithms from assigning patients to that room.
7. **Idle Numbers Drawer & Multi-Stage Recall/Archive:**
   - Houses all tickets marked as `IDLE` or `SKIPPED` in a slide-out drawer.
   - Coordinators can trigger **Recall** (re-announcing the ticket on the TV monitor and returning it to the queue top).
   - If a patient fails to appear after 3 recalls, the coordinator can permanently **Archive** the ticket with audit reason `NO_SHOW`, safely clearing the active operational state.

### 4.3 How to Formulate UAT Questions from Transfer Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **Drag-and-Drop Responsiveness** | Interaction Capability (Operability) | *"Dragging patient cards to assign them to doctor cubicles felt smooth, responsive, and visually intuitive."* | Role 2 (Coordinator) |
| **Drop Zone Visual Feedback** | Interaction Capability (Appropriateness Recognisability) | *"The destination cubicle clearly highlighted when hovering a card over it, confirming the target room."* | Role 2 (Coordinator) |
| **Locked Non-FIFO Queue Cards** | Safety (Risk Mitigation) | *"The system prevented dragging lower queue cards out of order, preserving strict chronological fairness."* | Role 2 (Coordinator) |
| **20-Second Undo Window** | Interaction Capability (User Error Protection) | *"The 20-second Undo toast allowed me to easily reverse an accidental room assignment without corrupting the queue."* | Role 2 (Coordinator) |
| **Doctor Break Status Dimming** | Functional Suitability (Completeness) | *"Setting a doctor to 'On Break' safely prevented patients from being assigned to their cubicle during lunch or rounds."* | Role 2 (Coordinator) |
| **Idle Ticket Multi-Stage Recall** | Reliability (Recoverability) | *"The Idle Numbers drawer allowed me to recall skipped patients and re-broadcast their ticket on the TV monitor."* | Role 2 (Coordinator) |

---

## 5. Subsystem 3: Nurse Station & Consultation Queue Pipeline (`app/nurse/`)

### 5.1 Operational Role & Clinical Purpose
The Nurse Workstation is the operational third stage of the patient journey. Positioned at doctor cubicles and clinical consultation bays, nurses monitor patients assigned to their specific cubicle, call them over the monitor with real-time TTS audio announcements, track stage dwell times, and progress tickets across active queue stages (`Assigned` -> `With Doctor` -> `Carryout` -> `Done`). The entire subsystem is purpose-built for high-throughput consultation queue coordination.

### 5.2 Exhaustive Functional Capabilities
1. **Server-Side Route Guarding & Scoped Cubicle Selection:**
   - Intercepted server-side by `proxy.ts` and `requireUser`.
   - Restricts workstation access to authenticated accounts with `nurse` or `admin` roles; unauthorized users redirect to `/unauthorized`.
   - Dynamic station selector in `NurseHeader.tsx` allows nurses to instantly scope the board to their active cubicle, room, or clinic category.
2. **Responsive Dual Navigation Rail (`NurseSidebar.tsx`):**
   - Supports a compact icon-only rail (`w-18` / 72px) to maximize horizontal screen real estate for the 3-column clinical Kanban board.
   - Expandable panel (`w-64` / 256px) displaying full category text labels, live patient count badges, and room/cubicle hierarchies.
   - Can be toggled at any time via the single header control button without cluttering the sidebar canvas.
3. **3-Column Consultation Queue Pipeline (`NurseBoard.tsx`):**
   - Manages outpatient consultation queue stages across 3 distinct columns:
     - **Assigned (`assigned`)**: Patients routed by the transfer officer waiting to be called into consultation.
     - **With Doctor (`with_doctor`)**: Active physician examination currently underway in the cubicle.
     - **Carryout (`carryout`)**: Post-consultation discharge processing and queue finalization.
   - Patient cards display ticket number (`patientNum`), clinic service, subcategory badge, and live ticking elapsed timer.
   - Adheres strictly to Rule 11: all labels wrap naturally (`break-words whitespace-normal`) without truncation.
4. **Multi-Modal Card Manipulation (Drag-and-Drop & Tablet Tap-to-Select):**
   - Pointer-based drag-and-drop (`useNurseDragAndDrop.ts`) with custom drag ghost preview (`NurseDragGhost.tsx`).
   - Tablet Tap-to-Select mode (`NurseSelectionBanner.tsx` and `useNurseSelection.ts`): enables roving tablet nurses to tap a card and tap "+ Move Here" on the destination column without requiring drag gestures.
   - Contextual Quick-Action Dropdown (`NurseQuickActionDropdown.tsx`) and in-card direct advancement buttons (`With Doctor`, `Carryout`, `Done`, and reverse rollbacks).
5. **Real-Time Text-to-Speech Calling & Public Monitor Broadcast:**
   - Single-tap "Call Patient" button triggers Deepgram Text-to-Speech voice announcement ("Calling ticket C-101 to Cubicle 1").
   - Synchronizes sub-second via Supabase Realtime with the Public TV Monitor (`/monitor`), triggering an emerald pulse callout highlight.
   - Renders an active speaking soundwave animation on the nurse patient card while audio is playing.
6. **Live Elapsed Dwell Timers & SLA Alerts (`ElapsedTimer.tsx`):**
   - Renders ticking live timers per card tracking exact dwell duration in current queue stage.
   - Dynamic threshold alerts change colors when dwell times exceed operational SLAs (e.g. green -> amber -> red), highlighting consultations exceeding normal limits.
7. **Stage Progression Lifecycle & Reversible Rollback:**
   - Supports forward progression: `Assigned` -> `With Doctor` -> `Carryout` -> `Done`.
   - Provides instant rollback actions (`Carryout` -> `With Doctor` -> `Assigned`) to correct accidental stage advancements without administrative intervention.
   - Automatically timestamps transitions (`reg_end`, `consult_start`, `consult_end`, `carryout_start`, `carryout_end`) to feed Time and Motion analytics.
8. **Offline-Resilient Write-Ahead Logging (WAL) Outbox Pattern (`lib/offlineQueue.ts` & `useOfflineQueue.ts`):**
   - Commits queue stage transitions to non-volatile IndexedDB disk storage prior to or concurrently with network calls.
   - If workstation power or network drops, cards remain optimistically placed; pending updates automatically flush to Supabase upon reconnection or workstation reboot.
9. **Finished Patient Archive Drawer (`FinishedDrawer.tsx` & `FinishedTable.tsx`):**
   - Slide-over drawer listing all completed (`Done`) patients for the shift.
   - Provides search filtering, total consultation duration metrics, and recall capabilities if a patient needs to be returned to active queue.

### 5.3 How to Formulate UAT Questions from Nurse Station Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **3-Column Consultation Pipeline** | Functional Suitability (Completeness) | *"The 3-column Kanban pipeline (Assigned, With Doctor, Carryout) accurately organized queue tickets assigned to my cubicle."* | Role 3 (Nurse) |
| **Deepgram TTS Audio Calling** | Functional Suitability (Appropriateness) | *"Triggering 'Call Patient' played clear voice audio announcing the ticket number and destination cubicle over the monitor."* | Role 3 (Nurse) |
| **Multi-Modal Card Movement** | Interaction Capability (User Engagement) | *"Advancing patients between stages using drag-and-drop or tablet tap-to-select mode was smooth and responsive."* | Role 3 (Nurse) |
| **Reversible Stage Rollback** | Interaction Capability (User Error Protection) | *"The rollback actions allowed me to easily return a patient to the previous stage if an accidental advancement occurred."* | Role 3 (Nurse) |
| **Live Elapsed Dwell Timers** | Safety (Operational Constraint) | *"Live elapsed timers and color-coded threshold warnings made it easy to identify patients experiencing prolonged consultation times."* | Role 3 (Nurse) |
| **Offline-Resilient WAL Outbox** | Reliability (Fault Tolerance & Recoverability) | *"The workstation preserved patient queue status transitions during simulated network drops and synchronized reliably upon reconnect."* | Role 3 (Nurse) |
| **Finished Patient Archive Drawer** | Functional Suitability (Completeness) | *"The Finished Patient slide-over drawer enabled quick searching and auditing of completed consultation records."* | Role 3 (Nurse) |

---

## 6. Subsystem 4: Public Waiting Area TV Monitor (`app/monitor/`)

### 6.1 Operational Role & Clinical Purpose
The Public TV Monitor provides continuous, real-time queue visibility across outpatient waiting rooms. Mounted on large high-definition displays, it broadcasts currently called tickets, active cubicle numbers, and bilingual audio announcements, ensuring outpatients hear and see their turn promptly without congregating at nursing counters.

### 6.2 Exhaustive Functional Capabilities
1. **Fullscreen 1080p / 4K Responsive Grid Layout:**
   - Renders in fullscreen mode on large displays with zero horizontal scrollbars.
   - Employs solid clinical surfaces (`bg-slate-900` / `bg-slate-950` dark mode, crisp borders) for maximum legibility from a 5-to-10-meter viewing distance under bright hospital lighting.
2. **Dual Display Layout Modes (`service.monitor_layout`):**
   - **Cubicle Grid Mode:** Displays designated cubicles (Cubicle 1 to Cubicle N) with large ticket badges, physician names, and real-time occupancy.
   - **Table Mode:** Displays chronological tabular rows of serving and next-in-line tickets for high-throughput service bays (e.g. Blood Extraction, ECG).
3. **Real-Time Supabase WebSocket Synchronization:**
   - Subscribes directly to database mutations on the `patients` table via Supabase Realtime channels.
   - Reflects ticket updates (status changing from `WAITING` to `SERVING`) within 1 second without page refresh.
4. **Visual Callout Highlight Pulse:**
   - When a ticket is called, its monitor tile triggers an emerald green pulsating glow (`emerald-500`) for 8 seconds, drawing patient attention immediately.
5. **Multilingual Text-to-Speech (TTS) Voice Engine:**
   - Leverages browser Web Speech Synthesis API.
   - Plays a clean pre-announcement chime, followed by natural spoken speech: *"Now calling ticket C-101 to Cubicle 2."*
   - Includes bilingual Taglish support based on station configuration (*"Tinatawagan ang ticket C-101 sa Cubicle 2."*).
6. **Browser Screen Wake-Lock API Integration:**
   - Programmatically requests a Wake Lock on the display context.
   - Prevents monitor televisions from sleeping, activating screen savers, or dimming during active clinic hours (07:00 to 18:00).
7. **Network Telemetry & Disconnection Recovery:**
   - Monitors WebSocket heartbeat and network status.
   - If the network drops, displays a non-intrusive warning chip in the header (*"Reconnecting to queue server..."*).
   - Keeps previously displayed tickets frozen on screen rather than blanking out; automatically re-synchronizes when connection restores.
8. **Patient Privacy Protection (RA 10173):**
   - Displays only ticket sequence numbers, service categories, and cubicle stations.
   - Strictly bans broadcasting full patient names on public monitors to safeguard data privacy (RA 10173).

### 6.3 How to Formulate UAT Questions from Monitor Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **Display Legibility from Distance** | Interaction Capability (Aesthetics & Inclusivity) | *"The ticket numbers and cubicle destinations on the TV monitor were clearly readable from across the waiting room."* | Role 1 (Patient) |
| **Real-Time Callout Speed** | Performance Efficiency (Time Behavior) | *"When a nurse called a ticket, the TV monitor reflected the new ticket and counter destination within one second."* | Role 3 (Nurse) |
| **Audio Voice Synthesis Clarity** | Interaction Capability (Appropriateness Recognisability) | *"The spoken audio chime and voice announcement were clear, audible, and easily understood in both English and Tagalog."* | Role 1 (Patient) |
| **Screen Wake-Lock Continuity** | Reliability (Availability) | *"The monitor display remained continuously illuminated without dimming, sleeping, or triggering screensavers."* | Role 5 (SuperAdmin) |
| **Network Loss State Preservation** | Safety (Safe State Preservation) | *"When network connectivity dropped, the monitor retained existing queue numbers rather than showing a blank screen."* | Role 6 (QA Auditor) |

---

## 7. Subsystem 5: Executive & Operational Analytics Dashboard (`app/dashboard/`)

### 7.1 Operational Role & Clinical Purpose
The Executive Dashboard serves hospital administrators, OPD chairpersons, and medical directors. It transforms raw timestamp data into actionable operational insights: tracking throughput KPIs, visualizing patient bottlenecks across clinic rooms, comparing machine learning queue forecasts, and exporting standardized reports for hospital executive meetings.

### 7.2 Exhaustive Functional Capabilities
1. **Executive Overview KPI Metric Cards:**
   - Displays real-time calculations for: **Total Registered Patients**, **Active Doctors on Duty**, **Average Waiting Time** (`HH:MM:SS`), and **Average Service Time** (`HH:MM:SS`).
   - Eliminates raw minute units (e.g. `3348m`), standardizing on clean hour/minute formatting.
2. **Dynamic Date Range Synchronization:**
   - Filter pills allow instant switching between: **Today**, **Yesterday**, **Last 7 Days**, **Last 30 Days**, **Year-to-Date**, and **Custom Date Picker**.
   - Synchronizes hourly arrival curves, service breakdowns, and KPI totals dynamically without full page reloads.
3. **Queue Route Visualization Flowchart (`/dashboard/cubicles`):**
   - Topological animated node graph depicting patient flow across stages: Kiosk -> Transfer Desk -> Consultation Cubicles -> Carryout.
   - Animated route dots represent moving queue volume between stations.
   - Cubicle tiles display live consultation timers, alerting on stalled consultations:
     - >35 minutes: Amber alert badge.
     - >45 minutes: Red critical alert badge.
4. **Machine Learning Forecasting & Auto-Selection (`/dashboard/pages/analytics`):**
   - Connects to the Python FastAPI backend engine (`python_backend/`).
   - Evaluates multiple queue forecasting algorithms: **ARIMA**, **Linear Regression**, **Holt-Winters Exponential Smoothing**, **Prophet**, and **Moving Average**.
   - Calculates **Mean Absolute Error (MAE)** across test sets and auto-highlights the optimal algorithm with lowest error as the recommended forecast.
5. **Bottleneck Analysis Table:**
   - Breaks down average patient dwell time across each operational stage (Kiosk Intake, Transfer Waiting, Doctor Consultation, Carryout).
   - Compares stage averages against hospital Service Level Agreements (e.g., 60-minute target journey), highlighting congested departments.
6. **PHC Time & Motion Multi-Tab Excel Export (`/api/export-excel`):**
   - Generates a fully formatted, multi-tab `.xlsx` workbook adhering strictly to Philippine Heart Center analytical reporting schemas.
   - Supports export by Specific Date, Selected Month, or Full Historical Dataset.
7. **Comprehensive Patient Master Directory (`/dashboard/pages/patients`):**
   - Searchable table supporting instant filtering by ticket code (e.g. `C-101`), database record ID, or service category.
   - Debounced input avoids query thrashing; columns support multi-directional sorting.
   - Full compliance with ADR 004: zero text truncation on long doctor names, ticket codes, or service labels.

### 7.3 How to Formulate UAT Questions from Dashboard Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **KPI Calculation Accuracy** | Functional Suitability (Correctness) | *"The overview metric cards (Total Patients, Avg Wait Time) matched actual hospital operational data accurately."* | Role 4 (Administrator) |
| **Date Range Filter Dynamism** | Functional Suitability (Completeness) | *"Selecting different date filters ('Last 7 Days', 'Yesterday') updated all dashboard graphs and metrics smoothly."* | Role 4 (Administrator) |
| **Queue Route Topological Map** | Interaction Capability (Self-Descriptiveness) | *"The cubicle route flowchart provided a clear, intuitive visual representation of queue flow between clinic stages."* | Role 4 (Administrator) |
| **Stalled Consultation Alerting** | Safety (Hazard Identification) | *"Cubicles with consultations exceeding 35 and 45 minutes were highlighted with visual warning alerts."* | Role 4 (Administrator) |
| **ML Algorithm MAE Comparison** | Performance Efficiency (Resource Utilization) | *"The analytics page compared multiple forecasting models and clearly auto-selected the one with lowest error."* | Role 4 (Administrator) |
| **PHC Multi-Tab Excel Export** | Compatibility (Interoperability) | *"The exported Excel workbook adhered to the hospital's Time & Motion format and opened cleanly in spreadsheet software."* | Role 4 (Administrator) |

---

## 8. Subsystem 6: SuperAdmin Governance & Administration (`app/superadmin/`)

### 8.1 Operational Role & Clinical Purpose
The SuperAdmin Workstation provides PHC MIS administrators and IT personnel with complete governance over user accounts, security roles, physical desk access mappings, dynamic clinic service customization, hardware printer telemetry, and audit logging.

### 8.2 Exhaustive Functional Capabilities
1. **Enterprise Navigation & Philippine Standard Time (Manila Clock):**
   - Built on a fixed left-rail navigation layout (`w-64`) with grouped administration sections.
   - Header features a live ticking Philippine Standard Time (PST) Manila clock and dual-theme toggle (`light`/`dark`) with zero hydration flicker.
2. **Role-Based User Provisioning & Directory:**
   - Creation and editing of staff user accounts with role assignment: `superadmin`, `admin`, `nurse`, and `staff`.
   - Manages account active states and triggers secure administrative password resets.
3. **Granular Desk & Station Access Mapping:**
   - Controls many-to-many access join tables (`user_cubicles`, `user_rooms`, `user_services`, `user_counters`).
   - Allows MIS staff to map specific nurses and physicians to designated cubicles and service counters, ensuring staff only see their authorized operational domains.
4. **Dynamic Clinical Service Catalog Customization (`/superadmin/customization`):**
   - Administrative form allowing administrators to create new services, update ticket prefixes (e.g. `C-`, `P-`), and toggle operational capability flags:
     - `requires_registration`, `has_subcategories`, `requires_cubicle`, `requires_nurse`, `show_on_monitor`, `auto_assign`, `monitor_layout`.
   - Configure clinic operating hours; kiosks automatically close services outside these hours.
   - Deletion uses an accessible high-contrast confirmation modal (`DeleteServiceModal.tsx`) detailing impacted services, replacing native browser dialogs.
5. **Hardware Thermal Printer Telemetry & Setup (`HardwarePrinterConfigCard.tsx`):**
   - WebUSB pairing triggers, direct USB connection status indicator, and local network IP configuration for LAN thermal printers (Port 9100).
   - "Print Test Receipt" action allows administrators to verify hardware connection and ESC/POS alignment directly from the browser.
6. **System-Wide Audit Trail Logging:**
   - Comprehensive audit logging of administrative changes (role elevation, user deletion, station remapping, ticket purge).
   - Records actor email, timestamp, client IP address, target entity, and before/after JSON diffs for administrative accountability.

### 8.3 How to Formulate UAT Questions from SuperAdmin Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **User Account & Role Provisioning** | Functional Suitability (Completeness) | *"Creating staff accounts and assigning role clearances (Nurse, Admin, SuperAdmin) was seamless and reliable."* | Role 5 (SuperAdmin) |
| **Granular Desk Mapping** | Security (Confidentiality & Access Control) | *"Mapping staff accounts to specific cubicles and services accurately restricted their view to assigned stations."* | Role 5 (SuperAdmin) |
| **Dynamic Service Customization** | Flexibility (Adaptability & Modifiability) | *"Adding a new clinic service or updating operating hours immediately reflected on the self-service kiosk."* | Role 5 (SuperAdmin) |
| **Accessible Deletion Modals** | Interaction Capability (User Error Protection) | *"Deleting a service or counter presented an informative modal detailing consequences rather than a generic prompt."* | Role 5 (SuperAdmin) |
| **Hardware Printer Diagnostics** | Maintainability (Testability) | *"The printer configuration tool allowed testing ESC/POS receipts directly from the browser without CLI commands."* | Role 5 (SuperAdmin) |
| **Administrative Audit Logging** | Security (Accountability & Non-Repudiation) | *"The audit log recorded administrative modifications with actor identity, timestamps, and before/after details."* | Role 5 (SuperAdmin) |

---

## 9. Subsystem 7: Cross-Cutting Platform Core, Security & Backend

### 9.1 Operational Role & Clinical Purpose
The platform foundation coordinates security, data privacy, cross-service communication between Next.js and FastAPI, database policies, and clinical data presentation rules. It operates transparently across all workstations to guarantee patient safety and regulatory compliance.

### 9.2 Exhaustive Functional Capabilities
1. **Server-Side Route Guarding & Defense-in-Depth (`proxy.ts`):**
   - Intercepts incoming HTTP requests server-side before rendering components.
   - Enforces `requireSuperadmin` and `requireUser`, redirecting unauthenticated traffic to `/login` and unauthorized roles to `/unauthorized`.
2. **Authenticated Patient PII Encryption (RA 10173 Compliance):**
   - Encrypts patient contact phone numbers with AES-256-GCM prior to database storage.
   - Masks phone numbers on all client screens (`0917 •••• 567`); forbids unencrypted storage.
3. **Historical Research Data Immutability:**
   - All historical research datasets (e.g. 26,000+ records from 2024) are flagged with `is_historical = true`.
   - PostgreSQL RESTRICTIVE RLS policies block `UPDATE` and `DELETE` queries where `is_historical = true`, preventing corruption of scientific research baselines.
4. **Cross-Service HTTP Timeout Resilience & Sanitization:**
   - Next.js API routes calling the FastAPI Python backend enforce an explicit 10-second `AbortController` timeout.
   - If the analytical engine is down, the frontend returns a graceful error card without crashing or white-screening.
   - Backend errors are sanitized to remove raw tracebacks, internal database schemas, or system paths.
5. **Rate Limiting, Cost Protection & Caching:**
   - Sliding-window rate limiters protect public endpoints and SMS dispatch (`app/actions/sendQueueConfirmationSMS.ts`), enforcing a 30-second cooldown per phone number to prevent SMS flooding.
   - Fast in-memory caching (`_dashboard_cache` in Python, `sessionStorage` on frontend) prevents duplicate query execution.
6. **Absolute Ban on Clinical Text Truncation (ADR 004):**
   - Strictly prohibits `truncate`, `text-ellipsis`, or `overflow: hidden` on doctor names, room labels, ticket codes, or operational status badges across all screens.
   - Mandates natural text wrapping (`break-words`, `whitespace-normal`) to eliminate clinical misidentification hazards.

### 9.3 How to Formulate UAT Questions from Platform Core Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **Server-Side Route Protection** | Security (Authenticity & Resistance) | *"Directly navigating to administrative URLs without proper credentials was blocked server-side by the route proxy."* | Role 6 (QA Auditor) |
| **AES-256-GCM Phone Encryption** | Security (Confidentiality - RA 10173) | *"Patient phone numbers were encrypted before database insertion and masked on all clinical workstation displays."* | Role 6 (QA Auditor) |
| **Historical Data Immutability** | Security (Integrity) | *"Database RLS policies strictly prevented accidental deletion or modification of historical research records."* | Role 6 (QA Auditor) |
| **Python Backend 10s Timeout Fallback**| Reliability (Fault Tolerance) | *"When the analytical backend was stopped, the web application displayed a graceful fallback card without crashing."* | Role 6 (QA Auditor) |
| **SMS Dispatch Rate Limiting** | Security (Resistance) | *"The SMS confirmation action enforced a 30-second cooldown per phone number, preventing rapid dispatch flooding."* | Role 6 (QA Auditor) |
| **Zero Clinical Text Truncation** | Safety (Hazard Identification) | *"All doctor names, ticket IDs, and clinic titles wrapped naturally with zero clipped text or '...' ellipsis."* | Role 6 (QA Auditor) |

---

## 10. Subsystem 8: Universal Operational Notifications Subsystem (`NotificationDropdown.tsx`, `useBottleneckNotifications.ts`)

### 10.1 Operational Role & Clinical Purpose
The System Notifications Subsystem actively monitors live outpatient operations across all four workstation headers (SuperAdmin, Admin Dashboard, Nurse Station, and Transfer Station). It continuously evaluates real-time queue states against clinical safety thresholds, alerting hospital staff to prolonged waits, extended doctor examinations, department volume surges, and network interruptions.

### 10.2 Exhaustive Functional Capabilities
1. **Universal Workstation Header Integration:**
   - Persistent notification bell trigger integrated into the top navigation of SuperAdmin, Dashboard, Nurse Station, and Transfer Station.
   - Synchronizes unread badge count across all active views in real time.
2. **Extended Physician Consultation Alerts (>15 Minutes):**
   - Detects when a patient is in consultation (`IN_CONSULTATION` / `with doctor`) exceeding the 15-minute clinical SLA.
   - Triggers red alert card with tag `[Alert]`, displaying ticket code, cubicle number, and elapsed minutes.
3. **Prolonged Queue Wait Warning & Bottleneck Alerts (>15m, >30m):**
   - Monitors unassigned waiting patients.
   - At 16 minutes: Triggers amber warning card with tag `[Warning]`.
   - At 31 minutes: Escalates to high-priority red alert card with tag `[Alert]`.
4. **Queue Volume Surge & Congestion Warnings:**
   - Evaluates department intake volume:
     - >= 5 waiting patients: Amber `[Warning]` (*"Queue Volume Surge"*).
     - >= 10 waiting patients: Red `[Alert]` (*"Queue Congestion Alert: Congestion threshold exceeded"*).
5. **Unattended Idle / Skipped Tickets Alert:**
   - Evaluates count of tickets in `IDLE` or `SKIPPED` state.
   - Triggers actionable warning notifying coordinators that staff triage is required to reactivate or archive. Auto-purges when cleared.
6. **Available Examination Station Notification:**
   - Detects when a cubicle has an on-duty physician, an empty examination room, and patients currently waiting in queue.
   - Triggers blue `[Info]` card (*"Available Clinical Station"*), eliminating idle physician gaps.
7. **Daily Operational Intake & Completion Milestones:**
   - Evaluates daily intake and completed consultations against standard milestones (10, 25, 50, 100, 200, 250, 500).
   - Renders neutral `[Notice]` cards encouraging operational throughput.
8. **Network Disconnection & Reconnection Telemetry:**
   - Listens to browser online/offline events.
   - On disconnect: Triggers amber `[Warning]` (*"System Offline Mode"*).
   - On reconnect: Triggers blue `[Info]` (*"System Online Synchronized"*).
9. **Solid Surface Dropdown with Category Filter Tabs:**
   - Built on solid clinical surfaces (`bg-white dark:bg-slate-900`) with crisp borders, strictly free of blurred glassmorphism.
   - Category filter tabs (`All`, `Alerts`, `Warnings`, `Notices`) allow instant filtering by severity.
   - Full lifecycle management: "Read" (dims card and decrements counter), "Dismiss" (removes card), "Clear all" (purges list).

### 10.3 How to Formulate UAT Questions from Notification Capabilities

| System Capability | Target ISO 25010:2023 Characteristic | Example UAT Question Formulation | Target Evaluator Role |
| :--- | :--- | :--- | :--- |
| **Extended Consultation Alerting** | Safety (Hazard Identification) | *"The notifications dropdown promptly flagged consultations exceeding 15 minutes with a high-visibility alert."* | Role 3 (Nurse) |
| **Queue Volume Surge Warning** | Safety (Risk Mitigation) | *"When 5 or more patients queued for a service, an amber surge notification alerted staff to congestion."* | Role 2 (Coordinator) |
| **Available Station Notification** | Performance Efficiency (Resource Utilization) | *"The system notified staff when an assigned physician cubicle was vacant while patients were waiting."* | Role 2 (Coordinator) |
| **Network Offline / Sync Notices** | Reliability (Availability & Recoverability) | *"When network connectivity dropped and reconnected, clear notifications confirmed offline and online sync states."* | Role 5 (SuperAdmin) |
| **Universal Workstation Visibility** | Interaction Capability (Operability) | *"The notification bell was easily accessible and consistent across SuperAdmin, Dashboard, Nurse, and Transfer headers."* | Role 4 (Administrator) |

---

## 11. Summary Matrix: Subsystem to ISO/IEC 25010:2023 Mapping

This matrix serves as a master checklist when constructing a balanced UAT questionnaire across all 8 subsystems in operational sequence:

| Subsystem | Functional Suitability | Performance Efficiency | Compatibility | Interaction Capability | Reliability | Security | Maintainability | Flexibility | Safety | Total Capability Focus |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Kiosk (`/kiosk`)** | Check-in, Services, EWT | Touch response, print speed | ESC/POS USB, LAN Port 9100 | Centered cards, in-flow nav, tap scrim | Inactivity timeout, paper-out fallback | Masked phone on receipt | Modular pages, bilingual text | Configurable services | Safe reset chime, no PII leak | 8 Capabilities |
| **2. Transfer (`/transfer`)** | Station grid, idle recall/archive | Real-time card drag | Multi-input (mouse, touch, stylus) | Drag drop highlight, 20s undo toast | Atomic state changes, rollback | Scoped coordinator access | Modular drawer components | Scalable cubicle grid | Locked lower cards, break dim | 7 Capabilities |
| **3. Nurse (`/nurse`)** | 3-Column pipeline, calling, carryout | Live stage updates | Tablet tap & desktop drag | High-contrast cards, dwell timers | IndexedDB WAL outbox, real-time sync | Role guard (`requireUser`) | Scoped cubicle join tables | Finished drawer recall | Overdue timer alert, reversible rollback | 9 Capabilities |
| **4. TV Monitor (`/monitor`)** | Live queue board, room calling | Sub-second sync (<1s) | Web Speech API audio | High-contrast board, emerald pulse | Reconnect warning, state freeze | Masked names (no PII on TV) | Dual layout (grid vs table) | Fullscreen 1080p to 4K | Wake-Lock, frozen state | 8 Capabilities |
| **5. Dashboard (`/dashboard`)** | Overview KPIs, Excel export | ML auto-select, query caching | Multi-tab Excel (.xlsx) | Route flowchart, bottleneck tables | Timeout fallback, error bounds | Scoped admin access | Modular chart widgets | Dynamic date grouping | Stalled consult badges | 7 Capabilities |
| **6. SuperAdmin (`/superadmin`)** | User directory, operating hours | Fast DB mutations | Hardware printer telemetry | Enterprise left-rail, Manila clock | Audit log persistence | Granular RBAC, password reset | Configuration via UI | Dynamic service creation | Accessible delete modals | 6 Capabilities |
| **7. Core & Security** | Route guards, rate limits | Parallel chunking, in-memory cache | Next.js to FastAPI interop | Dual-theme, zero hydration flicker | 10s AbortController timeout | AES-256-GCM, RLS immutability | JSDoc coverage, strict types | Scalable connection pooling | Zero clinical text truncation | 6 Capabilities |
| **8. Notifications** | Prolonged wait, surge alerts | Real-time 500ms debounced event | Universal header integration | Solid surfaces, severity filter tabs | Persistent read/dismiss sets | Auto-purge on resolution | Centralized text dictionary | Scoped to active day | Real-time clinical risk alerts | 9 Capabilities |

---

## 12. Companion Documents

- **Ready-to-Administer Questionnaire:** [docs/checklists/UAT_ROLE_BASED_QUESTIONNAIRE.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_ROLE_BASED_QUESTIONNAIRE.md)
- **Functional Verification Matrix:** [docs/checklists/UAT_USE_CASE_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md)
- **Master QA Index:** [docs/checklists/README.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/README.md)
- **Second Brain Index:** [brain/INDEX.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/INDEX.md)
