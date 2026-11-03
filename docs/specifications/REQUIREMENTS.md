# Heart Check PHC: Software Requirements Specification (SRS)
## Functional and Non-Functional Requirements

**Project Title:** Heart Check PHC — A Kiosk-Based Queue Management and Analytics System  
**Institution:** Philippine Heart Center (PHC), Outpatient Department (OPD)  
**Academic Affiliation:** BS Computer Science, STI College Caloocan  
**Authors:** Justin Dayle D. Caasi, Reign Daniel C. Gutierrez, Lenardo R. Jualo, Jensen B. Urrutia  
**Document Version:** 2.1.0  
**Effective Date:** 2026-11-03  
**Implementation Basis:** Direct Source Code Reference (Next.js 15 App Router, FastAPI Analytics, Supabase PostgreSQL 15, IndexedDB WAL Outbox, Deepgram Aura TTS, UniSMS Gateway, WebUSB ESC/POS)

---

# 1. Functional Requirements

## 1.1 Patient Requirements (Kiosk Check-In Interface)
The following modules are designed for use by outpatient patients who access the system through the physical touchscreen self-service check-in kiosk located at the entrance of the Philippine Heart Center Outpatient Department (`app/kiosk/`).

### 1.1.1 Patient Classification and Welcome Module
This module serves as the patient's primary entry point into the self-service check-in workflow (`app/kiosk/pages/kiosk-new-old-selection/`). The screen presents an institutional header and an instructional banner prompting patients to declare their visit category by selecting either "Bagong Pasyente" (New Patient) or "Dating Pasyente" (Old / Returning Patient). New patients are automatically flagged for mandatory intake at the front-desk registration counters (`requires_registration = true`) for official hospital record creation, while returning patients possessing an existing hospital identification are permitted to proceed directly to clinical triage and room assignment.

### 1.1.2 Services Catalog Menu Module
This module presents the directory of available outpatient clinical services (`app/kiosk/pages/kiosk-services/`). Dynamically populated from the `services` database table, the interface renders an expansive, horizontally centered touch grid (`max-w-[1650px]`) displaying services such as General Consultation, OPD Screening, Medical Certificate, Electrocardiogram (ECG), Warfarin Clinic, and specialized cardiac diagnostics. Each service card presents a bilingual Filipino title and English subtitle, a medical Boxicon glyph resolved dynamically via `resolveServiceIcon`, an interactive directional arrow, a sticky greetings header, and visual scroll indicator pills with bouncing chevrons and gradient shadows to assist elderly patients in browsing overflowing lists.

### 1.1.3 Demographic Age Triage Module
This module executes demographic age segmentation for clinical services requiring specialized physician pools (`app/kiosk/pages/category-selection/`). When a patient selects a service configured with `has_subcategories = true` (such as General Consultation), the module presents an age-bracket selection interface prompting the patient to choose between "Adult" (19 years of age and older) and "Pediatric" (18 years of age and younger). The module sets the `subcategory` state attribute, ensuring that adult patients are directed to adult cardiology cubicles and pediatric patients are routed to pediatric cardiology examination rooms.

### 1.1.4 Attending Physician and Cubicle Selection Module
This module enables patients undergoing scheduled medical consultations or follow-up evaluations to select their designated physician (`app/kiosk/pages/kiosk-cubicle-selection/`). Dynamically querying the `cubicle_selector`, `cubicle`, and `doctors` tables, the module renders active consultation cubicles along with the attending physician's full credentials (`Dr. <Name>`). Cards incorporate multi-line text wrapping without truncation to accommodate long physician names. Patients with scheduled appointments select their specific doctor's cubicle, while walk-in patients or those without a preference may select an automated distribution option that forwards the preferred cubicle array to the transfer triage desk.

### 1.1.5 Mobile Contact and Data Privacy Consent Module
This module captures patient contact numbers for automated queue alerts while enforcing statutory compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) (`app/kiosk/pages/sms-input/`). The module provides a full-height touch screen featuring a centered dual-language header, an informational SMS notice card, a formatted phone number display box, and an on-screen numeric keypad (`NumPad.tsx`) with tactile red active borders. The module enforces strict Philippine mobile telephone validation (`phoneValidation.ts`), rejecting invalid prefixes, sequential dummy runs (e.g., `123456`), and repetitive digits (`09111111111`). Patients may enter an 11-digit mobile number or click "Laktawan - Skip" to opt out. Submitted numbers are encrypted at rest using the AES-256-GCM authenticated cipher prior to database persistence.

### 1.1.6 Transaction Review and Confirmation Module
This module provides a pre-submission review screen where patients verify their selected options before committing their record to the database (`app/kiosk/pages/confirmation/`). The module displays a structured summary detailing the chosen Clinical Service, Demographic Category, Attending Cubicle/Doctor, and Masked Mobile Number. Patients can tap "I-edit / Edit" to step backward in the flow or "Kumpirmahin / Confirm" to execute the transaction. Tapping confirm opens a portaled dialog (`ConfirmationModal.tsx`) rendered directly into `document.body` with `z-[100]` and `backdrop-blur-md` (blur 8px), obscuring and locking all background navigation controls while executing the atomic `create_patient` stored procedure.

