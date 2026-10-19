# Heart Check PHC: Master Documentation Portal & Navigation Index

**Last Updated:** 2026-10-19

This master index categorizes all technical specifications, operational manuals, quality assurance checklists, security audit matrices, database schemas, Capstone Chapter 4 simulation guides, data validation reports, and developer editing manuals across the Heart Check PHC repository.

The repository documentation is structured into five core directories:
1. **Quality Assurance & Audits (`docs/checklists/`):** Actionable checklists, vulnerability audits, UAT test matrices, and defect trackers.
2. **Technical Specifications (`docs/specifications/`):** Core platform architecture, system design specifications, database models, encryption architectures, and operational manuals.
3. **Capstone Simulation & Thesis Models (`docs/simulation/`):** Chapter 4 queue simulation models, M/M/1 mathematical formulations, baseline calibration data, and comparative output tables.
4. **Validation Reports & Findings (`docs/reports/`):** Machine learning validation audits, statistical model verifications, and pipeline discrepancy remediation plans.
5. **Database Migrations (`docs/migrations/`):** PostgreSQL DDL migration scripts and stored procedure definitions for Supabase.

In addition, feature-level developer manuals reside inside each subsystem module under `app/<module>/README.md`, Python backend references live under `python_backend/docs/`, and high-density memory notes live under `brain/`.

---

## Master Directory Layout

```
docs/
├── README.md                              # Master documentation portal (this file)
├── checklists/                            # Quality Assurance, Security Audits & Roadmap Trackers
│   ├── README.md                          # Dedicated checklists directory index
│   ├── IMPROVEMENTS_AND_FEATURE_CHECKLIST.md  # Master roadmap & feature backlog checklist
│   ├── SECURITY_CHECKLIST.md              # 25-point OWASP/HIPAA/RLS security checklist
│   ├── UAT_USE_CASE_CHECKLIST.md          # Clinical User Acceptance Testing verification matrix
│   ├── API_LEAKS_AND_INJECTION_RISKS_AUDIT.md # API security audit & credential isolation checklist
│   ├── CHANGES_NEEDED.md                  # Security pass action items & schema fixes checklist
│   └── OPEN_ISSUES.md                     # Active bug tracking & resolution checklist
├── specifications/                        # Core Technical & Architectural Blueprints
│   ├── README.md                          # Dedicated specifications directory index
│   ├── DESIGN.md                          # Master visual design & layout standards specification
│   ├── ARCHITECTURE.md                    # Platform architecture & Next.js/FastAPI stack
│   ├── SYSTEM_DESIGN.md                   # System design, data pipelines, and state machines
│   ├── FILE_ARCHITECTURE.md               # Repository file tree & directory map
│   ├── COMPONENTS_GUIDE.md                # UI design system & shared components (Merged into DESIGN.md)
│   ├── CONNECTIVITY_RESILIENCE.md         # Weak-signal safeguards & real-time resilience
│   ├── DATABASE_SCHEMA.md                 # Table structures, RLS policies & raw schema appendix
│   ├── DATA_ENCRYPTION_GUIDE.md           # Patient phone number AES-256-GCM encryption guide
│   ├── SECURITY.md                        # Access control, rate limiting & zero-trust model
│   ├── SETUP_AND_SEEDING.md               # Development setup & simulated queue traffic
│   ├── LOCAL_NETWORK_SETUP.md             # Local network sharing & multi-device deployment
│   ├── PRD.md                             # Product Requirements Document & capstone scope
│   ├── NURSE_DASHBOARD_SYSTEM_DESIGN.md   # Nurse station Kanban architecture
│   └── TRANSFER_DASHBOARD.md              # Patient transfer station architecture & customization guide
├── simulation/                            # Capstone Chapter 4 Queue Simulation Guides
│   ├── README.md                          # Simulation documentation directory index
│   ├── SIMULATION_EXECUTION_GUIDELINE.md  # Step-by-step execution & reproduction guide
│   ├── simulation-master-guide.md         # Master methodology guide, baseline analysis & decision rationale
│   ├── chapter4_simulation_comparison.md  # Granular comparison tables (Scenario A vs Scenario B)
│   └── chapter4_simulation_build_guide.md # Code skeleton, database extraction pipeline & runner guide
├── reports/                               # Validation Reports & Discrepancy Findings
│   ├── README.md                          # Reports directory index
│   └── ml_and_data_validation_report.md   # Master ML validation report & Section 10 remediation plan
└── migrations/                            # Database SQL Migrations
    ├── README.md                          # Migrations directory index & execution guide
    └── encrypt_phone_number.sql           # Schema migration converting phoneNum to encrypted text
```

