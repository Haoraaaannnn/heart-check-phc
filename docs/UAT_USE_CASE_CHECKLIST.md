# Heart Check PHC: User Acceptance Testing (UAT) Use Case Checklist & Verification Matrix

This document provides a comprehensive, structured checklist for User Acceptance Testing (UAT) across the **Heart Check PHC** Queue Management and Analytics System. It is designed for developers, quality assurance testers, Philippine Heart Center (PHC) MIS evaluators, and clinical workstation operators to validate system behavior, verify functional flows, and log operational remarks.

---

## 1. Document Overview & Testing Framework

### 1.1 Purpose
The purpose of this UAT checklist is to:
- Verify that every end-to-end user journey functions in strict accordance with clinical and operational requirements.
- Validate role-based authorization, data consistency, and system resilience under normal and abnormal operating conditions.
- Provide a standardized record where developers and evaluators can document execution timestamps, pass/fail status, defect descriptions, and remedial remarks.

### 1.2 Target Evaluator Groups
1. **PHC MIS & Technical Evaluators:** System administration, security policies, database integrity, route protection, and analytics precision.
2. **Clinical & Nursing Staff (or simulated staff):** Triage workflow, patient calling, status transitions, drag-and-drop transfers, and queue progression.
3. **Outpatients & Public Observers:** Self-service kiosk intake, touch accessibility, mobile SMS alerts, ticket clarity, and TV monitor visibility.

### 1.3 Testing Status Legend
- `[PASS]` The test step executed successfully, and actual behavior matched expected results completely.
- `[FAIL]` The test step did not produce the expected result, indicating a functional defect or unexpected error.
- `[BLCK]` The test step cannot be executed due to an upstream blocking defect or missing dependency.
- `[SKIP]` The test step was deliberately omitted for the current test run with documented justification.

---

## 2. Pre-Test Environment Configuration

Before executing the test cases in this checklist, verify that the following prerequisites are met:

| Component | Target Configuration | Verification Check |
| :--- | :--- | :--- |
| **Frontend Web App** | Next.js running on `http://localhost:3000` | Port active, landing page loads |
| **Analytics Backend** | FastAPI running on `http://localhost:8000` | Health check returns HTTP 200 at `/` |
| **Database Instance** | Supabase PostgreSQL instance connected | Environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` loaded |
| **Seed Accounts** | Verified credentials for each role: | |
| | - `superadmin@phc.gov.ph` (Role: `superadmin`) | Account provisioned in `users` table |
| | - `admin@phc.gov.ph` (Role: `admin`) | Account provisioned in `users` table |
| | - `nurse@phc.gov.ph` (Role: `nurse`) | Account provisioned with cubicle assignment |
| | - `staff@phc.gov.ph` (Role: `staff`) | Account provisioned with desk assignment |
| **Historical Data** | PHC historical dataset seeded | Historical records flagged `is_historical = true` |

---

## 3. Patient Self-Service Kiosk (`app/kiosk/`)

The Kiosk is the primary physical entry point for outpatients arriving at the hospital. All screens must be vertically and horizontally centered in `<main>`, with non-overflow in-flow navigation per project guidelines.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-KIO-001** | First-Time Patient Intake Flow | Kiosk is idle on Welcome screen (`/kiosk`). | 1. Tap "Touch Screen to Start".<br>2. On Patient Type selection, tap "New Patient".<br>3. Select clinic service (e.g., "Consultation").<br>4. Select specialized cubicle/clinic.<br>5. Enter 11-digit mobile number.<br>6. Confirm details on review dialog. | System transitions smoothly through each screen; all elements remain centered; ticket is generated with prefix `C-` followed by the next incremental queue number; record appears in `patients` table with `is_historical = false`. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-002** | Returning Patient Intake Flow | Kiosk is idle on Welcome screen (`/kiosk`). | 1. Tap "Touch Screen to Start".<br>2. On Patient Type selection, tap "Existing / Returning Patient".<br>3. Enter hospital Patient ID (e.g., `PHC-2024-0012`).<br>4. Select service and proceed to ticket generation. | System verifies patient number format; service catalog is presented; generated ticket preserves existing patient identity link; ticket sequence increments properly. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-003** | Service Catalog Selection & Quota Display | Database has active services in `services` table. | 1. Navigate to `/kiosk/pages/kiosk-services`.<br>2. Observe service cards layout and labels.<br>3. Tap a valid service card (e.g., "OPD Screening"). | Service cards display full service title without text truncation or ellipsis; selected card highlights with active theme border; transitions to subcategory or cubicle selection. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-004** | Cubicle & Doctor Routing | Selected service has active cubicles assigned. | 1. Navigate to `/kiosk/pages/kiosk-cubicle-selection`.<br>2. Review available cubicle options.<br>3. Select an active cubicle station. | Cubicle designations and assigned doctors display in full without truncation; selection stores target cubicle in kiosk session state. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-005** | SMS Mobile Number Entry & Validation | Kiosk is on Mobile Input screen (`/kiosk/pages/sms-input`). | 1. Attempt to submit empty input.<br>2. Enter fewer than 11 digits (e.g. `0917123`).<br>3. Enter invalid prefix (e.g. `08123456789`).<br>4. Enter valid Philippine mobile number (`09171234567`).<br>5. Tap "Skip" option. | Invalid or incomplete inputs display inline validation error message; valid number enables "Proceed" button; tapping "Skip" allows queueing without phone number. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-006** | Ticket Generation & Sequence Numbering | All intake inputs completed. | 1. Tap "Confirm and Print Ticket".<br>2. Observe screen transition to `/kiosk/pages/queue-print`.<br>3. Inspect generated ticket number. | Screen displays generated ticket number in bold centered layout; prints ticket via ESC/POS thermal printer or simulated browser print dialogue; sequence strictly adheres to FIFO order for that service category. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-007** | Inactivity Timeout & Session Reset | Patient is mid-flow (e.g., on `/kiosk/pages/kiosk-services`). | 1. Leave touchscreen untouched for 45 seconds.<br>2. Observe warning chime and modal.<br>3. Wait additional 15 seconds without tapping.<br>4. Repeat test, but tap "Continue Session" during countdown. | Warning modal displays a countdown timer; if ignored, session resets to Welcome screen and purges all entered temporary data; if "Continue" tapped, timer resets and current screen is preserved. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-008** | In-Flow Navigation & Cancel Flow | Patient is on any intermediate kiosk screen. | 1. Inspect top navigation bar.<br>2. Tap the in-flow Back button.<br>3. Tap the "Cancel / Start Over" action. | Back button is positioned in-flow (never floating or overlapping content per Rule 9); returns to previous step with preserved state; Cancel returns to Welcome screen and cleans session. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-KIO-009** | Thermal Printer Hardware Telemetry | Physical thermal printer disconnected or out of paper. | 1. Disconnect USB printer or set printer offline.<br>2. Attempt ticket issuance from kiosk. | System detects printer error state; displays polite fallback screen instructing patient to take a smartphone photo of the digital on-screen ticket or receive SMS; kiosk does not crash. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 4. Public Waiting Area TV Monitor (`app/monitor/`)

The Public Monitor displays live queue updates on waiting room televisions. It operates unauthenticated and requires continuous uptime without dimming or freezing.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-MON-001** | Initial Display Load & Screen Centering | Open `/monitor` on high-definition display (1080p / 4K). | 1. Access `/monitor` in fullscreen browser mode.<br>2. Inspect grid layout of called tickets and counters. | Monitor board loads without horizontal scrollbars; layout is centered and legible from a distance of 5 meters; theme contrast meets clinical readability standards. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-MON-002** | Real-Time Ticket Callout Synchronization | Monitor is open; Nurse station updates a ticket. | 1. At nurse station, advance ticket `C-101` to "Serving".<br>2. Observe monitor screen without refreshing the browser. | Monitor receives Supabase Realtime broadcast within 1 second; updates counter display with ticket `C-101` and designated cubicle number instantly. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-MON-003** | Visual Highlight & Flashing Callout | Ticket state updates to active serving. | 1. Nurse calls a waiting ticket.<br>2. Observe the target ticket tile on `/monitor`. | Target tile triggers high-visibility emerald pulse animation for 8 seconds; callout text displays in full without truncation. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-MON-004** | Multilingual Audio Announcement (TTS) | Monitor browser has audio playback permissions enabled. | 1. Advance ticket `P-204` to Cubicle 3.<br>2. Listen to audio output from monitor system. | Web Speech Synthesis API announces callout clearly: "Now calling ticket P-204 to Cubicle 3" followed by bilingual Tagalog notification if configured; audio chime plays prior to speech. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-MON-005** | Screen Wake-Lock API Integration | Monitor running continuously on kiosk/TV browser. | 1. Leave monitor open without user interaction for 30 minutes.<br>2. Verify system sleep state. | Browser Screen Wake-Lock API prevents display from dimming, sleeping, or activating screensavers during operational hours. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-MON-006** | Network Disconnection Telemetry | Monitor loses connection to backend / Supabase. | 1. Disconnect Ethernet or disable Wi-Fi on monitor device.<br>2. Observe screen behavior.<br>3. Re-enable network connection. | Top-right corner displays a subtle network warning banner ("Reconnecting to queue server..."); existing numbers remain frozen rather than disappearing; auto-resyncs upon reconnection. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 5. Nurse & Triage Station Workstation (`app/nurse/`)

The Nurse Station Dashboard coordinates patient triage, vitals recording, and status transitions through Registration and Consultation.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-NUR-001** | Role-Based Station Access Guard | User is unauthenticated or logged in as non-clinical role. | 1. Attempt to navigate directly to `/nurse` while unauthenticated.<br>2. Log in as an unauthorized user.<br>3. Log in as verified `nurse` role. | Unauthenticated user is redirected to `/login`; unauthorized role is redirected to `/unauthorized`; verified `nurse` accesses workstation with assigned cubicle filters loaded. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-NUR-002** | Triage Waiting Queue Inspection | Live patients exist in database with status `WAITING`. | 1. Open `/nurse`.<br>2. Inspect waiting queue table and patient cards.<br>3. Verify patient details. | Patients are ordered strictly chronologically by check-in time; ticket numbers, patient names, and service types display in full without truncation. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-NUR-003** | Call Next Patient (Strict FIFO Enforcement) | Multiple patients waiting in queue. | 1. Identify top patient on queue.<br>2. Tap "Call Next Patient" action.<br>3. Attempt to call a patient deeper in the list without triage override. | Only the top "Serving Next" patient can be called; system updates patient status to `SERVING`; timestamp `serving_started_at` is recorded; monitor updates in real-time. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-NUR-004** | Triage Vitals Quick-Entry Modal | Patient is currently called to triage desk. | 1. Click "Record Vitals" button on patient card.<br>2. Enter Systolic/Diastolic BP (e.g. `120/80`), Heart Rate (`72`), SpO2 (`98%`).<br>3. Tap "Save Vitals". | Input modal validates numerical bounds; vitals are saved to database; patient card reflects updated vitals badge without page reload. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-NUR-005** | Consultation Status Progression | Patient has completed triage vitals intake. | 1. Click "Forward to Consultation Cubicle".<br>2. Select destination cubicle.<br>3. Mark as "Consultation In Progress".<br>4. Mark as "Completed". | Patient record transitions through `WAITING_CONSULTATION` -> `IN_CONSULTATION` -> `COMPLETED`; stage timestamps (`consultation_start`, `consultation_end`) are logged accurately. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-NUR-006** | Overdue Patient Wait Warning (>45 Min) | A patient in queue has waited longer than 45 minutes. | 1. Inspect queue table for tickets older than 45 minutes.<br>2. Observe visual indicators. | Overdue patients display an amber/red pulsating priority badge; triage staff can immediately identify waiting individuals who exceed the clinical SLA threshold. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-NUR-007** | Cross-Service Diagnostic Referral | Patient requires additional ECG or Laboratory testing. | 1. Open active patient action menu.<br>2. Select "Refer to Diagnostic Service".<br>3. Choose secondary department (e.g. "ECG").<br>4. Confirm transfer. | System creates a linked queue item for the secondary service without forcing the patient to return to the kiosk; audit trail logs referral origin. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-NUR-008** | Transit Grace Timer & Idle State Marking | Called patient does not appear at the counter. | 1. Call ticket.<br>2. Allow 5-minute transit grace timer to elapse.<br>3. Click "Mark Idle / No-Show". | Patient status updates to `IDLE`; ticket moves to Idle Numbers panel; monitor ceases calling ticket; slot is freed for the next waiting patient. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 6. Patient Transfer & Doctor Routing Dashboard (`app/transfer/`)

The Transfer Dashboard coordinates queue rotation, auto-assignment to cubicles, and idle patient management.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-TRF-001** | Pointer Events Drag-and-Drop Assignment | Active doctor cubicles and waiting patients displayed on `/transfer`. | 1. Select the top unlocked patient card using mouse, touchscreen, or stylus.<br>2. Drag card over an active cubicle station tile.<br>3. Release card onto target cubicle. | Target cubicle shows drop highlight; confirmation modal appears or immediate assignment occurs; patient moves to the target cubicle's assigned list; room indicator increments. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-TRF-002** | Strict FIFO Queue Discipline (Locked Cards) | Multiple patients waiting in the queue. | 1. Attempt to drag or assign the 2nd or 3rd patient in the queue.<br>2. Inspect UI cues on lower cards. | Lower cards display locked visual styling; pointer events are disabled; user cannot jump patients ahead of the top FIFO ticket. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-TRF-003** | Room Queue Indicators (Waiting vs Assigned) | Multiple patients assigned across various cubicles. | 1. Observe cubicle header badges.<br>2. Count patients currently assigned vs completed. | Each cubicle accurately displays real-time counts for currently active patient and queued buffer patients; numbers reconcile exactly with database state. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-TRF-004** | Idle Number Multi-Stage Recall & Archive | Patient was previously marked `IDLE`. | 1. Open "Idle Numbers" drawer.<br>2. Click "Recall" on idle ticket `C-105`.<br>3. If patient fails to show after 3 recalls, click "Archive". | Recalled ticket re-announces on public monitor and returns to active queue top; archived ticket is permanently closed with reason `NO_SHOW` and cleared from operational boards. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-TRF-005** | Assignment Rollback / 20-Second Undo Window | Patient was just assigned to Cubicle 4 in error. | 1. Complete transfer to Cubicle 4.<br>2. Observe bottom-right toast notification.<br>3. Click "Undo" within 20 seconds.<br>4. Re-test after 20 seconds expires. | Clicking "Undo" reverses assignment and restores patient to their exact previous queue position; after 20 seconds, undo toast closes and assignment is finalized. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-TRF-006** | Physician Break & Availability Toggle | Doctor leaves station for lunch or surgery. | 1. Click doctor status badge on cubicle tile.<br>2. Toggle status from "Available" to "On Break".<br>3. Attempt to drag a patient to this cubicle. | Cubicle dims visually; status badge displays "On Break"; drag-and-drop targeting is rejected; automated routing skips this cubicle until restored to "Available". | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 7. Executive & Operational Analytics Dashboard (`app/dashboard/`)

The Dashboard provides administrative leaders and departmental heads with operational oversight, performance metrics, queue bottleneck analyses, and export capabilities.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-DSH-001** | Executive Overview KPI Calculation | Operational queue data exists for current date. | 1. Log in as `admin` and open `/dashboard`.<br>2. Inspect KPI metric cards: Total Patients, Active Doctors, Avg Waiting Time, Avg Service Time. | Cards calculate values accurately against live database records; formatting conforms to design system; no raw NaN or undefined values appear. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-DSH-002** | Date Range Filter Synchronization | Historical data exists across multiple months. | 1. Select date filter pills: "Today", "Yesterday", "Last 7 Days".<br>2. Inspect KPI metric values and charts. | Dashboard metrics, hourly arrival graphs, and service breakdowns reload dynamically for the selected date range. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-DSH-003** | Queue Route Visualization (`/dashboard/cubicles`) | Active queue stations and routes configured. | 1. Navigate to `/dashboard/cubicles`.<br>2. Inspect animated flowchart nodes and paths.<br>3. Verify connection routes between stages. | Flowchart nodes represent registration, waiting, and consultation stations; animated route dots represent moving queue items; layout matches clinical station topology. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-DSH-004** | Stalled Consultation Visual Alerts | A cubicle consultation has exceeded 35 minutes. | 1. Observe cubicle tiles on `/dashboard/cubicles`.<br>2. Identify consultations exceeding 35 min and 45 min. | Cubicles with consultations >35 minutes display an amber warning badge; consultations >45 minutes display a red alert badge signaling prolonged examinations or missed sign-offs. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-DSH-005** | Forecasting Comparison & Auto-Selection | Python backend running at `localhost:8000`. | 1. Navigate to `/dashboard/pages/analytics`.<br>2. Scroll to "Forecasting & Machine Learning" section.<br>3. Inspect algorithm comparison table (ARIMA, Linear Regression, Holt-Winters, Prophet, Moving Average). | Algorithm comparison table renders Mean Absolute Error (MAE) for all models; system highlights model with lowest MAE as the auto-selected optimal forecast. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-DSH-006** | Bottleneck Stage Table & SLA Compliance | Historical and current queue data available. | 1. Navigate to Bottleneck Analysis tab on `/dashboard/pages/analytics`.<br>2. Inspect stage duration breakdowns and SLA thresholds. | Each stage (Registration, Waiting, Consultation, Carry-out) displays average minutes; stages exceeding hospital SLA (e.g. 60-minute total journey) are clearly highlighted. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-DSH-007** | PHC Time & Motion Multi-Mode Excel Export | User is on Analytics page with export privileges. | 1. Click "Export Excel Report" button.<br>2. On modal, select mode: "Specific Date", "Month", or "All Dates".<br>3. Select target date (e.g., `2024-11-15`) and click "Download". | System calls Python backend export pipeline (`/api/export-excel`); generates multi-tab workbook conforming to PHC Time and Motion analysis schema; browser downloads `.xlsx` file. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-DSH-008** | Comprehensive Patient Search & Table Filter | Multiple patient records exist across dates. | 1. Navigate to `/dashboard/pages/patients`.<br>2. Enter patient number into search box.<br>3. Filter by Service dropdown (e.g. "Pediatric Cardiology"). | Search debounces queries and filters table records accurately; labels, names, and timestamps display in full without text truncation. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 8. SuperAdmin Administration & Governance (`app/superadmin/`)

The SuperAdmin dashboard manages clinics, services, hardware profiles, staff accounts, and security settings.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-ADM-001** | SuperAdmin Enterprise Navigation & Clock | Logged in as `superadmin`. | 1. Open `/superadmin`.<br>2. Verify left-rail sidebar navigation groups.<br>3. Verify sticky top header elements. | Left-rail sidebar displays grouped routes; header displays live Philippine Standard Time (Manila clock), dark/light theme switch, and user profile chip; zero hydration mismatches. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-ADM-002** | User Account Creation & Role Assignment | Logged in as `superadmin` on `/superadmin`. | 1. Click "Add User" button.<br>2. Enter valid email, full name, username, and temporary password.<br>3. Assign role `nurse`.<br>4. Submit form. | Account is created in Supabase Auth and synced to `users` table with role `nurse`; new user appears in account directory immediately. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-ADM-003** | Desk Access Mapping (Cubicle / Room / Counter) | Target user exists in directory. | 1. Click "Manage Access" on target nurse account.<br>2. Check designated cubicles (e.g. Cubicle 1, Cubicle 2).<br>3. Check assigned room and service.<br>4. Click "Save Permissions". | Join tables (`user_cubicles`, `user_rooms`, `user_services`, `user_counters`) update immediately; nurse's scoped view updates on their next login. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-ADM-004** | Kiosk Service Customization & Operating Hours | Logged in as `superadmin`. | 1. Navigate to `/superadmin/customization`.<br>2. Toggle service active/inactive status.<br>3. Modify operating hours (e.g. 07:00 - 16:00).<br>4. Check live Kiosk view. | Inactive services immediately disappear from kiosk touchscreen menu; kiosks outside operating hours display polite closed notice. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-ADM-005** | Administrative Password Reset | A staff member forgot their credentials. | 1. Select staff account from user list.<br>2. Click "Reset Password" action.<br>3. Enter new secure password or trigger reset email. | Temporary password applies securely or reset link is dispatched; user can successfully authenticate with new credentials. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-ADM-006** | System Audit Log & Administrative Overrides | Superadmin performs configuration change. | 1. Modify user role or delete an operational ticket.<br>2. Open Audit Logs tab in SuperAdmin. | Action is logged with actor email, timestamp, IP address, target entity, and before/after state diff. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 9. Authentication, Sessions & Access Control (`proxy.ts`, `/login`)

Validates server-side route guards, session persistence, unauthorized page routing, and attempt rate limiting.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-AUT-001** | Valid Credential Login & Cookie Issuance | User has valid registered account. | 1. Navigate to `/login`.<br>2. Enter correct email and password.<br>3. Click "Sign In". | System validates credentials; sets secure session cookie; redirects user to appropriate dashboard based on their role (`/superadmin`, `/dashboard`, or `/nurse`). | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-AUT-002** | Brute-Force Rate Limiting & Account Lockout | User is on `/login`. | 1. Enter invalid password 5 consecutive times for the same account.<br>2. Observe response on 5th failure. | System logs failed attempts in `login_attempts` table; triggers temporary account lockout (e.g. 15-minute cooldown) with informative security message. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-AUT-003** | Server-Side Route Guard (Unauthenticated) | User has no active session cookie. | 1. Directly enter URL `http://localhost:3000/superadmin`.<br>2. Directly enter URL `http://localhost:3000/dashboard`.<br>3. Directly enter URL `http://localhost:3000/nurse`. | `proxy.ts` intercepts request server-side before rendering; immediately redirects browser to `/login?redirectTo=...`; no protected UI flashes on screen. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-AUT-004** | Role Access Guard (Unauthorized Role) | Logged in as `nurse` or `staff`. | 1. Attempt to navigate directly to `/superadmin`.<br>2. Attempt to navigate directly to `/dashboard`. | `proxy.ts` verifies role from session; intercepts unauthorized access; redirects user to `/unauthorized` access-denied page with "Return to Station" button. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-AUT-005** | Password Recovery Flow & Token Expiry | Registered email exists in system. | 1. On `/login`, click "Forgot Password?".<br>2. Submit registered email.<br>3. Verify recovery token link dispatch.<br>4. Attempt to use expired token. | Recovery link is generated; valid token allows setting new password; expired or manipulated token displays clear error rejecting update. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-AUT-006** | Explicit Sign-Out & Cookie Destruction | User is logged in to any dashboard. | 1. Click user profile chip on header.<br>2. Click "Sign Out".<br>3. Click browser back button after logout. | Session cookies are destroyed; browser redirects to `/login`; pressing back button cannot access cached authenticated screens. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 10. Hardware Resilience, Network Edge Cases & Concurrency