### 1.1.7 Queue Ticket Issuance and Hardware Thermal Printing Module
This module generates the official queue credential and triggers physical receipt issuance upon transaction confirmation (`app/kiosk/pages/queue-print/`). The module calls the hardware print endpoint (`/api/print-ticket`) to compile binary ESC/POS command streams dispatched to an attached thermal receipt printer via WebUSB (`useWebPrinter.ts`) or raw TCP network sockets. The printed slip features the official Philippine Heart Center header, bold queue ticket number (e.g., `C001`), service category, assigned cubicle/counter, check-in timestamp in Philippine Standard Time (PHT), and hybrid Estimated Wait Time (EWT). If the thermal printer is offline, disconnected, or out of paper, the module automatically activates an on-screen camera photo fallback card (`QueuePrintFallbackCard.tsx`), instructing the patient to photograph their digital ticket without halting terminal operations.

### 1.1.8 Inactivity Timeout, Hospital Chime, and Idle Slideshow Module
This module prevents terminal lockup from abandoned patient sessions (`IdleRedirectWrapper.tsx`, `app/kiosk/slideshow/`). If no touch or keyboard interaction is detected across kiosk pages for 45 seconds, the module synthesizes an acoustic two-tone hospital warning chime via the browser-native Web Audio API (`kioskChime.ts`) and presents a high-contrast modal dialog (`InactivityTimeoutModal.tsx`). The dialog renders a 60fps continuous circular SVG progress countdown ring (`CountdownProgressRing`). If the patient touches "Magpatuloy / Continue", the session resumes; if unacknowledged after 15 seconds, all entered patient data is purged, and the terminal redirects to the full-screen idle slideshow (`/kiosk/slideshow`), which cycles institutional imagery until tapped.

---

## 1.2 Public Display Requirements (Waiting Room Television Monitor)
The following modules are designed for public waiting room television monitors deployed across the outpatient waiting lounges to provide real-time queue visibility (`app/monitor/`).

### 1.2.1 Monitor Category Selector Gateway Module
This module provides an administrative launch portal for display screens positioned throughout the facility (`app/monitor/page.tsx`). Display terminal operators select which clinical department or service the television monitor is assigned to display. For services with adult and pediatric divisions (such as Consultation or OPD Screening), the module presents secondary subcategory pickers (`Adult` vs. `Pedia`), configuring the monitor to subscribe specifically to matching queue events.

### 1.2.2 Web Audio Autoplay Gate Module
This module bypasses browser autoplay security restrictions that block unprompted audio announcements on commercial television displays (`app/monitor/components/StartScreen.tsx`). Upon launching a monitor route, the screen displays a dedicated interactive prompt: "Click to Start Audio Chime". Tapping or clicking the screen initializes the browser's Web Audio API audio context, unlocking low-latency playback of queue attention chimes and voice callouts for all subsequent patient calls.

### 1.2.3 Paired Cubicle Layout Module
This module formats the public visual display for multi-cubicle consultation clinics (`app/monitor/components/PairedLayout.tsx`). The interface renders consultation cubicles side-by-side, displaying the cubicle identifier, attending physician name, active consultation elapsed timer (`ElapsedTimer.tsx`), and current queue status. When active stations exceed 4, the module automatically activates an adaptive 4-column matrix split (Queue, Room, Queue, Room) to eliminate vertical overflow and preserve zero-scroll fit.

### 1.2.4 Table Grid Layout Module
This module provides a multi-patient matrix grid for high-volume diagnostic and procedural areas bypassing cubicles, such as the ECG room, Warfarin clinic, or blood extraction stations (`app/monitor/components/TableLayout.tsx`). The interface enforces fixed-layout table geometry (`table-fixed`), rendering patient queue numbers, assigned stations, and real-time statuses in a high-density, horizontal matrix that completely prevents horizontal overflow.

