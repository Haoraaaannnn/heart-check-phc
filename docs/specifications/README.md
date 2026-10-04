# Technical Specifications, System Architecture, and Operational Guides

This directory contains all core architectural blueprints, database schemas, UI design guidelines, and station manuals for the Heart Check PHC platform.

---

## Technical Specifications Index

| Specification Document | Category | Key Topics Covered |
| :--- | :--- | :--- |
| [`ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/ARCHITECTURE.md) | Platform Architecture | Full-stack platform architecture, Next.js App Router layout, FastAPI analytics engine, queueing models, and data flows. |
| [`SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SYSTEM_DESIGN.md) | System Design | Detailed service contracts, communication protocols, state machine transitions, and cross-subsystem interactions. |
| [`FILE_ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/FILE_ARCHITECTURE.md) | Directory Mapping | Complete directory tree mapping every file, route, component, and utility in the codebase. |
| [`COMPONENTS_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/COMPONENTS_GUIDE.md) | UI Design System | Catalog of reusable UI components (`BackButton`, `ScrollArea`), token conventions, and styling rules. |
| [`CONNECTIVITY_RESILIENCE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/CONNECTIVITY_RESILIENCE.md) | Network Resilience | Weak-signal safeguards, WebSocket fallback mechanisms, 300ms debounce, and LAN migration roadmap. |
| [`DATABASE_SCHEMA.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md) | Database Models | Table structures, column dictionaries, relationships, primary keys, and legacy data migration pipelines. |
| [`SCHEMA_REFERENCE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SCHEMA_REFERENCE.md) | Schema & RLS Reference | PostgreSQL DDL definitions, data types, and live Row-Level Security (RLS) policies. |
| [`SECURITY.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SECURITY.md) | Access Control | Two-layer access control: Supabase Row-Level Security (RLS) policies and Next.js middleware route guarding. |
| [`SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SETUP_AND_SEEDING.md) | Environment Setup | Local environment setup, database migrations, Python virtual environment, and simulated queue traffic generation. |
| [`PRD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/PRD.md) | Product Requirements | Product Requirements Document: problem statement, thesis objectives, user personas, and core operational needs. |
| [`NURSE_DASHBOARD_SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md) | Clinical Design | Consultation cubicle intake, 3-column Kanban board, optimistic state updates, and IndexedDB outbox queue. |
| [`TRANSFER_DASHBOARD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/TRANSFER_DASHBOARD.md) | Front-Desk Design | Patient Transfer station architecture, FIFO queue lock, pointer event drag-and-drop, and counter release flow. |
| [`TRANSFER_MANUAL_TWEAKING_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/TRANSFER_MANUAL_TWEAKING_GUIDE.md) | Operations Handbook | Operator handbook for tuning queue capacities, cooldown timers, rotation rules, and doctor assignments. |
