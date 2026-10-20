# Domain Knowledge & Cross-Cutting Conventions Index

**Last Updated:** 2026-10-18

This directory stores cross-cutting domain knowledge, hospital operational rules, clinical protocols, and hardware integrations for the Philippine Heart Center Outpatient Department (PHC OPD).

---

## Modularity Principle

To keep retrieval token-efficient and avoid context saturation:
- Maintain **focused, single-topic notes** instead of growing one giant document.
- Link between related notes rather than duplicating background explanations.
- Record reusable institutional knowledge, mathematical formulations, and hardware quirks discovered during development.

---

## Domain Knowledge Map

Consult the following focused documents for specific operational domains:

| Document | When to Consult |
| :--- | :--- |
| [PHC OPD Operational Workflow](./phc-opd-workflow.md) | Hospital five-stage patient journey, triage desk routing, daily consultation caps, and clinical priority rules. |
| [Self-Service Kiosk & Thermal Printing](./kiosk-and-printing.md) | Touchscreen UX flows, hardware printer specifications, ESC/POS byte commands, and ticket format standards. |
| [Nurse Station & Consultation Kanban](./nurse-and-kanban.md) | Cubicle intake workflow, 3-column Kanban state transitions, Web Speech API audio callouts, and optimistic UI updates. |
| [Analytics Engine & ML Models](./analytics-and-ml.md) | Five queue forecasting models (SMA, WMA, EMA, Linear Regression, ARIMA), MAE model selector, M/M/1 queuing equations, and Little's Law. |
| [Data Pipelines & Excel Ingestion](./data-pipelines.md) | Historical PHC outpatient Excel workbook parsing, AM/PM heuristics, timezone offset alignment, and seeder pipeline rules. |