### 1.2.5 Registration Counter Quadrant and Column Layout Module
This module provides specialized visual tracking for the front-desk appointment verification counters (`app/monitor/components/RegistrationLayout.tsx`). The module incorporates two responsive display modes:
1. **4-Counter 2x2 Matrix Mode:** When four counters are active, the screen arranges in a widescreen 2-top, 2-bottom quadrant grid. Each counter card splits horizontally into a 60% Now Serving hero section (scaling up to 11.5rem typography) on the left and a 40% Upcoming Queue Roster on the right displaying up to four upcoming tickets (#1 Hero Next in Queue + #2, #3, #4 in-line sequence rows).
2. **5+ Column Default Mode:** When five or more counters are active, the screen renders vertical side-by-side columns with an upper 54% Now Serving card and a lower upcoming queue roster displaying four waiting spots, presenting five visible ticket numbers per counter.

### 1.2.6 High-Visibility Active Calling and Beacon Alert Module
This module highlights stations actively summoning patients. When a patient is called, the corresponding station card on the monitor transitions into an active calling state: displaying a prominent high-contrast amber "CALLING NOW" badge, a fully opaque red card surface, and an animated amber beacon pulse ring (`.animate-monitor-calling`). Concurrently, the monitor triggers a two-tone attention chime and natural voice speech callout without washing out ticket typography.

### 1.2.7 Institutional Light Mode and Zero-Scroll Lock Module
This module enforces clinical visibility standards on public displays (`app/monitor/layout.tsx`). The monitor interface strictly renders in high-contrast institutional light mode (`bg-slate-50`, `bg-white`, brand header `#cc3535`) and completely locks the display within the viewport (`h-screen w-screen overflow-hidden`). A persistent `MutationObserver` actively detects and strips any `dark` class injected by parent theme providers, ensuring 100% zero-scroll presentation across 1080p, 4K, and 720p displays.

---

## 1.3 Registration and Triage Staff Requirements (Transfer Station Interface)
The following modules are designed for use by hospital triage personnel, registration clerks, and care coordinators operating the Patient Transfer Dashboard (`app/transfer/`).

### 1.3.1 Station Claiming and Break Management Module
This module enables front-desk registration clerks to claim specific registration counters and manage operational availability (`hooks/useStationClaim.ts`). Clerks select an available counter (Counters 1 through 5) and subscribe to specific service lanes via `/api/workstation/station-claim`. The module detects station occupancy conflicts, marks claimed counters with the user's identity, and provides an on-break toggle (`on_break: boolean`) that temporarily pauses patient routing to the counter during staff rotations.

### 1.3.2 Strict FIFO Queue Lock and Triage Discipline Module
This module enforces First-In, First-Out (FIFO) queue discipline to prevent queue jumping and patient dissatisfaction (`app/transfer/components/QueuePanel.tsx`). Arriving patients are listed in a chronological triage stack ordered strictly by check-in timestamp (`created_at`). The module programmatically unlocks only the top patient at index 0 (badged as "Serving Next"), allowing them to be assigned to a cubicle. All subsequent patients in the stack remain locked with visual lock badges, strictly preventing staff from cherry-picking or bypassing earlier arrivals.

### 1.3.3 Dual-Mode Patient Transfer and Target Hit-Testing Module
This module provides two complementary interaction paradigms for transferring patients from the triage queue to consultation cubicles or registration counters:
1. **Pointer Events Drag-and-Drop:** Native pointer events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) driving a floating React Portal drag ghost (`DragGhost.tsx`) and dynamic hit-testing (`document.elementsFromPoint`).
2. **Click-to-Select Tablet Mode:** Tapping the unlocked patient card selects it; subsequent tapping of any available cubicle card executes the assignment.

### 1.3.4 Manual Assignment Confirmation Dialog Module
This module provides a pre-commit verification dialog before assigning a patient to a cubicle (`app/transfer/components/ConfirmAssignmentModal.tsx`). When an assignment is dropped or selected, the modal presents the patient ticket number, target cubicle name, subcategory classification, and SMS notification status. Staff review the transfer details and click "Confirm" to commit the assignment to PostgreSQL, preventing accidental transfers caused by touchscreen slip.

### 1.3.5 Offline-Resilient Write-Ahead Logging (WAL) Outbox Module
This module guarantees zero data loss during network disruptions, hospital WiFi dropouts, or power failures (`lib/offlineQueue.ts`, `hooks/useOfflineQueue.ts`). When a patient transfer or counter release is confirmed, the action is committed immediately to a persistent IndexedDB disk outbox before or concurrently with network transmission to Supabase. If the connection fails, the module queues the mutation and automatically flushes pending writes in chronological order upon network reconnection.

### 1.3.6 Realtime Direct Payload Patching Module
This module achieves instantaneous UI updates by eliminating round-trip re-fetch delays (`app/transfer/page.tsx`). When incoming Supabase Realtime `postgres_changes` events arrive, the module inspects the payload and applies 0ms direct in-memory state patching to the local React queue collections. The module maintains a monotonic sequence guard (`todayFetchIdRef`) and a 300ms trailing debounce on background reconciliation queries to prevent outdated responses from overwriting optimistic local state.

### 1.3.7 Dual-Mode Navigation Sidebar and Dynamic Icon Synchronization Module
This module provides a responsive navigation sidebar for switching between outpatient clinical services (`app/transfer/components/Sidebar.tsx`). The sidebar supports two view modes toggled via a single header button: an icon-only rail (`w-18` / 72px) to maximize workstation screen space, and an expanded panel (`w-64` / 256px) displaying full service text labels and real-time patient count badges. The sidebar listens to Supabase Realtime changes on `services`, ensuring that any service icon updated in Superadmin reflects immediately on the workstation sidebar without page reloads.

