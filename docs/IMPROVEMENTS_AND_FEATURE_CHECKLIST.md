# Heart Check PHC: Dashboards & Kiosk Improvement Roadmap and Living Checklist

This document serves as the master tracking checklist and improvement roadmap for the **Heart Check PHC** Queue Management System. It outlines recommended feature additions, user experience enhancements, architectural refinements, and operational upgrades across the **Patient Self-Service Kiosk** and all **Administrative, Clinical, and Monitoring Dashboards**.

---

## Tracking Conventions

- **Status:**
  - `[ ]` Pending / Backlog
  - `[-]` In Progress / Under Review
  - `[x]` Completed / Implemented
- **Priority:**
  - `P0` Critical / Operational Requirement
  - `P1` High Priority / Clinical & Operational Efficiency
  - `P2` Medium Priority / Feature Enhancement
  - `P3` Low Priority / Ergonomic & Polish Enhancement

---

## 1. Patient Self-Service Kiosk (`app/kiosk/`)

The Kiosk is the primary physical entry point for outpatients arriving at the hospital. Improvements focus on accessibility, hardware resilience, ergonomic touch interactions, and multi-channel notifications.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P0 | **ESC/POS Thermal Printer Status Telemetry** | Integrate printer hardware status detection (out of paper, paper jam, printer offline) to prevent patient queueing when physical tickets cannot be issued. Provide on-screen fallback to photo/SMS ticket. | [queue-print/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/page.tsx), `app/kiosk/lib/` |
| [ ] | P0 | **Offline Queueing Resilience (Local Queue Buffer)** | If hospital LAN or Supabase connection drops, buffer ticket generation in browser IndexedDB with deterministic offline sequence numbering, syncing immediately when connectivity restores. | [docs/CONNECTIVITY_RESILIENCE.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/CONNECTIVITY_RESILIENCE.md), [useKioskFlow.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/hooks/useKioskFlow.ts) |
| [ ] | P1 | **Dual-Language Localization (English / Filipino)** | Add an accessible toggle at the top navigation bar enabling patients to switch between English and Tagalog/Filipino instructions, button labels, and printed ticket copy. | `app/kiosk/constants/*Texts.ts`, [KioskHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/components/KioskHeader.tsx) |
| [ ] | P1 | **Inactivity Timeout Countdown Modal** | Implement a 30-second warning countdown modal with audible chime before session reset, giving hesitant or elderly patients a chance to tap "Continue" before wiping entered details. | [useKioskTimeout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/hooks/useKioskTimeout.ts), `app/kiosk/components/` |
| [ ] | P1 | **SMS Queue Tracking Gateway** | Connect [sms-input](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx) to an SMS gateway (e.g. Semaphore, PhilSMS, Twilio) to dispatch real-time queue position updates, delay warnings, and "Now Calling" alerts. | [sms-input/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx), `python_backend/` |
| [ ] | P1 | **Digital Ticket QR Code for Mobile Tracking** | Include a dynamic QR code on the printed ticket and screen allowing patients to scan and track their real-time place in line on their personal smartphones without congregating near monitors. | [queue-print/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/page.tsx), `app/track/` |
| [ ] | P2 | **Hospital Card / Barcode Scanner Intake** | Support USB barcode or QR code scanners to auto-fill hospital patient IDs for returning patients, bypassing manual selection steps and accelerating intake. | [kiosk-new-old-selection/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/page.tsx) |
| [ ] | P2 | **Age-Aware Clinical Routing Hints** | Provide smart routing prompts during Consultation selection (e.g., recommending Pediatric Cardiology for children under 19, or Adult Cardiology for patients 19 and older). | [kiosk-cubicle-selection/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx) |
| [ ] | P2 | **High-Contrast & Large-Text Accessibility Mode** | Provide a high-contrast toggle compliant with accessibility standards for visually impaired or elderly heart patients. | `app/kiosk/constants/`, [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/layout.tsx) |
| [ ] | P3 | **Dynamic Service Quota Dimming** | Dim or disable specific service cards dynamically when maximum daily clinic quotas have been met or when clinical departments are scheduled closed. | [kiosk-services/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx) |
| [x] | P0 | **Strict Kiosk Centering & In-Flow Navigation** | Standardize all kiosk screens to horizontally and vertically center main interactive elements and keep navigation back buttons in-flow per AGENTS.md Rule 9. | [app/kiosk/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/README.md), [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/layout.tsx) |

