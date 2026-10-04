# Heart Check PHC: Master Documentation Portal & Navigation Index

This index categorizes all technical specifications, operational guides, security audits, database schemas, and developer editing manuals across the Heart Check PHC codebase.

---

## Documentation Navigation Groups

- [1. System Architecture and Platform Design](#1-system-architecture-and-platform-design)
- [2. Network Connectivity and Real-Time Resilience](#2-network-connectivity-and-real-time-resilience)
- [3. Clinical Workstations and Department Operations](#3-clinical-workstations-and-department-operations)
- [4. Database Models, Schema and Seeding Pipelines](#4-database-models-schema-and-seeding-pipelines)
- [5. Security Architecture, Access Controls and Audits](#5-security-architecture-access-controls-and-audits)
- [6. Product Scope, Quality Assurance and Issue Tracking](#6-product-scope-quality-assurance-and-issue-tracking)
- [7. Subsystem Developer Guides ("Where to Edit" Maps)](#7-subsystem-developer-guides-where-to-edit-maps)

---

## 1. System Architecture and Platform Design

High-level architectural blueprints, subsystem boundaries, data-flow pipelines, UI design systems, and complete codebase file trees.

| Document | Primary Audience | Key Topics Covered |
| :--- | :--- | :--- |
| [`docs/ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/ARCHITECTURE.md) | All Developers | Full-stack platform architecture, Next.js App Router layout, FastAPI analytics engine, queueing models, and data flows |
| [`docs/SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SYSTEM_DESIGN.md) | Systems Engineers | Comprehensive system design, service contracts, data flow diagrams, and state machine transitions |
| [`docs/FILE_ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/FILE_ARCHITECTURE.md) | Frontend / Backend | Complete directory tree mapping every file, route, component, and utility in the repository |
| [`docs/COMPONENTS_GUIDE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/COMPONENTS_GUIDE.md) | Frontend Developers | Design system component catalog, shared UI components (`BackButton`, `ScrollArea`), and token conventions |

---

## 2. Network Connectivity and Real-Time Resilience

Technical strategies for handling weak, high-latency, or intermittent WiFi connections in clinical environments, including polling fallbacks and on-premises LAN migration.

| Document | Primary Audience | Key Topics Covered |
| :--- | :--- | :--- |
| [`docs/CONNECTIVITY_RESILIENCE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/CONNECTIVITY_RESILIENCE.md) | Frontend / Network / DevOps | Layer A implemented weak-signal safeguards (anti-teleportation sequence guards, 300ms debounce, 2s hysteresis, 500ms overlap throttling, client socket tuning) and Layer B LAN-first FastAPI WebSocket roadmap for on-premises deployment |

---

## 3. Clinical Workstations and Department Operations

Workstation user interfaces, drag-and-drop mechanics, consultation Kanban stages, and operational tuning guides for clinic staff.

| Document | Primary Audience | Key Topics Covered |
| :--- | :--- | :--- |
| [`docs/TRANSFER_DASHBOARD.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/TRANSFER_DASHBOARD.md) | Clinical / Frontend | Patient Transfer station architecture, FIFO queue lock, pointer event drag-and-drop, registration counter release flow, and auto-rotation timers |
| [`docs/TRANSFER_MANUAL_TWEAKING_GUIDE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/TRANSFER_MANUAL_TWEAKING_GUIDE.md) | Clinic Admins / Operators | Operator handbook for tuning queue capacities, cooldown timers, rotation rules, and doctor assignments |
| [`docs/NURSE_DASHBOARD_SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/NURSE_DASHBOARD_SYSTEM_DESIGN.md) | Clinical / Frontend | Consultation cubicle intake, 3-column Kanban board, optimistic state updates, and IndexedDB outbox queue for power outage resilience |

---

## 4. Database Models, Schema and Seeding Pipelines

PostgreSQL database schemas, column definitions, Row-Level Security policies, and synthetic queue data generators.

| Document | Primary Audience | Key Topics Covered |
| :--- | :--- | :--- |
| [`docs/DATABASE_SCHEMA.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/DATABASE_SCHEMA.md) | Database Admins / Backend | Table structures, column dictionaries, primary keys, relationships, and legacy data import pipelines |
| [`docs/SCHEMA_REFERENCE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SCHEMA_REFERENCE.md) | Database Admins / Security | Raw schema dump, PostgreSQL data types, and live Row-Level Security (RLS) policy definitions |
| [`docs/SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SETUP_AND_SEEDING.md) | Backend / QA | Local development setup, database migrations, Python virtual environment, and simulated queue traffic generation |

---

## 5. Security Architecture, Access Controls and Audits

Zero-trust security policies, role-based access control, endpoint vulnerability assessments, and remediation checklists.

| Document | Primary Audience | Key Topics Covered |
| :--- | :--- | :--- |
| [`docs/SECURITY.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SECURITY.md) | Security / Backend | Two-layer access control: Supabase Row-Level Security (RLS) policies and Next.js middleware route guarding |
| [`docs/SECURITY_CHECKLIST.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SECURITY_CHECKLIST.md) | Security / DevOps | Master checklist of security controls: service-role isolation, brute-force mitigation, cookie flags, and parameterized queries |
| [`docs/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) | Security / Backend | Comprehensive security audit covering route handlers, SQL injection vectors, and service-role credential isolation |

---

## 6. Product Scope, Quality Assurance and Issue Tracking

Capstone requirements, thesis evaluation criteria, testing verification scripts, roadmap backlogs, and active issue resolution.

| Document | Primary Audience | Key Topics Covered |
| :--- | :--- | :--- |
| [`docs/PRD.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/PRD.md) | Project Stakeholders / All | Product Requirements Document: problem statement, thesis objectives, user roles, and core operational requirements |
| [`docs/UAT_USE_CASE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/UAT_USE_CASE_CHECKLIST.md) | QA / Evaluators | User Acceptance Testing (UAT) verification matrix covering all clinical workflows and kiosk scenarios |
| [`docs/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md) | Technical Leads / Developers | Master roadmap of completed features, architectural refactorings, and future enhancement backlogs |
| [`docs/CHANGES_NEEDED.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/CHANGES_NEEDED.md) | Developers / Database Admins | Actionable technical debt remediation checklist: database migrations, security hardening, and role helper fixes |
| [`docs/OPEN_ISSUES.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/OPEN_ISSUES.md) | Developers / Project Leads | Active tracker of resolved bugs, pending schema audits, and scheduled technical follow-ups |

---

## 7. Subsystem Developer Guides ("Where to Edit" Maps)

Dedicated developer manuals located directly inside feature folders, providing exhaustive "Where to Edit" lookup tables per `AGENTS.md` Rule 8:

| Subsystem Domain | Developer Guide Path | Scope & Focus |
| :--- | :--- | :--- |
| **Self-Service Kiosk** | [`app/kiosk/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/README.md) | Touchscreen check-in flow, typography scale, thermal receipt printing, and keypad inputs |
| **Nurse Station** | [`app/nurse/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/README.md) | 3-column consultation Kanban, clinical stage progression, IndexedDB offline outbox, and TTS |
| **Transfer Dashboard** | [`app/transfer/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/README.md) | Drag-and-drop patient transfers, FIFO queue discipline, registration counter releases, and room pickers |
| **Public Display Monitor** | [`app/monitor/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/README.md) | Public queue displays, category routing, paired cubicle cards, table rosters, and audio chime gates |
| **Admin Overview** | [`app/dashboard/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/README.md) | Executive KPI metrics, enterprise navigation sidebar, Manila clock, Recharts arrival trends |
| **Patients Queue Panel** | [`app/dashboard/pages/patients/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/README.md) | Live service queue inspection, multi-field search, patient audits, and department distributions |
| **Analytics Engine** | [`app/dashboard/pages/analytics/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/README.md) | Four-tier analytics visualization, ARIMA bottleneck forecasting, MAE model selection, Excel export |
| **Cubicle Monitoring** | [`app/dashboard/pages/cubicles/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/README.md) | Real-time cubicle consultation timers, doctor allocation grids, and counter utilization |
| **Superadmin Portal** | [`app/superadmin/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/README.md) | User account management, role assignments, cubicle mappings, and kiosk service menu controls |
| **Screen Gateway** | [`app/select-screen/README.md`](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/README.md) | Initial role and workstation navigation portal |