Validates error recovery when network connections drop, API servers timeout, or concurrent operations occur.

| Use Case ID | Scenario / Feature | Preconditions | Test Execution Steps | Expected Result | Status | Remarks & Tester Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC-EDG-001** | Database Network Interruption During Intake | Kiosk is generating ticket. | 1. Simulate network drop right before "Confirm and Print".<br>2. Observe kiosk error handling. | Kiosk displays retry prompt without crashing; does not generate orphaned duplicate ticket numbers. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-EDG-002** | Python Backend Analytics Timeout Fallback | Python backend service stopped or unreachable. | 1. Stop Python backend process (`pkill uvicorn`).<br>2. Open `/dashboard/pages/analytics`.<br>3. Observe page behavior. | Frontend detects backend unavailability; displays a graceful error fallback card informing user of backend status; does not white-screen or crash Next.js app. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-EDG-003** | Concurrent Queue Calling by Two Workstations | Two nurse workstations open for the same department. | 1. Both nurses simultaneously click "Call Next Patient" on the same top ticket. | Database locking or atomic update guarantees ticket is assigned to exactly one nurse; second nurse receives notice that ticket was already claimed; no duplicate assignments occur. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |
| **UC-EDG-004** | Rapid Double-Clicking & Duplicate Submission | User is on kiosk ticket print button or transfer action. | 1. Rapidly double-click or triple-tap the "Confirm Ticket" button within 200ms. | Button disables immediately upon first tap with loading spinner; only one ticket record is inserted into the database. | [ ] PASS<br>[ ] FAIL<br>[ ] BLCK | |

