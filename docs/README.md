# Heart Check PHC: Master Documentation Portal & Navigation Index

This master index categorizes all technical specifications, operational guides, quality assurance checklists, security audit matrices, database schemas, and developer editing manuals across the Heart Check PHC repository.

The documentation is organized into two primary categories:
1. **Checklists and Audits (`docs/checklists/`):** Actionable checklists, vulnerability audits, UAT test matrices, and defect trackers.
2. **Technical Specifications (`docs/specifications/`):** Core platform architecture, system design specifications, database models, and operational manuals.

---

## Master Directory Layout

```
docs/
├── README.md                              # This master documentation portal
├── checklists/                            # Quality Assurance & Operational Checklists
│   ├── README.md                          # Dedicated checklists directory index
│   ├── IMPROVEMENTS_AND_FEATURE_CHECKLIST.md  # Master roadmap & feature backlog checklist
│   ├── SECURITY_CHECKLIST.md              # 25-point OWASP/HIPAA/RLS security checklist
│   ├── UAT_USE_CASE_CHECKLIST.md          # Clinical User Acceptance Testing verification matrix
│   ├── API_LEAKS_AND_INJECTION_RISKS_AUDIT.md # API security audit & credential isolation checklist
│   ├── CHANGES_NEEDED.md                  # Security pass action items & schema fixes checklist
│   └── OPEN_ISSUES.md                     # Active bug tracking & resolution checklist
└── specifications/                        # Core Technical & Architectural Documents
    ├── README.md                          # Dedicated specifications directory index
    ├── ARCHITECTURE.md                    # Platform architecture & Next.js/FastAPI stack
    ├── SYSTEM_DESIGN.md                   # System design, data pipelines, and state machines
    ├── FILE_ARCHITECTURE.md               # Repository file tree & directory map
    ├── COMPONENTS_GUIDE.md                # UI design system & shared components
    ├── CONNECTIVITY_RESILIENCE.md         # Weak-signal safeguards & real-time resilience
    ├── DATABASE_SCHEMA.md                 # Table structures & legacy data migration
    ├── SCHEMA_REFERENCE.md                # PostgreSQL schema DDL & live RLS policies
    ├── SECURITY.md                        # Access control & zero-trust security model
    ├── SETUP_AND_SEEDING.md               # Development setup & simulated queue traffic
    ├── PRD.md                             # Product Requirements Document & capstone scope
    ├── NURSE_DASHBOARD_SYSTEM_DESIGN.md   # Nurse station Kanban architecture
    ├── TRANSFER_DASHBOARD.md              # Patient transfer station architecture
    └── TRANSFER_MANUAL_TWEAKING_GUIDE.md  # Operator handbook for queue tuning
```

---

## 1. Actionable Checklists & Quality Verification Matrices (`docs/checklists/`)

These documents represent live verification matrices, security compliance checklists, and roadmap trackers for development, QA, and deployment readiness.

| Checklist Document | Focus Area | Key Content |
| :--- | :--- | :--- |
| [`docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md) | Roadmap & Feature Status | Master catalog of completed refactoring milestones, implemented subsystems, and prioritized feature backlogs. |
| [`docs/checklists/SECURITY_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md) | Security & Compliance | Master 25-point checklist verifying service-role isolation, brute-force mitigation, cookie flags, and parameterized queries. |
| [`docs/checklists/UAT_USE_CASE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md) | Quality Assurance (QA) | Verification matrix for User Acceptance Testing across kiosk check-in, triage routing, nurse Kanban, and analytics. |
| [`docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) | Security Vulnerabilities | Audit of Route Handlers, service-role credential isolation, SQL injection prevention, and CORS policies. |
| [`docs/checklists/CHANGES_NEEDED.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/CHANGES_NEEDED.md) | Technical Debt Remediation | Ordered action checklist for database migrations, role-check helpers, and table policy fixes. |
| [`docs/checklists/OPEN_ISSUES.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md) | Defect Tracking | Real-time tracker recording resolved bugs, active investigations, and pending schema audits. |

---

## 2. Technical Specifications & Architecture (`docs/specifications/`)

These documents provide deep architectural specifications, data models, communication protocols, and operational workflows for engineers and system designers.

