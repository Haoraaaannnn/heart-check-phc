# Heart Check PHC: Dashboards & Kiosk Improvement Roadmap and Living Checklist

**Last Updated:** 2026-10-21

This document serves as the master tracking checklist and improvement roadmap for the **Heart Check PHC** Queue Management System. It outlines recommended feature additions, user experience enhancements, architectural refinements, and operational upgrades across the **Patient Self-Service Kiosk** and all **Administrative, Clinical, and Monitoring Dashboards**.

---

## Tracking Conventions

- **Status:**
  - `[ ]` Pending / Backlog
  - `[-]` In Progress / Under Review
  - `[x]` Completed / Implemented
- **Priority:**
  - `Priority` Core operational requirement essential for clinic workflows and UAT
  - `Non-Priority` Secondary operational improvement or efficiency enhancement
  - `Optional` Ergonomic polish, non-essential enhancement, or future hardware addition

---

## 1. Patient Self-Service Kiosk (`app/kiosk/`)

The Kiosk is the primary physical entry point for outpatients arriving at the hospital. Improvements focus on accessibility, hardware resilience, ergonomic touch interactions, and multi-channel notifications.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [x] | Priority | **ESC/POS Thermal Printer Status Telemetry** | Integrate printer hardware status detection (out of paper, paper jam, printer offline, not detected) while permitting queueing even without printer detected. Provide on-screen fallback to photo/SMS ticket. | [QueuePrintContent.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/queue-print/components/QueuePrintContent.tsx), [QueuePrintFallbackCard.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/queue-print/components/QueuePrintFallbackCard.tsx), [statusParser.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/lib/printer/statusParser.ts), [useWebPrinter.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/hooks/useWebPrinter.ts), [route.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/api/print-ticket/route.ts) |
| [ ] | Priority | **Offline Queueing Resilience (Local Queue Buffer)** | If hospital LAN or Supabase connection drops, buffer ticket generation in browser IndexedDB with deterministic offline sequence numbering, syncing immediately when connectivity restores. | [docs/specifications/CONNECTIVITY_RESILIENCE.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/CONNECTIVITY_RESILIENCE.md), [app/kiosk/README.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/README.md) |
| [ ] | Priority | **Inactivity Timeout Countdown Modal ("Are You Still There?")** | Implement a 30-second warning countdown modal with audible chime before session reset, giving hesitant or elderly patients a chance to tap "Continue" before wiping entered details (Role 1 Q27, Role 6 Q30). | [IdleRedirectWrapper.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/components/IdleRedirectWrapper.tsx) |
| [ ] | Priority | **Dynamic Service Quota Dimming & Clinic Operating Hours Closure** | Evaluate clinic operating hours from database to dim/disable service cards and display polite closed notices outside scheduled clinic hours (Role 1 Q29, Role 5 Q4). | [kiosk-services/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx) |
| [x] | Priority | **Strict Kiosk Centering & In-Flow Navigation** | Standardize all kiosk screens to horizontally and vertically center main interactive elements and keep navigation back buttons in-flow per AGENTS.md Rule 9. | [app/kiosk/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/README.md), [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/layout.tsx) |
| [ ] | Non-Priority | **Dual-Language Localization (English / Filipino)** | Add an accessible toggle at the top navigation bar enabling patients to switch between English and Tagalog/Filipino instructions, button labels, and printed ticket copy. | `app/kiosk/constants/*Texts.ts`, [layout.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/layout.tsx) |
| [ ] | Non-Priority | **SMS Queue Tracking Gateway** | Connect [sms-input](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx) to an SMS gateway (e.g. UniSMS, Semaphore, PhilSMS) to dispatch real-time queue position updates, delay warnings, and "Now Calling" alerts (Role 1 Q10). | [sms-input/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx), `python_backend/` |
| [ ] | Optional | **Digital Ticket QR Code for Mobile Tracking** | Include a dynamic QR code on the printed ticket and screen allowing patients to scan and track their real-time place in line on their personal smartphones without congregating near monitors. | [queue-print/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/page.tsx), `app/track/` |
| [ ] | Optional | **Hospital Card / Barcode Scanner Intake** | Support USB barcode or QR code scanners to auto-fill hospital patient IDs for returning patients, bypassing manual selection steps and accelerating intake. | [kiosk-new-old-selection/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/page.tsx) |
| [ ] | Optional | **Age-Aware Clinical Routing Hints** | Provide smart routing prompts during Consultation selection (e.g., recommending Pediatric Cardiology for children under 19, or Adult Cardiology for patients 19 and older). | [kiosk-cubicle-selection/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx) |
| [ ] | Optional | **High-Contrast & Large-Text Accessibility Mode** | Provide a high-contrast toggle compliant with accessibility standards for visually impaired or elderly heart patients (Role 1 Q30). | `app/kiosk/constants/`, [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/layout.tsx) |

