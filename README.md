# Heart Check PHC — IoT Queue Management & Patient Flow Analytics

> **Collaborative Capstone Integration** for the **Philippine Heart Center (PHC)** Outpatient Department (OPD).  
> **STI College Caloocan — BS Computer Science**  
> **Team:** Justin Dayle D. Caasi, Reign Daniel C. Gutierrez, Lenardo R. Jualo, Jensen B. Urrutia

---

## 📌 Project Overview

**Heart Check PHC** is a specialized queue management and patient flow analytics system engineered specifically for the Philippine Heart Center's Outpatient Department. Rather than a generic hospital queue, the platform is designed around PHC's real-world operational constraints: scheduled patient appointments, fixed patient caps, capped cubicle capacities, and multi-stage patient flows (Registration → Triage/Screening → Specialized Services → Doctor Consultation).

The platform pairs an intuitive **IoT-based touchscreen check-in kiosk** and **public display monitor** with a comprehensive **clinical queue management interface** (Transfer/Nurse dashboard) and a **four-tier analytics engine** (Descriptive, Diagnostic, Predictive, Prescriptive).

---

## 🏛️ System Architecture

Heart Check PHC is architected as a cohesive full-stack platform:

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 15 (App Router)                     │
│                                                             │
│  /kiosk       — Touchscreen self-service patient check-in   │
│  /monitor     — Live public queue display for waiting rooms │
│  /transfer    — Clinical staff station: drag-and-drop queue │
│  /nurse       — Consultation cubicle & patient intake view  │
│  /dashboard   — Analytics dashboard (Recharts visualization)│
│  /superadmin  — System configuration & account management   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
       ┌───────▼────────┐             ┌────────▼─────────┐
       │    Supabase    │             │  FastAPI Backend │
       │  (PostgreSQL)  │◄────────────┤     (Python)     │
       │  - Realtime    │             │  - descriptive   │
       │  - RLS Security│             │  - queue_metrics │
       │  - patients    │             │  - forecasting   │
       │  - services    │             │  - staffing      │
       └────────────────┘             └──────────────────┘
```

### Key Modules & Capabilities

1. **Self-Service Kiosk (`/kiosk`):**
   - Multi-step touchscreen check-in (Category → Patient Type → Service → SMS Notifications → Queue Ticket Print).
   - Thermal receipt printer integration (`/api/print-ticket`) with queue number and estimated arrival information.

2. **Public Monitor (`/monitor`):**
   - High-visibility waiting room display with real-time Supabase subscriptions.
   - Dynamic service views (Consultation, Screening, Specialized tests) with active counter/cubicle callouts.

3. **Clinical Transfer Dashboard (`/transfer`):**
   - **Pointer Event Drag-and-Drop:** Native support for touchscreens, touch pens, and desktop mouse.
   - **FIFO Queue Stack Discipline:** Strict lock where only the top patient (`index === 0`, "Serving Next") is draggable and assignable, preventing queue jumping.
   - **Sticky Sub-Header Navigation:** Non-destructive step-back navigation and breadcrumbs pinned in place above scrollable content.
   - **Real-Time Indicators:** Live room badges showing patients queued vs. currently assigned.
   - **Registration & Cubicle Management:** Vertical lanes for registration counters and cubicle stations with timer tracking and doctor assignment.

4. **Analytics & Decision Support (`/dashboard`):**
   - **Descriptive:** Hourly arrival patterns, stage bottlenecks, compliance metrics.
   - **Diagnostic:** Service duration variance and stage drop-offs.
   - **Predictive:** Five forecasting models (SMA, WMA, EMA, Linear Regression, ARIMA) with automated MAE-based model selection.
   - **Prescriptive:** Capacity optimization and appointment cap policy recommendations.

5. **Administration (`/superadmin`):**
   - User account provisioning, role assignment, room and counter mapping, and kiosk service menu control.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Recharts |
| **Icons & UI** | Tabler Icons, Boxicons, Custom CSS design tokens |
| **Backend API** | FastAPI (Python 3.10+), Uvicorn |
| **Data & ML** | Pandas, NumPy, Scikit-learn, Statsmodels, SimPy |
| **Database** | Supabase (PostgreSQL 15), Supabase Realtime, Row-Level Security (RLS) |
| **Hardware / IoT**| Touchscreen Kiosk terminal, USB Thermal Receipt Printer, Audio speakers |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.18+ or 20+
- **Python** 3.10+
- **Supabase Account** (or local PostgreSQL instance)

### 1. Repository Setup

```bash
git clone https://github.com/NejChoco/heart-check-phc.git
cd heart-check-phc
```

### 2. Frontend Setup

Install dependencies and configure environment:

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Backend Setup

From the repository root, enter `python_backend/`:

```bash
cd python_backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Start the FastAPI analytics server:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend health at [http://localhost:8000/health](http://localhost:8000/health).

---

## 📊 Seeding and Simulation

Simulate realistic outpatient queue traffic using the integrated seeder:

```bash
cd python_backend
source venv/bin/activate
python db_seeder.py                  # Generates simulated_patients.csv
python import_seeder_to_supabase.py # Inserts records into Supabase
```

For automated periodic seeding, refer to [`docs/SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SETUP_AND_SEEDING.md).

---

## 📚 Project Documentation Directory

Comprehensive documentation is maintained in the `docs/` folder:

| Document | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/ARCHITECTURE.md) | High-level system architecture, queueing model, data flows, and tech stack |
| [`docs/TRANSFER_DASHBOARD.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/TRANSFER_DASHBOARD.md) | Comprehensive architecture & clinical workflow guide for the Transfer Dashboard |
| [`docs/COMPONENTS_GUIDE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/COMPONENTS_GUIDE.md) | Design system catalog & reusable UI components reference (`BackButton`, `ScrollArea`, etc.) |
| [`docs/DATABASE_SCHEMA.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/DATABASE_SCHEMA.md) | Table structures, column dictionaries, primary keys, and import pipeline details |
| [`docs/SCHEMA_REFERENCE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SCHEMA_REFERENCE.md) | Raw schema dump, data types, and live PostgreSQL RLS policy table |
| [`docs/SECURITY.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SECURITY.md) | Two-layer access control: Supabase Row-Level Security (RLS) + Next.js Middleware |
| [`docs/PRD.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/PRD.md) | Product Requirements Document: problem statement, scope, roles, and thesis criteria |
| [`docs/OPEN_ISSUES.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/OPEN_ISSUES.md) | Issue tracker documenting ongoing tasks and recently resolved bug fixes |
| [`docs/SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/SETUP_AND_SEEDING.md) | Installation, local configuration, and automated queue data seeding guide |
| [`docs/CHANGES_NEEDED.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/CHANGES_NEEDED.md) | Actionable checklist for database migrations, role helpers, and security patches |
| [`docs/FILE_ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/FILE_ARCHITECTURE.md) | Complete directory tree mapping every file in the repository |

---

## 📐 Architectural Standards (`AGENTS.md`)

All contributions to this repository follow strict software engineering rules:
1. **Separation of Concerns:** UI component files only assemble and render. Text copy resides in `<feature>Texts.ts`; styles and tokens reside in `<feature>.ts`.
2. **Comprehensive JSDoc Documentation:** Every file, component, hook, and utility function must be thoroughly documented with purpose, parameters, return types, and remarks.
3. **Fidelity to Clinical Workflows:** Layouts adhere faithfully to clinical requirements (strict FIFO queueing, pointer event drag operations, sticky navigation headers).