---

## 11. UAT Sign-Off & Evaluator Summary

Upon completion of the test cases above, the lead evaluator and developers must document their sign-off status below:

| Metric | Target | Actual | Notes |
| :--- | :--- | :--- | :--- |
| **Total Test Cases Executed** | 45 | | |
| **Total Passed** | 45 | | |
| **Total Failed** | 0 | | |
| **Total Blocked / Skipped** | 0 | | |
| **Pass Rate Percentage** | 100% | | |

### Evaluator Signatures

- **Lead Developer:** ___________________________ Date: _______________ Status: `[APPROVED / REVISE]`
- **PHC MIS Evaluator:** ________________________ Date: _______________ Status: `[APPROVED / REVISE]`
- **Clinical Nurse Lead:** _____________________ Date: _______________ Status: `[APPROVED / REVISE]`

---

## 12. Developer "Where to Edit" Reference Guide

When defects are flagged during UAT execution, consult the following component map to locate and patch the relevant code:

| Subsystem / Area | Component Scope | Source Files & Directories |
| :--- | :--- | :--- |
| **Kiosk Intake Flow** | Touchscreens, cards, keypad, printer | [app/kiosk/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/README.md), `app/kiosk/pages/` |
| **Public TV Monitor** | TV display board, speech synthesis, wake-lock | [app/monitor/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx), `app/monitor/components/` |
| **Nurse Station** | Patient triage, vitals modal, calling logic | [app/nurse/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/README.md), [app/nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx) |
| **Transfer Dashboard** | Drag-and-drop, doctor cubicle assignment | `app/transfer/`, [docs/TRANSFER_DASHBOARD.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/TRANSFER_DASHBOARD.md) |
| **Admin Analytics** | Overview KPIs, charts, forecasting, Excel export | [app/dashboard/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/README.md), [app/dashboard/pages/analytics/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/README.md) |
| **SuperAdmin Governance**| RBAC users, desk access, operating hours | [app/superadmin/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/README.md), `app/superadmin/components/` |
| **Authentication & Proxy**| Route guards, session validation, cookie security | [proxy.ts](file:///home/jensen/Github-Repositories/heart-check-phc/proxy.ts), `app/api/auth/` |
| **Python Backend API** | FastAPI endpoints, ARIMA, queue modeling, export | [python_backend/main.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py), `python_backend/analytics/` |
| **Database Policies** | Supabase PostgreSQL RLS, join tables, schema | [docs/DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/DATABASE_SCHEMA.md), [docs/SECURITY.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SECURITY.md) |