---

## 2. Administrative & Executive Dashboard (`app/dashboard/`)

The Executive Dashboard provides administrative leaders and departmental heads with operational oversight, performance metrics, queue bottleneck analyses, and audit logs.

### 2.1 Overview Page (`app/dashboard/page.tsx`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [x] | Priority | **Supabase Realtime Live Streaming** | Migrate dashboard overview metrics from periodic polling (30s) to Supabase Realtime subscriptions for instant ticket updates and zero-latency KPI cards. | [useOverviewData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/hooks/useOverviewData.ts) |
| [x] | Priority | **Date Range Selector for Overview KPIs** | Add a date filter pill bar (Today, Yesterday, Last 7 Days, Month-to-Date) to evaluate executive metrics across historical ranges rather than only today's live queue. | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/page.tsx), [DashboardMetrics.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/DashboardMetrics.tsx), [OverviewDateFilter.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/OverviewDateFilter.tsx) |
| [ ] | Non-Priority | **Target Benchmark Alerts (60-Min SLA Threshold)** | Add visual threshold indicators on KPI cards and bottleneck table that alert administrative staff when the average total patient journey exceeds the hospital standard of 60 minutes (Role 4 Q29). | [DashboardMetrics.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/DashboardMetrics.tsx), [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) |
| [ ] | Optional | **Executive PDF Summary Report Export** | Implement a single-click executive summary PDF download containing daily throughput, peak congestion hours, and department SLA compliance. | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/page.tsx), `python_backend/` |

### 2.2 Analytics & Forecasting Page (`app/dashboard/pages/analytics/`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [x] | Priority | **Multi-Mode Excel Export (Specific Date, All Dates, Month)** | Allow administrative users to export official PHC Time and Motion Analysis workbooks by exact date, complete historical archive, or calendar month. | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx), `python_backend/main.py` |
| [ ] | Non-Priority | **Dynamic Per-Patient Wait-Time Predictive Model** | Compute and expose real-time estimated wait times per individual ticket based on current queue depth, active cubicles, and historical service durations (Role 1 Q5). | [useAnalyticsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/hooks/useAnalyticsData.ts), `python_backend/analytics/` |
| [ ] | Non-Priority | **Automated Congestion Spike Anomaly Detection** | Add automated statistical anomaly detection to alert administrators when arrival rates or stage bottlenecks diverge significantly from predicted distributions. | [BottleneckStageTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/BottleneckStageTable.tsx), `python_backend/analytics/` |
| [x] | Non-Priority | **Interactive Chart Drill-Down** | Allow clicking on any date or bar in the Daily Volume Chart to instantly load that day's hourly distribution and bottleneck breakdown. | [VolumeAndWaitCharts.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/VolumeAndWaitCharts.tsx), [DailyDrillDownDetail.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/DailyDrillDownDetail.tsx), `python_backend/main.py` |
| [ ] | Optional | **Custom Arbitrary Date Range Picker for Excel Export** | Expand the Excel export dialog with start-date and end-date datepickers for arbitrary custom reporting windows. | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx), `python_backend/main.py` |

