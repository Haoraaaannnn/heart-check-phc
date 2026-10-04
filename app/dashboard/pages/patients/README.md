# Patients Dashboard Module Developer Guide: Architecture & Where to Edit

This document serves as the guide for developers maintaining, modifying, or extending the Patients Dashboard module in `app/dashboard/pages/patients/`.

It details the module architecture, separation-of-concerns principles, and provides an exhaustive mapping showing where to make edits for any visual, textual, layout, logic, or type changes.

---

## 1. Architectural Principles

The Patients module adheres strictly to the repository separation-of-concerns rules:

1. **Presentation Components (`components/`):**
   - Pure UI rendering and structure.
   - Zero hardcoded text copy, titles, or messages.
   - Zero raw inline styling objects.
   - Consume text copy from dedicated `constants/patientsTexts.ts`.
   - Consume styling objects and tokens from `constants/patients.ts`.

2. **Text Dictionaries (`constants/patientsTexts.ts`):**
   - Centralize all titles, subtitles, card headers, table headers, empty states, and pagination labels as typed constants (`as const`).
   - Plain-text formatting without emojis.

3. **Style & Token Dictionaries (`constants/patients.ts`):**
   - Centralize all layout style maps (`PATIENTS_STYLES`), semantic status badge colors (`PATIENT_STATUS_COLORS`), chart color palettes (`COLORS`), and refresh intervals.

4. **Interactive Hooks & Data Fetching (`hooks/`):**
   - `usePatientsData.ts`: Manages today's summary metrics, recent patient list (`RecentPatient`), 30-day historical logs (`AllRecentPatient`), service distribution, and multi-field debounced patient search (lookup by database ID, ticket number, and contact phone number).
   - `usePatientsAnalyticsData.ts`: Coordinates analytics metrics and hourly intake trends.
   - `useServiceQueue.ts`: Real-time queue subscriptions and queue management for specific service departments.

5. **Types & Data Contracts (`types/Types.ts`):**
   - Shared data interfaces defining patient metrics, records, phone numbers, and table row contracts.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change page titles, table headers, card subtitles, search placeholders, or empty messages** | [patientsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patientsTexts.ts) |
| **Change visual styling, search input classes, card layouts, table styling, or status colors** | [patients.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patients.ts) |
| **Change patient table columns, phone display, or pagination controls** | [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/RecentPatientTable.tsx) |
| **Change multi-field debounced search (ID, Ticket, Phone) or database query logic** | [usePatientsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/usePatientsData.ts) |
| **Change header banner layout, title block, or service title formatting** | [PatientsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientsHeader.tsx) |
| **Change live queue inspection, polling fallback (10s), sequence guards, or active queue subscriptions** | [useServiceQueue.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/useServiceQueue.ts) |
| **Change hourly flow chart or historical analytics loading** | [usePatientsAnalyticsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/usePatientsAnalyticsData.ts) |
| **Change data interfaces for patient records (RecentPatient, AllRecentPatient)** | [Types.ts](file:///home/jensen/Github-Repositories/heart-check-phc/types/Types.ts) |
| **Change department filter buttons or service selection handling** | [ServiceFilterBar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/ServiceFilterBar.tsx) |
| **Change summary metric cards (Total Today, In Queue, In Service, etc.)** | [PatientStatGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientStatGrid.tsx) |
| **Change page orchestration, search state wiring, or grid layout** | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/page.tsx) |

---

## 3. Component Breakdown

### Header Banner
- **Component:** [PatientsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientsHeader.tsx)
- **Role:** Displays page title, dynamic service description, and realtime error notifications.

### Service Filter Bar
- **Component:** [ServiceFilterBar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/ServiceFilterBar.tsx)
- **Role:** Horizontal pill filters allowing switching between all services and specific clinics.

### Stat Metrics Grid
- **Component:** [PatientStatGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientStatGrid.tsx)
- **Role:** Key performance indicator cards showing queue totals, active services, served patients, and average wait time.

### Recent Patients Table & Comprehensive Search
- **Component:** [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/RecentPatientTable.tsx)
- **Role:** Comprehensive patient table displaying Patient ID, Ticket #, Service, Status, Phone Number, Time, and Wait Time without truncation. Integrates the primary multi-field search toolbar (ID, Ticket, Phone, Service, Status) with debounced database lookup, loading spinner, clear action, windowed page number buttons, direct jump input, and rows-per-page selection.

### Service Queue Panel
- **Component:** [ServiceQueuePanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/ServiceQueuePanel.tsx)
- **Role:** Active queue visualizer for a selected medical service, showing serving patients and next-in-line queues.
