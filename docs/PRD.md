# Heart Check PHC — Product Requirements Document

## Problem Statement

The Philippine Heart Center's (PHC) Outpatient Department manages patient flow through a scheduled appointment system with fixed patient caps, non-expandable cubicles, and no-show rescheduling policies. Under this structure, operational variance is inherently low — but PHC currently lacks a system to systematically track, analyze, and forecast queue behavior across registration, specialized services, and consultation stages. Without this, policy decisions around appointment caps, staffing, and service scheduling are made without a data-backed view of actual patient flow patterns.

Heart Check PHC addresses this by pairing an IoT-based queue management kiosk with a full analytics pipeline — descriptive, diagnostic, predictive, and prescriptive — built specifically around PHC's real operational constraints rather than a generic hospital queueing template.

## Project Framing

This is explicitly a **collaborative integration** with PHC's existing infrastructure, not a greenfield deployment. This distinction matters throughout the system design: the kiosk demonstrates the operational/IoT side, while the analytics dashboard demonstrates the data science side — together satisfying both the ML and Data Analytics specialization requirements for the capstone.

## Objectives

1. Digitize and streamline the OPD queueing process via a kiosk-based check-in system
2. Provide real-time queue visibility to patients (display monitor) and staff (nurse/transfer views)
3. Apply queueing theory (M/M/1 per service/cubicle, Erlang C as benchmark) to model actual patient flow
4. Deliver a four-tier analytics framework — descriptive, diagnostic, predictive, prescriptive — over both live and historical patient flow data
5. Provide forecasting (five algorithms, MAE-based auto-selection) as a strategic policy decision-support tool, given PHC's fixed appointment caps
6. Document the system such that a handoff to PHC's IT/MIS team for on-premises production deployment is realistic and low-friction

## Users & Roles

| Role                        | Needs                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| **Patient (kiosk user)**    | Check in for a service, receive a queue number, no login required                                 |
| **Public viewer (monitor)** | See current queue status on a display board, no login required                                    |
| **Nurse / Transfer staff**  | View and update the live queue as patients move through registration → consultation stages        |
| **Admin**                   | View the analytics dashboard — descriptive/diagnostic/predictive/prescriptive reports             |
| **Superadmin**              | Full account management — create, update, delete user accounts (highest trust tier, e.g. PHC MIS) |

## Scope

### In Scope

- Kiosk check-in flow for OPD services (Consultation, OPD Screening, others per `services` table)
- Live queue tracking through registration and consultation stages
- Real-time display monitor
- Role-based staff interface for queue progression
- Full analytics dashboard: descriptive, diagnostic, predictive (forecasting), prescriptive
- Historical data import and integration (PHC's existing Excel-based records, March 2024–December 2025)
- Queueing theory modeling (M/M/1 per service/cubicle; Erlang C as theoretical benchmark)
- Role-based access control at both the data layer (RLS) and route layer (middleware)

### Out of Scope (for this thesis iteration)

- Live production deployment on PHC's on-premises infrastructure (planned as a follow-up handoff, not required for Chapter 4)
- Per-patient dynamic wait-time prediction (planned future ML addition, not part of current deliverable)
- Bottleneck/anomaly detection (planned future addition, scoped as future work if time-constrained)
- Offline mode (unnecessary — on-prem deployment means no internet dependency, LAN uptime is PHC MIS's responsibility)
- Appointment scheduling / priority triage logic — PHC's cardiac-focused patient population doesn't fit a general "seniors/PWD first" triage model the way a general-purpose government queue system might

## Success Criteria (Chapter 4)

- All four analytics tiers demonstrated with real PHC historical data
- Forecasting MAE comparisons across all five algorithms, with justified auto-selection logic
- Queue model outputs (M/M/1, Erlang C benchmark) validated against actual recorded wait times
- UAT completed with two evaluator groups:
  - **PHC MIS staff** — evaluating the analytics dashboard
  - **Classmates simulating nurse/receptionist roles** — evaluating operational queue flow
- Seeded/historical data plus a UAT questionnaire is treated as a valid and complete Chapter 4 approach — live PHC deployment is not a prerequisite for this thesis milestone

## Why Forecasting Is Justified Despite Fixed Caps

Two defensible positions, both used together:

1. **Strategic policy decision-support tool** — PHC's appointment caps and queue policies can evolve over time (e.g. adjusting caps, adding cubicles); forecasting supports those longer-horizon policy decisions rather than day-to-day operational capacity planning.
2. **Predictive analytics tier fulfillment** — forecasting satisfies the predictive tier of the four-level analytics framework the thesis is structured around, independent of whether PHC's caps are currently fixed.

## Planned Future Work (Post-Thesis-Deliverable)

1. **Per-patient dynamic wait-time prediction** (build first) — regression model factoring in cubicle/doctor assignment, time of day/week, and recent rolling service times. Recalculates on queue events via Supabase Realtime. Surfaces on the ticket printout, display board, and SMS.
2. **Bottleneck/anomaly detection** — lightweight statistical layer on top of `descriptive.py`, flagging queue stages running abnormally slow against historical norms. Feeds into (1) as a real-time adjustment, or is scoped as future work if time-constrained.

## Non-Functional Requirements

- **Security:** Row-level access control (Supabase RLS) and route-level access control (Next.js middleware) — see `SECURITY.md`
- **Data integrity:** Historical/imported data must be protected from accidental modification by live operational writes — enforced via the `is_historical` row flag
- **Deployment:** Vercel (frontend), Railway (backend), Supabase (dev database) during development; on-prem PostgreSQL migration path documented for production handoff

---

_Last updated: reflects current project scope ahead of Chapter 4 (Results and Discussion). Revisit scope boundaries if future-work items get pulled forward._
