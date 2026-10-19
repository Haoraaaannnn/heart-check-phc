# Debugging & Troubleshooting Index

**Last Updated:** 2026-10-18

This directory contains diagnostic playbooks, root-cause analyses, and resolution steps for recurring or complex operational defects encountered in Heart Check PHC.

---

## When and How to Record Bug Fixes

Only record bug fixes that possess **reusable future value**.

### Criteria for Inclusion
- Issue is recurring, non-trivial, or spans multiple subsystems (e.g. Next.js to FastAPI, PostgreSQL RLS recursion, hardware printer timeouts).
- Resolution required non-obvious investigation or revealed subtle architectural edge cases.
- **Do NOT record:** Simple typos, missing semicolons, obvious syntax errors, or one-off development mistakes without long-term value.

### Required Entry Schema
Every troubleshooting entry or newly created debugging note must document:
1. **Symptoms:** Observable indicators (error codes, HTTP statuses, console errors, UI freezing).
2. **Verified Root Cause:** The precise mechanical failure identified through investigation (not guesses).
3. **Solution / Remediation:** Exact configuration change, code diff, or SQL statement that resolves the defect.
4. **Prevention Note:** Defensive patterns, tests, or linters to prevent re-occurrence.

---

## Debugging Guides Map

Consult the following focused documents when troubleshooting issues:

| Guide | When to Consult |
| :--- | :--- |
| [Common System Issues](./common-issues.md) | Thermal receipt printer timeouts (`/api/print-ticket`), Supabase RLS recursion (`42P17`), CORS errors, and WebSocket drops. |
| [Database Troubleshooting](./database-troubleshooting.md) | Supabase PostgreSQL policy conflicts, phone number AES-256-GCM verification, and schema migration rollouts. |
| [Simulation Execution Guide](./simulation-guide.md) | Chapter 4 SimPy discrete-event simulation errors, baseline reproduction, parameter divergence, and throughput checks. |