---

## 1. Actionable Checklists & Quality Verification Matrices (`docs/checklists/`)

These documents represent live verification matrices, security compliance checklists, and roadmap trackers for development, QA, and deployment readiness.

| Checklist Document | Focus Area | Key Content |
| :--- | :--- | :--- |
| [`docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md) | Roadmap & Feature Status | Master catalog of completed refactoring milestones, implemented subsystems, and prioritized feature backlogs. |
| [`docs/checklists/SECURITY_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md) | Security & Compliance | Comprehensive 32-point checklist verifying service-role isolation, brute-force mitigation, IP rate limiting, audio caching, and SQL injection proofing. |
| [`docs/checklists/UAT_USE_CASE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md) | Quality Assurance (QA) | Verification matrix for User Acceptance Testing across kiosk check-in, triage routing, nurse Kanban, and analytics. |
| [`docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) | Security Vulnerabilities | Audit of Route Handlers, service-role credential isolation, SQL injection prevention, rate limiting, and authorization guards. |
| [`docs/checklists/CHANGES_NEEDED.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/CHANGES_NEEDED.md) | Technical Debt Remediation | Ordered action checklist for database migrations, role-check helpers, and table policy fixes. |
| [`docs/checklists/OPEN_ISSUES.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md) | Defect Tracking | Real-time tracker recording resolved bugs, active investigations, and pending schema audits. |

---

## 2. Technical Specifications & Architecture (`docs/specifications/`)

These documents provide deep architectural specifications, data models, communication protocols, cryptographic standards, and operational workflows.

| Specification Document | Category | Key Content |
| :--- | :--- | :--- |
| [`docs/specifications/DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DESIGN.md) | **Master Design & Layout Standards** | Visual design system, prohibition of pillbox shapes and icon backgrounds, high-contrast solid surfaces, layout archetypes, color tokens, and reusable components. |
| [`docs/specifications/ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/ARCHITECTURE.md) | Full-Stack Platform | Full-stack platform architecture, Next.js App Router layout, FastAPI analytics engine, queueing models, and data flows. |
| [`docs/specifications/SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SYSTEM_DESIGN.md) | System Specifications | Service contracts, real-time message broadcasting, state transitions, and cross-subsystem interactions. |
| [`docs/specifications/FILE_ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/FILE_ARCHITECTURE.md) | Codebase Directory Map | Exhaustive file tree documenting every route, component, hook, utility, and constants dictionary in the repository. |
| [`docs/specifications/COMPONENTS_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/COMPONENTS_GUIDE.md) | Design System | Design system component catalog, shared UI primitives (`BackButton`, `ScrollArea`), and token conventions (Merged into `DESIGN.md`). |
| [`docs/specifications/CONNECTIVITY_RESILIENCE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/CONNECTIVITY_RESILIENCE.md) | Network Resilience | Weak-signal safeguards, WebSocket fallback mechanisms, 300ms debounce, 2s hysteresis, and LAN migration roadmap. |
| [`docs/specifications/DATABASE_SCHEMA.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md) | **Master Database Schema & Policies** | Consolidated table structures, column definitions, primary keys, and **Appendix A: Raw Table Column Schemas & Verified RLS Policies**. |
| [`docs/specifications/SECURITY.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SECURITY.md) | **Security Architecture** | Multi-layer access control: Supabase RLS, Next.js server proxy (`proxy.ts`), Layer 3 Rate Limiting & Cost Protection, and Layer 4 SQL Injection Immunity. |
| [`docs/specifications/TRANSFER_DASHBOARD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/TRANSFER_DASHBOARD.md) | **Master Transfer Dashboard Guide** | Consolidated Patient Transfer station architecture, FIFO queue lock, pointer event drag-and-drop, and **Section 7 Developer Customization & Where to Edit Guide**. |
| [`docs/specifications/DATA_ENCRYPTION_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATA_ENCRYPTION_GUIDE.md) | Data Privacy & Crypto | Authenticated symmetric encryption (AES-256-GCM) for patient phone numbers, key derivation, and UI masking. |
| [`docs/specifications/SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SETUP_AND_SEEDING.md) | Environment Setup | Local development setup, database migrations, Python virtual environment, and simulated queue traffic generation. |
| [`docs/specifications/LOCAL_NETWORK_SETUP.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/LOCAL_NETWORK_SETUP.md) | Multi-Device Deployment | Local network sharing, IP binding with `npm start`, and station setup for kiosks, monitors, and tablets. |
| [`docs/specifications/PRD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/PRD.md) | Product Scope | Product Requirements Document: problem statement, thesis objectives, user roles, and core operational needs. |
| [`docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md) | Clinical Workstations | Consultation cubicle intake, 3-column Kanban board, optimistic state updates, and IndexedDB outbox queue. |