### 2.3 Patients Records Page (`app/dashboard/pages/patients/`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [x] | Priority | **Comprehensive Patient Search (ID, Ticket, Phone)** | Enhance patient search to support lookup by hospital Patient Number (`patientNum`), ticket number, and phone number with debounced queries. | [PatientsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientsHeader.tsx), [usePatientsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/usePatientsData.ts) |
| [ ] | Non-Priority | **Direct CSV/Excel Export from Patient Table** | Provide an export button on the patients table to download the currently filtered view directly to CSV or Excel for administrative auditing, strictly sanitizing patient PII (Role 4 Q24). | [PatientsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientsHeader.tsx) |
| [ ] | Optional | **Visual Patient Journey Stage Timeline** | Provide a drawer or modal displaying a step-by-step visual timeline of a patient's progress (Registration, Waiting, Consultation, Carry-out, Completion) with exact elapsed times. | [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/RecentPatientTable.tsx) |
| [ ] | Optional | **Date Range Filter for Historical Patient Search** | Allow filtering patient records across custom date windows in addition to the live queue list. | [ServiceFilterBar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/ServiceFilterBar.tsx) |

### 2.4 Cubicles & Facilities Page (`app/dashboard/pages/cubicles/`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [x] | Priority | **Process-Stage Queue Route Visualization** | Display an interactive animated queue process map where each rectangular node is a processing stage (with queue buffer slots and terminal ports) and each connecting line represents an animated route between stages with real-time queue item dots representing actual queue states, with direct branching cubicle examination stations. | [cubicles/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/cubicles/page.tsx), [app/dashboard/pages/cubicles/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/README.md) |
| [x] | Priority | **Stalled Consultation Alert Indicator** | Highlight cubicles in amber (>35m) or red (>45m) with warning badges when an active consultation is prolonged or stalled, signaling potential complications or unrecorded completions. | [FlowchartCubicleGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/components/FlowchartCubicleGrid.tsx), `app/dashboard/pages/cubicles/constants/` |
| [ ] | Optional | **Physician-to-Cubicle Roster Integration** | Display the scheduled doctor's name, specialization, and shift hours directly on the live cubicle tile. | [cubicles/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/cubicles/page.tsx) |

---

## 3. Clinical & Nurse Station Dashboard (`app/nurse/`)

The Nurse Station Dashboard is used by triage nurses and clinical station managers to call patients, direct them to available cubicles, and log consultation transitions.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | Priority | **Audible Chime on Queue Arrival** | Trigger a distinct, non-intrusive sound alert when a new patient joins the department's waiting queue so nurses working on paperwork are notified immediately. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), `app/nurse/lib/` |
| [ ] | Priority | **Overdue Patient Visual Flagging (>45 Min Wait)** | Highlight patients whose wait time exceeds 45 minutes with a pulsating warning tag to prioritize elderly and vulnerable individuals (Role 3 Q28). | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), `app/nurse/constants/` |
| [ ] | Non-Priority | **Direct Cross-Service Queue Routing** | Enable nurses to route a patient directly to ECG, Warfarin Clinic, or Laboratory without requiring the patient to walk back to the kiosk to take another ticket. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx) |
| [ ] | Non-Priority | **Transit Grace Timer Before Idle State** | Implement a configurable 5-minute countdown when a ticket is called before allowing the ticket to be marked as "Idle / No-Show", accounting for elderly walking pace. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), `app/nurse/hooks/` |
| [ ] | Optional | **Tablet-Optimized Touch View** | Provide a compact, touch-friendly layout tailored for Android/iPad tablets used by roving nurses in the waiting lobby. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx) |

---

## 4. Patient Transfer & Queue Routing Dashboard (`app/transfer/`)