---

## 2. Administrative & Executive Dashboard (`app/dashboard/`)

The Executive Dashboard provides administrative leaders and departmental heads with operational oversight, performance metrics, queue bottleneck analyses, and audit logs.

### 2.1 Overview Page (`app/dashboard/page.tsx`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P1 | **Supabase Realtime Live Streaming** | Migrate dashboard overview metrics from periodic polling (30s) to Supabase Realtime subscriptions for instant ticket updates and zero-latency KPI cards. | [useOverviewData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/hooks/useOverviewData.ts) |
| [ ] | P1 | **Date Range Selector for Overview KPIs** | Add a date filter pill bar (Today, Yesterday, Last 7 Days, Month-to-Date) to evaluate executive metrics across historical ranges rather than only today's live queue. | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/page.tsx), [DashboardMetrics.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/DashboardMetrics.tsx) |
| [ ] | P2 | **Target Benchmark Alerts (60-Min SLA Threshold)** | Add visual threshold indicators on KPI cards that alert administrative staff when the average total patient journey exceeds the hospital standard of 60 minutes. | [DashboardMetrics.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/DashboardMetrics.tsx), [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) |
| [ ] | P2 | **Executive PDF Summary Report Export** | Implement a single-click executive summary PDF download containing daily throughput, peak congestion hours, and department SLA compliance. | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/page.tsx), `python_backend/` |

### 2.2 Analytics & Forecasting Page (`app/dashboard/pages/analytics/`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [x] | P0 | **Multi-Mode Excel Export (Specific Date, All Dates, Month)** | Allow administrative users to export official PHC Time and Motion Analysis workbooks by exact date, complete historical archive, or calendar month. | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx), `python_backend/main.py` |
| [ ] | P1 | **Dynamic Per-Patient Wait-Time Predictive Model** | Compute and expose real-time estimated wait times per individual ticket based on current queue depth, active cubicles, and historical service durations. | [useAnalyticsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/hooks/useAnalyticsData.ts), `python_backend/analytics/` |
| [ ] | P1 | **Automated Congestion Spike Anomaly Detection** | Add automated statistical anomaly detection to alert administrators when arrival rates or stage bottlenecks diverge significantly from predicted distributions. | [BottleneckStageTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/BottleneckStageTable.tsx), `python_backend/analytics/` |
| [ ] | P2 | **Interactive Chart Drill-Down** | Allow clicking on any date or bar in the Daily Volume Chart to instantly load that day's hourly distribution and bottleneck breakdown. | [VolumeAndWaitCharts.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/VolumeAndWaitCharts.tsx) |
| [ ] | P2 | **Custom Arbitrary Date Range Picker for Excel Export** | Expand the Excel export dialog with start-date and end-date datepickers for arbitrary custom reporting windows. | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx), `python_backend/main.py` |

### 2.3 Patients Records Page (`app/dashboard/pages/patients/`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P1 | **Comprehensive Patient Search (ID, Ticket, Phone)** | Enhance patient search to support lookup by hospital Patient Number (`patientNum`), ticket number, and phone number with debounced queries. | [PatientsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientsHeader.tsx), [usePatientsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/usePatientsData.ts) |
| [ ] | P1 | **Direct CSV/Excel Export from Patient Table** | Provide an export button on the patients table to download the currently filtered view directly to CSV or Excel for administrative auditing. | [PatientsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientsHeader.tsx) |
| [ ] | P2 | **Visual Patient Journey Stage Timeline** | Provide a drawer or modal displaying a step-by-step visual timeline of a patient's progress (Registration, Waiting, Consultation, Carry-out, Completion) with exact elapsed times. | [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/RecentPatientTable.tsx) |
| [ ] | P2 | **Date Range Filter for Historical Patient Search** | Allow filtering patient records across custom date windows in addition to the live queue list. | [ServiceFilterBar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/ServiceFilterBar.tsx) |

### 2.4 Cubicles & Facilities Page (`app/dashboard/pages/cubicles/`)

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P1 | **Hourly Throughput Heatmap per Cubicle** | Display a visual heatmap showing patient processing speed and idle intervals for each cubicle across the operational day. | [cubicles/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/cubicles/page.tsx) |
| [ ] | P1 | **Stalled Consultation Alert Indicator** | Highlight cubicles in amber or red when an active consultation exceeds 45 minutes, signaling potential complications or unrecorded completions. | [cubicles/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/cubicles/page.tsx), `app/dashboard/pages/cubicles/constants/` |
| [ ] | P2 | **Physician-to-Cubicle Roster Integration** | Display the scheduled doctor's name, specialization, and shift hours directly on the live cubicle tile. | [cubicles/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/cubicles/page.tsx) |