### 1.3.8 Unresponsive Patient Holding Pool Module
This module manages patients who fail to report to registration counters when summoned (`app/transfer/components/IdleNumbersPanel.tsx`). Staff can transfer unresponsive patients into an "Idle / Unresponsive" holding panel. The module logs the timestamp of the missed call, increments `rotation_count`, and applies a configurable cooldown timer (`cooldown_until`). When the patient returns to the desk, staff can return them to the active queue without requiring them to check in again at the kiosk.

### 1.3.9 Hierarchical Step-Back Navigation Module
This module intercepts browser navigation within the Transfer Dashboard to preserve operational sessions (`BackButton.tsx`). When staff click the back button while inspecting specific rooms or service subcategories, the module navigates backward through the operational hierarchy (Room View to Subcategory View to Category View) rather than triggering browser history pops that would inadvertently log the user out.

---

## 1.4 Point-of-Care Nursing Requirements (Consultation Station Interface)
The following modules are designed for use by clinical nurses stationed at outpatient consultation and screening cubicles (`app/nurse/`).

### 1.4.1 Cubicle Station Claiming and Scoping Module
This module enables clinical nurses to claim one or more consultation cubicles matching their physical station assignment (`hooks/useStationClaim.ts`, `app/nurse/hooks/useNurseData.ts`). Nurses select their assigned room and cubicle numbers via `/api/workstation/station-claim`. The module scopes the nurse's Kanban queue feed strictly to patients directed to their claimed cubicles. Administrative supervisors and head nurses are granted station bypass permissions, allowing them to monitor all active cubicles simultaneously.

### 1.4.2 Four-Stage Kanban Clinical Lifecycle Progression Module
This module manages patient progression through the clinical consultation pipeline using an enterprise 3-column Kanban board with a slide-over archive drawer (`app/nurse/components/NurseBoard.tsx`):
1. **Stage 1 (Assigned Queue):** Displays patients transferred by triage who are waiting in the cubicle hallway, tracking accumulated wait time and offering an audio call button.
2. **Stage 2 (With Doctor):** Initiated when the patient enters the examination room. Clicking "Start Consultation" records `consult_start = NOW()` and starts an active consultation timer.
3. **Stage 3 (Carryout):** Initiated when the physician concludes medical evaluation. Clicking "To Carryout" records `consult_end = NOW()` and `carryout_start = NOW()`, allowing nurses to track post-consultation care, diagnostic laboratory scheduling, prescription releases, and patient counseling.
4. **Stage 4 (Finished Today Drawer):** Concludes the encounter. Clicking "Done" records `carryout_end = NOW()`, sets `status = 'Done'`, and archives the record into a slide-over drawer ledger (`FinishedDrawer.tsx`), preserving screen space for active queues.

### 1.4.3 Deepgram Aura Speech Synthesis (Text-to-Speech) Calling Module
This module generates voice announcements to summon patients into consultation cubicles (`app/api/tts/route.ts`). When a nurse clicks the call action, the system queries the internal TTS proxy, which interfaces with the **Deepgram Speech API** using the `aura-2-amalthea-en` voice model. The announcement is synthesized in clear, natural Philippine English: "Patient C001, please proceed to Cubicle 4." The proxy enforces sliding-window rate limiting (20 requests per minute per IP), Edge Cache-Control headers, and 30-minute in-memory audio caching, allowing repetitive calls to play in 0ms with zero upstream API cost.

### 1.4.4 Offline Write-Ahead Logging (WAL) and Stage Pinning Module
This module protects clinical actions against hospital network disconnects (`lib/offlineQueue.ts`, `app/nurse/hooks/useNurseActions.ts`). Stage transitions and completion actions are committed to an IndexedDB outbox on local disk before network transmission. In-flight mutations are pinned in React state using a monotonic sequence counter (`fetchSequenceRef`), ensuring that temporary connection drops or slow server acknowledgments never revert patient cards to previous stages.

### 1.4.5 Dual-Theme Clinical Surface Standard Module
This module provides enterprise surface contrast across both daytime and nighttime clinical shifts (`app/nurse/components/NurseHeader.tsx`, `constants/themeTokens.ts`). The interface supports institutional light mode and true neutral dark mode (`#0d0d0d`, `#141414`, `#1a1a1a`, `#1f1f1f`, `#242424`, `#2e2e2e`). A sun/moon toggle in the header bar allows nurses to switch themes with hydration-flicker protection, maintaining solid surface borders without glassmorphic blur.

---

## 1.5 Administrative and Analytics Requirements (Executive Dashboard Interface)
The following modules are designed for hospital supervisors, clinic heads, and administrative analysts (`app/dashboard/`).

### 1.5.1 Real-Time Operational Overview Module
This module provides an executive monitoring center displaying live throughput KPIs (`app/dashboard/pages/overview/`). The dashboard presents live cards detailing Total Arrivals, Patients Currently Waiting, Consultations In-Progress, and Completed Encounters. An hourly arrival trend chart visualizes patient influx throughout clinic shifts, while a multi-window date filter (`OverviewDateFilter.tsx`) enables one-click historical evaluation across Today, Yesterday, Last 7 Days, and Month-to-Date with 60-second session caching.