The Transfer Dashboard coordinates queue rotation, auto-assignment to cubicles, and idle patient management.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | Priority | **Automated Load-Balanced Queue Distribution** | Automatically suggest or assign waiting patients to the cubicle with the shortest estimated queue rather than relying purely on manual assignment. | [usePatientData.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/hooks/usePatientData.ts), [rotateApi.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/lib/rotateApi.ts) |
| [ ] | Priority | **Transfer Action Rollback (20-Second Undo Toast)** | Provide a 20-second high-contrast "Undo" toast upon cubicle assignment that atomically reverses assignment and restores queue position without data corruption (Role 2 Q14, Q18, Q26, Role 6 Q29). | [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx), [ConfirmAssignmentModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/ConfirmAssignmentModal.tsx) |
| [ ] | Priority | **Physician Break & Availability Toggle ("On Break" Status & Drop Prevention)** | Add a quick-toggle on cubicles to mark doctors as "On Break", "In Surgery", or "Available", visually dimming the cubicle, disabling drop targeting, and preventing ticket dispatch to inactive rooms (Role 2 Q5, Q15, Q24, Q27). | [DoctorsPanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/DoctorsPanel.tsx), [CubicleCard.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/components/CubicleCard.tsx) |
| [ ] | Priority | **Deliberate NO_SHOW Archival Modal with Mandatory Reason Logging** | Provide a confirmation modal when archiving idle/skipped tickets requiring deliberate action and recording an audit reason (`NO_SHOW`, `LEFT_WITHOUT_BEING_SEEN`, `PATIENT_REQUEST`) in the database (Role 2 Q22). | [IdleNumbersSection.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/components/IdleNumbersSection.tsx) |
| [ ] | Optional | **Emergency Priority Queue Insertion** | Allow authorized staff to inject urgent/emergency patients to the top of a specific cubicle queue with mandatory reason logging. | [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx) |
| [ ] | Optional | **Automated Multi-Stage Recall for Idle Numbers** | Automatically schedule 2nd and 3rd audio recalls for idle tickets before moving them to the permanent archive (Role 2 Q11, Q20). | [IdleNumbersPanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/IdleNumbersPanel.tsx) |

---

## 5. Public TV Queue Display (`app/monitor/`)

The Public Display monitor runs on waiting room televisions, displaying called tickets, counter assignments, and announcements.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | Priority | **Browser Screen Wake-Lock API Integration** | Use `navigator.wakeLock.request('screen')` with auto-reacquisition on visibility change to prevent hospital TV browser screens from dimming, sleeping, or triggering screensavers during clinic hours (Role 1 Q22, Role 5 Q16). | [monitor/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx) |
| [ ] | Priority | **Voice Synthesis Queue Callout (TTS) with Pre-Announcement Chime & Taglish Bilingual Phrasing** | Prepend queue announcements with an audible chime and synthesize clear voice audio in both English and Tagalog ("Tinatawagan ang ticket C-101 sa Cubicle 2") via `/api/tts` (Role 1 Q19, Role 3 Q3). | [monitor/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx), [useMonitorData.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/hooks/useMonitorData.ts), `app/api/tts/route.ts` |
| [ ] | Priority | **Network Disconnection State Freeze & Telemetry Banner** | Retain previously displayed queue numbers on screen rather than blanking when WebSocket connection drops, displaying a non-intrusive reconnection banner and re-syncing cleanly upon restore (Role 6 Q14). | [useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts) |
| [ ] | Non-Priority | **Visual Flash Animation on Number Update** | Pulse and highlight the updated ticket cell with brand emerald styling for 8 seconds when a new callout occurs to capture waiting patients' attention. | `app/monitor/components/` |
| [ ] | Optional | **Split-Screen Layout (Queue Board + Hospital Infographics)** | Support a configurable split layout displaying queue numbers on 60% of the screen and hospital announcements, health advisories, or educational videos on 40%. | [monitor/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx) |

---

## 6. SuperAdmin Configuration & Management (`app/superadmin/`)