---

## 3. Clinical & Nurse Station Dashboard (`app/nurse/`)

The Nurse Station Dashboard is used by triage nurses and clinical station managers to call patients, direct them to available cubicles, and log consultation transitions.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P0 | **Audible Chime on Queue Arrival** | Trigger a distinct, non-intrusive sound alert when a new patient joins the department's waiting queue so nurses working on paperwork are notified immediately. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), `app/nurse/lib/` |
| [ ] | P0 | **Overdue Patient Visual Flagging (>45 Min Wait)** | Highlight patients whose wait time exceeds 45 minutes with a pulsating warning tag to prioritize elderly and vulnerable individuals. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), `app/nurse/constants/` |
| [ ] | P1 | **Direct Cross-Service Diagnostic Referral** | Enable nurses to route a patient directly to ECG, Warfarin Clinic, or Laboratory without requiring the patient to walk back to the kiosk to take another ticket. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx) |
| [ ] | P1 | **Transit Grace Timer Before Idle State** | Implement a configurable 5-minute countdown when a ticket is called before allowing the ticket to be marked as "Idle / No-Show", accounting for elderly walking pace. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), `app/nurse/hooks/` |
| [ ] | P1 | **Triage Vitals Quick-Entry Modal** | Provide an optional quick-entry modal for recording initial vitals (Blood Pressure, Heart Rate, SpO2) associated with the queue record. | `app/nurse/components/`, [DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/DATABASE_SCHEMA.md) |
| [ ] | P2 | **Tablet-Optimized Touch View** | Provide a compact, touch-friendly layout tailored for Android/iPad tablets used by roving nurses in the waiting lobby. | [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx) |

---

## 4. Patient Transfer & Queue Routing Dashboard (`app/transfer/`)

The Transfer Dashboard coordinates queue rotation, auto-assignment to cubicles, and idle patient management.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P0 | **Automated Load-Balanced Queue Distribution** | Automatically suggest or assign waiting patients to the cubicle with the shortest estimated queue rather than relying purely on manual assignment. | [useTransferState.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useTransferState.ts), [rotateApi.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/lib/rotateApi.ts) |
| [ ] | P1 | **Transfer Action Rollback / Undo Window** | Provide a 20-second "Undo" toast when an assignment or transfer is made inadvertently, restoring the patient to their previous queue position. | [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx), [ConfirmAssignmentModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/ConfirmAssignmentModal.tsx) |
| [ ] | P1 | **Physician Break & Availability Toggle** | Add a quick-toggle on cubicles to mark doctors as "On Break", "In Surgery", or "Available", preventing ticket dispatch to inactive rooms. | [DoctorsPanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/DoctorsPanel.tsx) |
| [ ] | P2 | **Emergency Priority Queue Insertion** | Allow authorized staff to inject urgent/emergency patients to the top of a specific cubicle queue with mandatory reason logging. | [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx) |
| [ ] | P2 | **Automated Multi-Stage Recall for Idle Numbers** | Automatically schedule 2nd and 3rd audio recalls for idle tickets before moving them to the permanent archive. | [IdleNumbersPanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/IdleNumbersPanel.tsx) |

---

## 5. Public TV Queue Display (`app/monitor/`)

The Public Display monitor runs on waiting room televisions, displaying called tickets, counter assignments, and announcements.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P0 | **Browser Screen Wake-Lock API Integration** | Use `navigator.wakeLock.request('screen')` to prevent hospital TV browser screens from dimming, sleeping, or triggering screensavers. | [monitor/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx) |
| [ ] | P0 | **Automated Voice Synthesis Queue Callout (TTS)** | Announce called numbers using Web Speech Synthesis API in clear English and Filipino (e.g., "Now calling ticket C-102 to Cubicle 4"). | [monitor/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx), `app/monitor/lib/` |
| [ ] | P1 | **Visual Flash Animation on Number Update** | Pulse and highlight the updated ticket cell with brand emerald styling for 8 seconds when a new callout occurs to capture waiting patients' attention. | `app/monitor/components/` |
| [ ] | P1 | **Network Disconnect Overlay Indicator** | Display a subtle corner banner if the TV loses network connection to Supabase or the server, preventing patients from relying on frozen displays. | [useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts) |
| [ ] | P2 | **Split-Screen Layout (Queue Board + Hospital Infographics)** | Support a configurable split layout displaying queue numbers on 60% of the screen and hospital announcements, health advisories, or educational videos on 40%. | [monitor/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx) |