### 1.5.2 Patient Flow Ledger and Audit Table Module
This module provides a filterable audit ledger tracking every patient encounter recorded across the facility (`app/dashboard/pages/patients/`). Supervisors can filter records by date range, service category, demographic subcategory, attending physician, and queue status. Each row details sequential ticket codes, check-in timestamps, registration duration, consultation cycle times, and carryout durations. In strict adherence to RA 10173, patient telephone numbers are rendered in masked format (`0917 •••• 567`).

### 1.5.3 Cubicle Occupancy and Physician Allocation Monitor Module
This module provides real-time visibility into cubicle utilization across all outpatient clinic rooms (`app/dashboard/pages/cubicles/`). The module renders interactive status cards for each cubicle, detailing whether the station is vacant, conducting an examination, or offline. Each card displays the attending physician's credentials, active patient ticket code, elapsed examination duration, and pending queue count, allowing clinic managers to detect delayed examinations and balance workloads.

### 1.5.4 Graphical Historical Dataset Ingestion Module
This module provides a graphical interface for importing historical outpatient records from legacy hospital files (`app/dashboard/pages/import/`). Administrative analysts can drag and drop Microsoft Excel workbooks (`.xls`, `.xlsx`) or CSV datasets directly into the browser. The module validates schema integrity, maps legacy columns (such as mapping "Queuing Time" to `created_at`, "Doctor Seen" to `consult_start`, and "Doctor Completed" to `consult_end`), enforces the `is_historical = true` flag, and executes bulk database commits while validating against duplicate patient encounters.

### 1.5.5 Four-Tier Scientific Analytics Computational Engine Module
This module connects the administrative dashboard with the Python FastAPI scientific backend (`python_backend/analytics/`) to execute an end-to-end analytical pipeline:
1. **Descriptive Analytics (`descriptive.py`):** Calculates volume summaries, service distributions, hourly arrival patterns, and statistical duration percentiles across all service stages.
2. **Diagnostic Analytics (`descriptive.py`, `queue_metrics.py`):** Identifies operational bottlenecks, calculates waiting time variances, evaluates physician utilization rates ($\rho$), and audits delays against official PHC service standards.
3. **Predictive Analytics / Volume Forecasting (`forecasting.py`):** Executes walk-forward rolling-origin back-testing across five time-series forecasting algorithms: Simple Moving Average (SMA), Weighted Moving Average (WMA), Exponential Moving Average (EMA), Linear Regression (LR), and AutoRegressive Integrated Moving Average (ARIMA(1,1,1)), benchmarked against a Seasonal-Naive baseline. The module computes Mean Absolute Error (MAE) and Mean Absolute Scaled Error (MASE), automatically selecting the top-performing model to project next-day patient volume.
4. **Prescriptive Analytics (`queue_metrics.py`, `staffing.py`):** Applies M/M/1 Markovian queueing theory models to each independent consultation cubicle (calculating arrival rate $\lambda$, service rate $\mu$, queue length $L_q$, and wait time $W_q$) and computes multi-server Erlang C ($M/M/c$) benchmark lower bounds. The module generates data-backed policy recommendations detailing optimal physician staffing schedules and appointment cap adjustments.

### 1.5.6 Automated PHC-Compliant Reporting and Excel Export Module
This module automates the compilation and export of official operational workbooks (`app/dashboard/pages/export/`, `export.py`). Interfacing with `/api/export-excel`, the module executes an OpenPyXL script that aggregates patient records, computes stage threshold metrics, and generates a structured multi-tab Microsoft Excel (`.xlsx`) workbook matching official Philippine Heart Center OPD reporting formats.

---

## 1.6 System Administration Requirements (Superadmin Governance Interface)
The following modules are designed for hospital MIS personnel and superadministrators (`app/superadmin/`).

### 1.6.1 Staff Account and Role-Based Access Governance Module
This module provides complete lifecycle management for all hospital user credentials (`app/superadmin/page.tsx`). Superadministrators can create staff profiles, define unique usernames and email addresses, set secure passwords, and assign role-based permissions (`superadmin`, `admin`, `nurse`, and `staff`). The module synchronizes Supabase `auth.users` with the application `users` table, ensuring that permissions are strictly enforced across server route proxies and PostgreSQL RLS policies.

### 1.6.2 Service Catalog and Dynamic Prefix Configuration Module
This module enables administrators to configure the outpatient service directory without altering application code (`app/superadmin/customization/page.tsx`). Superadministrators can register clinical services, define bilingual English and Filipino display titles, assign ticket prefix codes (`queue_prefix` — e.g., C, S, E), set numeric digit padding (`queue_pad_length`), and configure clinical workflow checklist capabilities: mandatory registration routing, age triage subcategorization, doctor cubicle selection, nurse station Kanban display, public monitor broadcasting, and TV display layout styling.

