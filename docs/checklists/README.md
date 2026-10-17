# Quality Assurance, Security Audits & Operational Checklists

**Last Updated:** 2026-10-18

This directory contains the central audit matrices, compliance checklists, operational trackers, and verification protocols for the **Heart Check PHC** Queue Management and Analytics System.

---

## Executive System Health & Audit Summary

| System Domain | Status | Key Highlights & Verification Evidence | Primary Checklist |
| :--- | :---: | :--- | :--- |
| **API Leaks & Code Security** | **100% Patched** | All 9 audited API routes, hardware printer handlers, SMS actions, and server-side proxies verified safe against code injection and data leaks. | [API_LEAKS_AND_INJECTION_RISKS_AUDIT.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) |
| **Database RLS & Schema** | **100% Active** | All 6 security migration steps executed and verified on live Supabase instance. Historical records locked with RESTRICTIVE policies. | [CHANGES_NEEDED.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/CHANGES_NEEDED.md) |
| **System Security (OWASP Top 10)** | **100% Core Protected** | 28 of 32 tracked items patched in active code. Remaining 4 items are designated for physical on-premise hospital deployment. | [SECURITY_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md) |
| **Active Open Issues** | **3 Action Items** | Core system is stable. 3 items pending: Chapter 4 simulation runner execution, Dependabot review, and FastAPI rate limiting. | [OPEN_ISSUES.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md) |
| **User Acceptance Testing (UAT)** | **Ready for Evaluation** | Structured test scripts covering Kiosk intake, Nurse Kanban, Transfer routing, and Executive analytics. | [UAT_USE_CASE_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md) |
| **Feature Roadmap & Backlog** | **Tracked** | Living backlog of completed architectural milestones and future clinical enhancements. | [IMPROVEMENTS_AND_FEATURE_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md) |

---

## Master Checklist Index

### 1. [OPEN_ISSUES.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md) — Master Issues & Action Items Tracker
- **Purpose:** Central running list of current work. Delineates the 3 active action items from post-capstone deployment tasks and the completed milestones archive.
- **When to Use:** Consult at the start of any work session to check active priorities and verified resolutions.

### 2. [API_LEAKS_AND_INJECTION_RISKS_AUDIT.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) — Vulnerability Audit & Exploit Proofs
- **Purpose:** Technical audit report detailing 9 specific API routes, printer handlers, and server actions.
- **Status:** **100% Fully Patched & Verified in Active Codebase.**
- **When to Use:** Consult when verifying Next.js Route Handlers, Server Actions, hardware interfaces, or preparing technical defense slides.

### 3. [CHANGES_NEEDED.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/CHANGES_NEEDED.md) — Database Migrations Execution Log
- **Purpose:** Chronological record and verification log of database schema migrations, PostgreSQL functions, and RLS policy updates.
- **Status:** **100% Executed & Verified on Live Database.** (No manual SQL execution required).
- **When to Use:** Consult when inspecting live PostgreSQL policies, helper functions (`is_staff`, `is_superadmin`), or verifying database setup.

### 4. [SECURITY_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md) — Master Security & Compliance Matrix
- **Purpose:** 32-point threat matrix mapped to OWASP Top 10 across database RLS, backend FastAPI, Next.js frontend, and physical kiosk terminals.
- **When to Use:** Consult before deploying code changes or conducting security architecture reviews.

### 5. [UAT_USE_CASE_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md) — User Acceptance Testing Protocols
- **Purpose:** End-to-end clinical verification scenarios: kiosk ticket issuance, SMS notifications, triage calling, queue rotation, and executive analytics.
- **When to Use:** Consult during client demonstrations, clinical trial runs, and thesis defense presentations.

### 6. [IMPROVEMENTS_AND_FEATURE_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md) — Feature Roadmap & Polish Backlog
- **Purpose:** Subsystem-by-subsystem enhancement backlog (Kiosk, Dashboard, Nurse, Transfer, Monitor, SuperAdmin).
- **When to Use:** Consult when scoping new user experience enhancements, tablet layouts, or ergonomic polish.

---

## Quick Navigation Guide

```
docs/checklists/
|-- README.md                                  <- You are here: Executive status dashboard & navigation
|-- OPEN_ISSUES.md                             <- Active action items (3 items) & resolved archive
|-- SECURITY_CHECKLIST.md                      <- Master 32-point security matrix (100% core patched)
|-- API_LEAKS_AND_INJECTION_RISKS_AUDIT.md     <- 9 API routes & printer audit (100% patched)
|-- CHANGES_NEEDED.md                          <- Database SQL migrations log (100% executed)
|-- UAT_USE_CASE_CHECKLIST.md                  <- Clinical test scenarios & acceptance protocols
`-- IMPROVEMENTS_AND_FEATURE_CHECKLIST.md      <- Subsystem feature roadmap & enhancements
```
