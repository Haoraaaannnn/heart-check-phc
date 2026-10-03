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
   - `usePatientsData.ts`: Manages today's summary metrics, recent patient list (`RecentPatient`), 30-day historical logs (`AllRecentPatient`), and service distribution.
   - `usePatientsAnalyticsData.ts`: Coordinates analytics metrics and hourly intake trends.
   - `useServiceQueue.ts`: Real-time queue subscriptions and queue management for specific service departments.

5. **Types & Data Contracts (`types/Types.ts`):**
   - Shared data interfaces defining patient metrics, records, and table row contracts.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change page titles, table headers, card subtitles, or empty messages** | [patientsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patientsTexts.ts) |
| **Change visual styling, card layouts, table classes, or status colors** | [patients.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patients.ts) |
| **Change 30-day recent patient table presentation or pagination** | [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/RecentPatientTable.tsx) |
| **Change patient query logic, wait-time calculation, or list transformations** | [usePatientsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/usePatientsData.ts) |
| **Change live queue inspection, polling, or active queue subscriptions** | [useServiceQueue.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/useServiceQueue.ts) |
| **Change hourly flow chart or historical analytics loading** | [usePatientsAnalyticsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/usePatientsAnalyticsData.ts) |
| **Change data interfaces for recent patient records or statistics** | [Types.ts](file:///home/jensen/Github-Repositories/heart-check-phc/types/Types.ts) |
| **Change department filter buttons or service selection handling** | [ServiceFilterBar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/ServiceFilterBar.tsx) |
| **Change summary metric cards (Total Today, In Queue, In Service, etc.)** | [PatientStatGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/PatientStatGrid.tsx) |
| **Change page orchestration, query parameter sync, or grid layout** | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/page.tsx) |

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

### Recent Patients Table
- **Component:** [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/RecentPatientTable.tsx)
- **Role:** 30-day patient table featuring real-time client-side search across ticket numbers, services, statuses, and registration times. Includes windowed page number buttons, direct "Go to page" jump input, and rows-per-page selection to eliminate one-by-one paging.

### Service Queue Panel
- **Component:** [ServiceQueuePanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/ServiceQueuePanel.tsx)
- **Role:** Active queue visualizer for a selected medical service, showing serving patients and next-in-line queues.