### 1.6.3 Physical Facility and Hardware Resource Mapping Module
This module manages physical clinic infrastructure and hardware peripherals (`app/superadmin/facilities/page.tsx`, `HardwarePrinterConfigCard.tsx`). Administrators can configure consultation rooms, number consultation cubicles, register attending medical doctors and attach them to cubicles, assign registration windows 1 through 5, and pair hardware thermal receipt printers via WebUSB device discovery or static local network IP sockets (port 9100).

### 1.6.4 System Parameter and Security Governance Module
This module centralizes global operational and security parameters (`app/superadmin/constants/settingsTexts.ts`). Administrators can adjust kiosk inactivity timeout thresholds (default: 45s warning, 15s countdown), configure TV monitor alert durations, manage UniSMS cellular gateway API credentials, configure Deepgram speech synthesis parameters, and audit authentication attempt logs.

---

# 2. Non-Functional Requirements

## 2.1 Performance Requirements
The following specifications define the system's execution speed, throughput, response times, and resource utilization across client terminals, backend microservices, and database layers.

### 2.1.1 Kiosk Check-In and Ticket Generation Response Time
The self-service kiosk system shall complete the entire check-in transaction—including demographic validation, telephone number encryption, atomic stored procedure execution (`create_patient`), estimated wait time computation, and ticket rendering—within a maximum duration of **1,500 milliseconds** from the patient's final touch confirmation.

### 2.1.2 Real-Time Queue State Synchronization Latency
Queue state mutations initiated at any clinical workstation (such as calling a patient or advancing an examination stage) shall propagate across the local network and visually repaint on the Waiting Room Television Monitor within **500 milliseconds** under standard local area network operating conditions.

### 2.1.3 Staff Station Optimistic UI State Transition Latency
All user interface interactions executed by triage staff and clinical nurses (including dragging patient cards, clicking stage advancement buttons, and updating station availability) shall exhibit an immediate local visual update latency of less than **100 milliseconds**, maintaining fluid tactile feedback regardless of background database latency.

### 2.1.4 Analytics Computational Engine and Forecasting Benchmark
The Python FastAPI scientific backend shall process historical datasets, assemble descriptive metrics, and generate the full executive analytics report across 10,000 patient records within **2,000 milliseconds**. The five-model walk-forward forecasting back-testing suite shall complete algorithm fitting, error computation, and automated model selection within **5,000 milliseconds**.

### 2.1.5 Database Query Throughput and Indexed Search Latency
The PostgreSQL database engine shall maintain execution times of less than **25 milliseconds** for all frequent operational queue queries. All tables shall maintain composite indexes covering operational query filters, specifically `(is_historical, created_at, status, service, cubicleNum)`.

### 2.1.6 24-Hour Continuous Television Display Memory Stability
The waiting room television monitor application shall operate continuously for **24 consecutive hours** without exhibiting memory leaks, garbage collection stutters, or cumulative heap growth exceeding 250 megabytes, maintaining a stable display frame rate of 60 frames per second.

---

## 2.2 Security and Data Privacy Requirements
The following specifications define the administrative, technical, and cryptographic safeguards implemented to protect patient privacy, system integrity, and role-based boundaries in compliance with Philippine statutory standards.

### 2.2.1 Patient PII Cryptographic Encryption at Rest (AES-256-GCM)
All patient telephone contact numbers collected by the system constitute Personally Identifiable Information (PII) and shall be protected using authenticated symmetric encryption with **AES-256-GCM** (Advanced Encryption Standard in Galois/Counter Mode). Each encrypted record shall incorporate a unique 128-bit authentication tag and a fresh 96-bit cryptographically secure initialization vector (`crypto.randomBytes(12)`). Plain-text phone numbers shall never be committed to database storage.

### 2.2.2 Client-Facing Shoulder-Surfing and Data Masking Standard
All user interfaces accessible to clinical staff, administrators, or supervisors that display patient contact information shall render telephone numbers in an obfuscated format (e.g., `0917 •••• 567`). Decrypted phone numbers shall be restricted strictly to memory buffers during automated SMS dispatch and shall never be transmitted in client-side JavaScript payloads.

### 2.2.3 Multi-Layer Defense-in-Depth Authentication and Route Guarding
Application security shall be enforced through a multi-tier defense architecture. Public routes (`/kiosk`, `/monitor`) shall be physically accessible without credentials. Protected staff routes (`/transfer`, `/nurse`, `/dashboard`, `/superadmin`) shall be guarded on the server side by the Next.js Route Proxy (`proxy.ts`), verifying cryptographic JSON Web Tokens before delivering HTML. Client-side role hooks shall provide secondary UI conditioning.

### 2.2.4 Research Data Immutability and RLS Enforcement
To protect the integrity of the hospital's historical dataset imported for research analysis, the database shall enforce mandatory PostgreSQL RESTRICTIVE Row-Level Security policies (`patients_no_historical_insert`, `patients_no_historical_update`, `patients_no_historical_delete`) requiring `is_historical = false`. Operational clients and staff accounts shall be architecturally prevented from mutating or deleting historical records.