---

## 3. Capstone Chapter 4 Queue Simulation Guides (`docs/simulation/`)

These documents detail the statistical simulation, queuing theory models, and comparative evaluation proving the effectiveness of the digital queue system for the thesis presentation.

| Simulation Document | Category | Key Content |
| :--- | :--- | :--- |
| [`docs/simulation/SIMULATION_EXECUTION_GUIDELINE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/SIMULATION_EXECUTION_GUIDELINE.md) | **Step-by-Step Execution Guideline** | Comprehensive instructions to set up the environment, execute the simulation, interpret outputs, and export CSV tables. |
| [`docs/simulation/simulation-master-guide.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/simulation-master-guide.md) | **Master Simulation Guide** | Consolidated research strategy, validation pillars, M/M/1 queue models, Section 9 Comprehensive Decision Rationale, and Section 10 Grand Mean vs. Monthly Means Analysis. |
| [`docs/simulation/chapter4_simulation_comparison.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_comparison.md) | **Comparative Results Manuscript** | Granular side-by-side results (Manual Scenario A vs Digital Scenario B), wait time reductions, traffic intensity changes, and compliance shifts. |
| [`docs/simulation/chapter4_simulation_build_guide.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_build_guide.md) | **Implementation & Runner Guide** | Complete code skeleton, Supabase historical data extraction, M/M/1 runner, and terminal execution walkthrough. |

---

## 4. Machine Learning & Data Validation Reports (`docs/reports/`)

These documents provide formal mathematical audits of analytical calculations, statistical algorithms, and data import/export pipelines.

| Report Document | Category | Key Content |
| :--- | :--- | :--- |
| [`docs/reports/ml_and_data_validation_report.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/reports/ml_and_data_validation_report.md) | **Master Validation & Remediation Report** | Full mathematical audit of all 5 forecasting models (SMA, WMA, EMA, Linear Regression, ARIMA), queueing theory models, bottleneck scoring, PHC Excel import/export pipelines, **and Section 10 Actionable Remediation Plans & Verified Implementation Resolutions** (F-01 through F-07). |

---

## 5. Database SQL Migrations (`docs/migrations/`)

These scripts manage database schema evolutions, stored procedure definitions, and cryptographic type updates.

| Migration Document | Category | Key Content |
| :--- | :--- | :--- |
| [`docs/migrations/encrypt_phone_number.sql`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/migrations/encrypt_phone_number.sql) | Schema Migration | Alters `patients.phoneNum` to text and updates `create_patient` stored procedure signature for AES-256-GCM ciphertext tokens. |

---

## 6. Subsystem Developer Guides ("Where to Edit" Maps)

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
| **Data Import Subsystem** | [`app/dashboard/pages/import/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/README.md) | Drag-and-drop Excel/CSV data ingestion, inspection preview modal, and batch commit pipeline. |
| **Data Export Subsystem** | [`app/dashboard/pages/export/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/README.md) | Multi-format Excel reporting, official PHC template formatting, and download tracker. |
| **Superadmin Portal** | [`app/superadmin/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/superadmin/README.md) | User account management, role assignments, cubicle mappings, and kiosk service menu controls. |
| **Python Backend Engine** | [`python_backend/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/README.md) | FastAPI analytics server, algorithms reference, database scripts, and parameter matrix. |

---

## 7. Second Brain Knowledge Base (`brain/`)

For AI coding agents and human architects, the repository maintains an Obsidian-compatible second brain under [`brain/INDEX.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/INDEX.md):
- **Current Sprint & State:** [`brain/CURRENT.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/CURRENT.md)
- **Architecture Blueprints:** [`brain/architecture/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/architecture/)
- **Architecture Decision Records:** [`brain/decisions/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/decisions/)
- **Domain Knowledge:** [`brain/knowledge/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/knowledge/)
- **Operational Debugging:** [`brain/debugging/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/debugging/)
- **Session Handoffs:** [`brain/handoffs/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/handoffs/)