| Specification Document | Category | Key Content |
| :--- | :--- | :--- |
| [`docs/specifications/ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/ARCHITECTURE.md) | Full-Stack Platform | Full-stack platform architecture, Next.js App Router layout, FastAPI analytics engine, queueing models, and data flows. |
| [`docs/specifications/SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SYSTEM_DESIGN.md) | System Specifications | Service contracts, real-time message broadcasting, state transitions, and cross-subsystem interactions. |
| [`docs/specifications/FILE_ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/FILE_ARCHITECTURE.md) | Codebase Directory Map | Exhaustive file tree documenting every route, component, hook, utility, and constants dictionary in the repository. |
| [`docs/specifications/COMPONENTS_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/COMPONENTS_GUIDE.md) | Design System | Design system component catalog, shared UI primitives (`BackButton`, `ScrollArea`), and token conventions. |
| [`docs/specifications/CONNECTIVITY_RESILIENCE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/CONNECTIVITY_RESILIENCE.md) | Network Resilience | Weak-signal safeguards, WebSocket fallback mechanisms, 300ms debounce, 2s hysteresis, and LAN migration roadmap. |
| [`docs/specifications/DATABASE_SCHEMA.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md) | Database Models | Table structures, column definitions, primary keys, relationships, and legacy data migration pipelines. |
| [`docs/specifications/SCHEMA_REFERENCE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SCHEMA_REFERENCE.md) | Schema & RLS Reference | PostgreSQL DDL definitions, data types, and live Row-Level Security (RLS) policies. |
| [`docs/specifications/SECURITY.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SECURITY.md) | Security Architecture | Two-layer access control: Supabase Row-Level Security (RLS) policies and Next.js middleware route guarding. |
| [`docs/specifications/SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SETUP_AND_SEEDING.md) | Environment Setup | Local development setup, database migrations, Python virtual environment, and simulated queue traffic generation. |
| [`docs/specifications/PRD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/PRD.md) | Product Scope | Product Requirements Document: problem statement, thesis objectives, user roles, and core operational needs. |
| [`docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md) | Clinical Workstations | Consultation cubicle intake, 3-column Kanban board, optimistic state updates, and IndexedDB outbox queue. |
| [`docs/specifications/TRANSFER_DASHBOARD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/TRANSFER_DASHBOARD.md) | Clinical Workstations | Patient Transfer station architecture, FIFO queue lock, pointer event drag-and-drop, and counter release flow. |
| [`docs/specifications/TRANSFER_MANUAL_TWEAKING_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/TRANSFER_MANUAL_TWEAKING_GUIDE.md) | Operations Handbook | Operator handbook for tuning queue capacities, cooldown timers, rotation rules, and doctor assignments. |

---

## 3. Subsystem Developer Guides ("Where to Edit" Maps)

Per `AGENTS.md` Rule 8, each major subsystem folder includes a dedicated developer editing guide with exhaustive lookup tables showing developers exactly where to make modifications:

| Subsystem Domain | Developer Guide Path | Scope & Focus |
| :--- | :--- | :--- |
| **Public Landing Page** | [`app/landing/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/README.md) | Landing hero, integrated clinical suite cards, 4-stage patient workflow, and legal disclaimers. |
| **Staff Login Module** | [`app/login/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/README.md) | Authentication card, rate limiting countdown banner, password reveal toggle, and session routing. |
| **Screen Gateway & Selector** | [`app/select-screen/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/README.md) | Terminal station routing, role filtering, Kiosk session auto sign-out, and display configurations. |
| **Self-Service Kiosk** | [`app/kiosk/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/README.md) | Touchscreen check-in flow, typography scale, thermal receipt printing, and keypad inputs. |
| **Nurse Station** | [`app/nurse/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/README.md) | 3-column consultation Kanban, clinical stage progression, IndexedDB offline outbox, and TTS. |
| **Transfer Dashboard** | [`app/transfer/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/README.md) | Drag-and-drop patient transfers, FIFO queue discipline, registration counter releases, and room pickers. |
| **Public Display Monitor** | [`app/monitor/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/README.md) | Public queue displays, category routing, paired cubicle cards, table rosters, and audio chime gates. |
| **Admin Overview** | [`app/dashboard/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/README.md) | Executive KPI metrics, enterprise navigation sidebar, Manila clock, Recharts arrival trends. |
| **Patients Queue Panel** | [`app/dashboard/pages/patients/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/patients/README.md) | Live service queue inspection, multi-field search, patient audits, and department distributions. |
| **Analytics Engine** | [`app/dashboard/pages/analytics/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/analytics/README.md) | Four-tier analytics visualization, ARIMA bottleneck forecasting, MAE model selection, Excel export. |
| **Cubicle Monitoring** | [`app/dashboard/pages/cubicles/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/cubicles/README.md) | Real-time cubicle consultation timers, doctor allocation grids, and counter utilization. |
| **Superadmin Portal** | [`app/superadmin/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/superadmin/README.md) | User account management, role assignments, cubicle mappings, and kiosk service menu controls. |