### 2.2.5 Audit Logging, Log Sanitization, and PII Scrubbing
All application logs, diagnostic outputs, and error monitoring feeds shall be subjected to automated data sanitization. System loggers shall detect and scrub raw patient telephone numbers, passwords, auth tokens, and session cookies prior to writing entries, preventing sensitive clinical or identity data from leaking into server logs.

### 2.2.6 SQL Parameterization and Query Injection Defense
All database queries executed across both Next.js server actions and Python backend services shall strictly utilize parameterized query structures (`$1`, `$2`). Any client-supplied search arguments processed via PostgREST filters shall be pre-sanitized by stripping reserved filter characters to eliminate SQL and query injection vectors.

---

## 2.3 Reliability and Fault Tolerance Requirements
The following specifications define the system's operational continuity, resilience against network degradation, and fault recovery mechanisms during clinic hours.

### 2.3.1 Clinic Operational Availability and Uptime Window
The complete Heart Check PHC software platform shall maintain an operational availability of at least **99.5%** during the Outpatient Department's active operating hours, defined as Monday through Friday from 06:00 to 18:00 Philippine Standard Time (PHT), excluding planned maintenance periods.

### 2.3.2 High-Latency Network Socket Resilience and Reconnection Tuning
To operate reliably over congested hospital wireless networks, the client WebSocket connection shall implement specialized keepalive parameters: WebSocket ping heartbeats dispatched every **25 seconds**, a connection acknowledgment grace window of **60 seconds**, and stepped exponential reconnect backoff scaling from **2 to 10 seconds**, preventing aggressive socket tearing during temporary radio interference.

### 2.3.3 Monotonic Sequence Tracking and Anti-Teleportation Defense
Every state-fetching hook deployed across clinical workstations shall maintain a monotonic request sequence counter (`fetchSequenceRef` / `todayFetchIdRef`). If transient packet delays cause an older server response to arrive after a newer response has already rendered, the hook shall detect the obsolete sequence number and discard the stale payload, preventing patient cards from visually jumping backwards.

### 2.3.4 Realtime WebSocket Event Burst Debouncing
To prevent network saturation caused by rapid successive database changes, incoming PostgreSQL realtime events shall pass through a **300ms trailing debounce filter**. Multiple rapid event notifications shall be consolidated into a single coordinated data query, shielding both client workstations and database servers from event storms.

### 2.3.5 Hardware Peripheral Fault Tolerance and On-Screen Fallback
In the event that the attached hardware thermal printer experiences a hardware failure, paper exhaustion, or physical disconnection, the kiosk software shall catch the peripheral error gracefully. The terminal shall immediately render an on-screen digital queue ticket containing the full ticket number and QR code (`QueuePrintFallbackCard.tsx`), allowing the patient to proceed without software crashes.

### 2.3.6 Analytical Computation Exception Catching and Safe Baseline Fallback
If time-series forecasting algorithms (such as ARIMA) encounter mathematical singularities, non-stationary matrix errors, or date gap anomalies caused by hospital holiday closures, the forecasting pipeline shall gracefully catch the exception, log a diagnostic notice, and automatically fall back to the Seasonal-Naive baseline calculation without terminating the analytics API request.

---

## 2.4 Usability and Human Factors Requirements
The following specifications establish interface ergonomics, typography standards, visual design principles, and physical accessibility requirements across all clinical and public interfaces.

### 2.4.1 Bilingual Accessibility and Rapid Touchscreen Intake
The self-service kiosk interface shall feature comprehensive bilingual localization in both English and Filipino across all touch cards, instructional banners, and keypad controls. Intuitive typography and medical iconography shall ensure that elderly patients or first-time hospital visitors can complete check-in within **45 seconds** without requiring staff assistance.

### 2.4.2 Strict Text Readability and Anti-Compression Standard
All textual elements, patient ticket codes, station badges, and column headers across every workstation interface must maintain strict readability standards. Text layouts must enforce **zero vertical character wrapping** (prohibiting single letters from stacking vertically), **zero horizontal squeezing**, dedicated minimum list widths (`w-[340px] shrink-0`), and explicit `whitespace-nowrap` declarations on all ticket identifiers and status pills.

### 2.4.3 Ambient Waiting Room Readability and Zero-Scroll Display Standard
Public waiting room television displays shall strictly enforce institutional light mode (`bg-slate-50`, `#cc3535`) and complete zero-scroll viewport containment (`h-screen w-screen overflow-hidden`). Dark mode rendering is strictly prohibited on monitor screens. Active queue numbers shall utilize enlarged typography (scaling from `text-9xl` to `text-[11rem]`) legible from a distance of at least **15 meters** in crowded waiting halls.

### 2.4.4 Point-of-Care Clinical Touchscreen and Stylus Ergonomics
Clinical workstation interfaces (`/transfer` and `/nurse`) shall feature dedicated touch handling supporting desktop mice, finger touches, and medical stylus pens. All interactive buttons, tabs, and drag handles shall provide a minimum physical touch target size of **44 x 44 pixels** to prevent accidental inputs during rapid patient processing.