The SuperAdmin dashboard manages clinics, services, hardware profiles, staff accounts, and security settings.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [x] | Priority | **SuperAdmin Architectural Refactoring & Redesign** | Refactor SuperAdmin into modular components, dedicated text/style dictionaries, custom data/modal hooks, and an enterprise solid surface interface adhering to AGENTS.md. | [app/superadmin/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/README.md), [app/superadmin/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/page.tsx) |
| [x] | Priority | **SuperAdmin Enterprise Standard Navigation System** | Industry-standard left-rail sidebar navigation grouped by functional domain (Access & Identity, Clinical Infrastructure, Patient Touchscreen, System Governance) with sticky header bar, dynamic breadcrumbs, live Manila time clock, dark/light theme switch, and user identity chip. | [SuperAdminSidebar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/navigation/SuperAdminSidebar.tsx), [SuperAdminHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/navigation/SuperAdminHeader.tsx) |
| [x] | Priority | **Enforce Role-Based RLS and Secure Anon Key** | Resolve open RLS security issues identified in `docs/OPEN_ISSUES.md`: enforce role check helper functions, eliminate unguarded public write policies, and restrict kiosk intake to authenticated service roles. | [docs/checklists/OPEN_ISSUES.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md), [docs/checklists/CHANGES_NEEDED.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/CHANGES_NEEDED.md) |
| [ ] | Priority | **Administrative Audit Trail Log Viewer & Diff Inspector** | Implement a dedicated `/superadmin/audit` page displaying actor, timestamp, client IP, target entity, and before/after JSON diffs for role changes, station reassignments, and queue deletions (Role 5 Q20, Q21, Q25, Role 6 Q23). | `app/superadmin/audit/`, `app/superadmin/components/AuditLogTable.tsx`, [DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md) |
| [ ] | Priority | **Operating Hours & Auto-Kiosk Scheduler** | Set standard hospital outpatient operating hours (e.g. 07:00 to 16:00). Kiosks outside these hours automatically display a polite closed notice (Role 1 Q29, Role 5 Q4). | `app/superadmin/components/`, `app/kiosk/` |
| [ ] | Non-Priority | **Dynamic Service Reordering & Visibility Toggle** | Provide drag-and-drop or rank ordering for kiosk services so administrators can reposition menu items and temporarily deactivate clinics without code changes. | [customization/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/page.tsx) |
| [ ] | Non-Priority | **Hardware Device Heartbeat Telemetry & Printer Diagnostics** | Display live online/offline heartbeat status for all registered kiosks, TV monitors, and printer peripherals throughout the hospital, enabling browser-based ESC/POS diagnostic testing (Role 5 Q9, Q24). | `app/superadmin/components/` |

---

## 7. Architecture, Backend & Telemetry (`python_backend/`)

The Python backend powers statistical forecasting, ARIMA time-series modeling, bottleneck calculations, and Excel reporting.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | Non-Priority | **FastAPI Endpoint Rate Limiting (`slowapi`)** | Apply token-bucket rate limiting to public analytics endpoints to prevent denial-of-service degradation. | [python_backend/main.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py) |
| [ ] | Non-Priority | **FastAPI Native Background Task Caching** | Replace in-memory global timestamp caching with explicit background tasks (`BackgroundTasks` or Redis) to pre-compute heavy ARIMA and Linear Regression runs. | [python_backend/main.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py) |
| [ ] | Optional | **Docker Containerization for On-Prem PHC MIS Handoff** | Package Next.js and FastAPI services into multi-stage `Dockerfile` and `docker-compose.yml` configurations for hospital on-premise server deployment. | `Dockerfile`, `docker-compose.yml` |

---

## 8. Security Hardening & Remediation Roadmap

Remediation tasks addressing vulnerabilities identified during the comprehensive system security audit. See [docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) and [docs/checklists/SECURITY_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md) for full vulnerability mechanics and patch details:

| Status | Priority | Feature / Improvement | Target Files / Module | Process to Check | Expected Output |
| :---: | :---: | :--- | :--- | :--- | :--- |
| [x] | Priority | **Eliminate Printer OS Command Injection (SEC-024)** | [lib/printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts) | 1. Grep codebase for `child_process.exec()`.<br>2. Call `sendToPrinter("1001; id", "OPD", "C1")`. | No `child_process.exec` calls exist; `fs.writeFile` writes directly to `/dev/usb/lp*`; command characters are stripped without shell evaluation. |
| [x] | Priority | **Guard SuperAdmin User Sync Endpoint (SEC-026)** | [sync-users/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/sync-users/route.ts) | Send unauthenticated POST: `curl -X POST http://localhost:3000/api/superadmin/sync-users`. | HTTP 401 Unauthorized `{"error":"Not authenticated"}`; endpoint rejects execution and does not query or insert users. |
| [x] | Priority | **Server-Side TTS Gateway (SEC-025)** | `app/api/tts/route.ts`, [useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts) | Trigger audio callout on `/monitor` or `/nurse`; inspect DevTools Network tab and grep bundle for `NEXT_PUBLIC_DEEPGRAM_KEY`. | Browser issues `POST /api/tts` returning binary audio (`Content-Type: audio/mp3`); raw Deepgram key is absent from client bundle assets. |
| [x] | Priority | **Harden `/api/rotate` Endpoint (SEC-027)** | [app/api/rotate/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/rotate/route.ts) | Send authenticated POST with non-whitelisted column (e.g. `medical_notes`) or targeting an `id` where `is_historical = true`. | HTTP 403 if role unauthorized; non-whitelisted columns stripped; updates on historical rows match 0 rows (`applied: false`). |
| [x] | Priority | **Authenticate & Rate-Limit SMS Dispatch (SEC-028)** | [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts) | 1. Call `sendSMS` without active session.<br>2. Pass invalid phone `12345`.<br>3. Send >20 messages in 60 seconds. | 1. `{ error: 'Unauthorized: Active clinical session required...' }`<br>2. `{ error: 'Invalid Philippine phone number format...' }`<br>3. `{ error: 'SMS dispatch rate limit exceeded...' }` |
| [x] | Priority | **Validate Thermal Printer Intake (SEC-029)** | [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts) | Send POST to `/api/print-ticket` with fictitious `queueNumber: "99999"`. | HTTP 404 Not Found `{"error":"Queue ticket not found or invalid for printing."}`; zero bytes written to `/dev/usb/lp*`. |

---

## 9. "Where to Edit" Quick Directory Map

When contributing new features or addressing items from this checklist, consult the following dedicated guide files:

| Subsystem / Area | Feature Scope | Documentation & Developer Guide |
| :--- | :--- | :--- |
| **Kiosk Subsystem** | Screens, navigation, keypad, styles, texts, timeout | [app/kiosk/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/README.md) |
| **Admin Dashboard** | Overview, KPI tiles, charts, live tables, metrics | [app/dashboard/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/README.md) |
| **SuperAdmin Subsystem** | Users, desk access, facilities, kiosks, settings, passwords | [app/superadmin/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/README.md) |
| **Analytics Module** | Bottleneck analysis, forecasts, Excel export modal | [app/dashboard/pages/analytics/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/README.md) |
| **Nurse Station** | Patient calling, consultation pipeline, station queues | [app/nurse/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/README.md) |
| **Transfer Dashboard** | Doctor assignment, rotation, idle management | [docs/specifications/TRANSFER_DASHBOARD.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/TRANSFER_DASHBOARD.md#7-developer-customization--where-to-edit-guide) |
| **Security & Schema** | Database schema, policies, role management | [docs/specifications/DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md), [docs/checklists/OPEN_ISSUES.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md) |
| **Security Checklist** | Vulnerability matrix, verification steps, patch guide | [docs/checklists/SECURITY_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md), [AGENTS.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/AGENTS.md) |
| **API & Injection Audit** | Vulnerability mechanics, exploit proofs, technical patches | [docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) |
| **UAT Test Cases** | End-to-end verification checklist and remarks | [docs/checklists/UAT_USE_CASE_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md) |

_Last updated: 2026-10-21 — Standardized priority classifications to Priority, Non-Priority, and Optional across all roadmap items._