---

## 6. SuperAdmin Configuration & Management (`app/superadmin/`)

The SuperAdmin dashboard manages clinics, services, hardware profiles, staff accounts, and security settings.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P0 | **Enforce Role-Based RLS and Secure Anon Key** | Resolve open RLS security issues identified in `docs/OPEN_ISSUES.md`: enforce role check helper functions, eliminate unguarded public write policies, and restrict kiosk intake to authenticated service roles. | [docs/OPEN_ISSUES.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/OPEN_ISSUES.md), [docs/CHANGES_NEEDED.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/CHANGES_NEEDED.md) |
| [ ] | P1 | **Dynamic Service Reordering & Visibility Toggle** | Provide drag-and-drop or rank ordering for kiosk services so administrators can reposition menu items and temporarily deactivate clinics without code changes. | [customization/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/page.tsx) |
| [ ] | P1 | **Operating Hours & Auto-Kiosk Scheduler** | Set standard hospital outpatient operating hours (e.g. 07:00 to 16:00). Kiosks outside these hours automatically display a polite closed notice. | `app/superadmin/components/`, `app/kiosk/` |
| [ ] | P1 | **Audit Log of Administrative & Queue Overrides** | Maintain a searchable audit log capturing manual queue deletions, doctor reassignments, role changes, and system configuration updates. | `app/superadmin/components/`, [DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/DATABASE_SCHEMA.md) |
| [ ] | P2 | **Hardware Device Heartbeat Telemetry** | Display live online/offline heartbeat status for all registered kiosks, TV monitors, and printer peripherals throughout the hospital. | `app/superadmin/components/` |

---

## 7. Architecture, Backend & Telemetry (`python_backend/`)

The Python backend powers statistical forecasting, ARIMA time-series modeling, bottleneck calculations, and Excel reporting.

| Status | Priority | Feature / Improvement | Description | Target Files / Module |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | P1 | **FastAPI Endpoint Rate Limiting (`slowapi`)** | Apply token-bucket rate limiting to public analytics endpoints to prevent denial-of-service degradation. | [python_backend/main.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py) |
| [ ] | P1 | **FastAPI Native Background Task Caching** | Replace in-memory global timestamp caching with explicit background tasks (`BackgroundTasks` or Redis) to pre-compute heavy ARIMA and Linear Regression runs. | [python_backend/main.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py) |
| [ ] | P2 | **Docker Containerization for On-Prem PHC MIS Handoff** | Package Next.js and FastAPI services into multi-stage `Dockerfile` and `docker-compose.yml` configurations for hospital on-premise server deployment. | `Dockerfile`, `docker-compose.yml` |

---

## 8. "Where to Edit" Quick Directory Map

When contributing new features or addressing items from this checklist, consult the following dedicated guide files:

| Subsystem / Area | Feature Scope | Documentation & Developer Guide |
| :--- | :--- | :--- |
| **Kiosk Subsystem** | Screens, navigation, keypad, styles, texts, timeout | [app/kiosk/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/README.md) |
| **Admin Dashboard** | Overview, KPI tiles, charts, live tables, metrics | [app/dashboard/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/README.md) |
| **Analytics Module** | Bottleneck analysis, forecasts, Excel export modal | [app/dashboard/pages/analytics/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/README.md) |
| **Nurse Station** | Patient calling, vitals, station queues | [app/nurse/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/README.md) |
| **Transfer Dashboard** | Doctor assignment, rotation, idle management | [docs/TRANSFER_MANUAL_TWEAKING_GUIDE.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/TRANSFER_MANUAL_TWEAKING_GUIDE.md) |
| **Security & Schema** | Database schema, policies, role management | [docs/DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/DATABASE_SCHEMA.md), [docs/OPEN_ISSUES.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/OPEN_ISSUES.md) |

---

_Note: This document must be updated whenever items are started or completed. When completing an item, change `[ ]` to `[x]` and document the implementation date and corresponding commit in the PR or changelog._