### 2.4.5 Enterprise Solid Surfaces and Visual Cleanliness Standard
All administrative and clinical workstations shall adhere to an enterprise solid surfaces visual standard utilizing solid white and slate backdrops (`bg-white`, `bg-slate-50`, `dark:bg-slate-900`) with crisp 1-pixel borders. Unclear blurred glassmorphism, decorative icon wrapper boxes in modal titles, and glowing neon saturated accents are strictly prohibited across all interfaces.

### 2.4.6 Zero Emojis Standard in Clinical Software
In strict compliance with clinical software documentation and interface standards, emojis are completely banned from all user-facing strings, dialog prompts, button labels, source code comments, JSDoc annotations, commit messages, and project documentation. All user cues must rely exclusively on clean typographic hierarchy, approved icons, and professional phrasing.

---

## 2.5 Maintainability and Architectural Standards
The following specifications define the software engineering standards, modular boundaries, type-checking constraints, and documentation practices governing codebase sustainability.

### 2.5.1 The PHC Decoupled Architectural Standard
Every feature module across the application shall strictly enforce the separation of concerns governed by the PHC Decoupled Standard:
1. **Presentation Layer (`components/`):** Composable JSX rendering components containing no hardcoded copy or raw inline style objects.
2. **Text Dictionaries (`constants/*Texts.ts`):** Immutable bilingual string dictionaries exporting all user-facing copy.
3. **Style Dictionaries (`constants/*Styles.ts`):** Centralized CSSProperties style objects and Tailwind token mappings.
4. **Layout Shells (`layout.tsx`):** Viewport-constrained structural shells managing viewport scroll boundaries.
5. **State & Logic Hooks (`hooks/`):** Isolated custom React hooks encapsulating business logic, timers, and data fetching.

### 2.5.2 Strict Type Safety and Zero Unsafe Assertions
The codebase shall enforce strict TypeScript configuration (`strict: true`). The use of `any` types, blind type assertions (`as Type`), and unvalidated non-null assertions (`!`) on database fields is strictly prohibited. All external API inputs, query arguments, and server responses must be validated using Zod schemas or explicit runtime type guards.

### 2.5.3 Cyclomatic Complexity and Nesting Depth Limits
To preserve code readability and simplify unit testing, control flow structures (`if/else`, loops, try/catch blocks) shall not exceed **3 levels of nesting**. Developers must utilize early returns, guard clauses, and helper decomposition to maintain flattened execution paths.

### 2.5.4 File and Function Line Length Budgets
Production source files shall adhere to strict size budgets: target size of **<= 250 lines of code** (hard maximum of 350 lines), and individual functions shall target **<= 40 lines** (maximum of 60 lines). Functions requiring more than three input arguments must accept a single, strongly typed options parameter object.

### 2.5.5 Pure Core Logic and Side-Effect Isolation
Domain business rules—including queue sequence sorting, status state machines, triage classification, and EWT calculation formulas—shall be implemented as pure, deterministic functions. Clocks (`Date.now`), random generators, network calls, and database operations must be injected at caller boundaries to facilitate unit testing.

### 2.5.6 Comprehensive JSDoc Documentation Standards
Every created or refactored component, custom hook, utility module, and server action must incorporate comprehensive JSDoc annotations detailing module overview, `@param` definitions, `@returns` specifications, and clinical architectural considerations.

---

## 2.6 Compatibility and Portability Requirements
The following specifications define the platform's multi-device support, hardware interface compliance, operating system interoperability, and deployment mobility.

### 2.6.1 Multi-Device Client and Web Browser Compatibility
The platform shall be fully functional and visually consistent across modern web browsers, including Chromium browsers (Chrome, Edge, Brave v110+), desktop Safari (v16+), iPadOS Safari, and Android Chrome tablets.

### 2.6.2 Thermal Receipt Printing ESC/POS Command Standard
The ticket printing engine shall adhere to standard ESC/POS printer control command specifications, supporting both 58mm and 80mm thermal receipt printers interfaced via direct WebUSB, serial COM ports, or raw TCP network sockets (port 9100).

### 2.6.3 Dual Deployment Architecture (Cloud Staging and On-Premises LAN)
The platform architecture shall operate seamlessly across two operational deployment targets:
- **Cloud Staging:** Vercel frontend, Railway FastAPI backend, and Supabase PostgreSQL for remote development and testing.
- **On-Premises Production:** Self-contained hospital local area network (LAN) deployment utilizing Dockerized PostgreSQL 15, Node.js runtime, and local Python environment, ensuring 100% operational independence from external internet connectivity during hospital handoff.

### 2.6.4 Cross-Platform Operating System Agnosticism
All server applications, database scripts, and analytics computation modules shall execute consistently across standard server operating systems, including Ubuntu Linux (22.04 LTS / 24.04 LTS), Debian GNU/Linux 12, macOS, and Microsoft Windows Server 2022.
