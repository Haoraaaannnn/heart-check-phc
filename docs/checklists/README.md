# Quality Assurance, Security Audits, and Operational Checklists

This directory contains all actionable checklists, security audit matrices, quality verification protocols, and technical debt tracking documents for the Heart Check PHC platform.

---

## Master Checklist Index

| Checklist Document | Purpose & Scope | Key Topics Covered |
| :--- | :--- | :--- |
| [`IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md) | Master Roadmap & Feature Backlog | Complete tracking of completed architectural milestones, feature additions, and pending roadmap items across all clinical subsystems. |
| [`SECURITY_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md) | Security Verification & Compliance | Master 25-point security verification matrix covering OWASP Top 10, Supabase RLS policies, credential isolation, and brute-force mitigation. |
| [`UAT_USE_CASE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md) | User Acceptance Testing (UAT) | Operational verification scripts covering all clinical scenarios: kiosk intake, triage routing, nurse Kanban, and executive analytics. |
| [`API_LEAKS_AND_INJECTION_RISKS_AUDIT.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) | Vulnerability & Data Leak Audit | Comprehensive vulnerability audit of Next.js Route Handlers, service-role isolation, and SQL injection defense. |
| [`CHANGES_NEEDED.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/CHANGES_NEEDED.md) | Security Pass & Schema Fixes | Step-by-step technical debt checklist for database migrations, role-check helpers, and table policy hardening. |
| [`OPEN_ISSUES.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md) | Issue & Bug Resolution Tracker | Real-time tracking log of identified bugs, ongoing investigations, resolved defects, and verification status. |

---

## When to Consult These Documents

- **Before releasing or deploying new code:** Verify all items in [`SECURITY_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md).
- **During clinical user acceptance or thesis defense:** Execute test scenarios from [`UAT_USE_CASE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md).
- **When auditing API security and service-role keys:** Review findings in [`API_LEAKS_AND_INJECTION_RISKS_AUDIT.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md).
- **When planning new feature work or refactorings:** Check progress in [`IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md).
