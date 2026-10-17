# Technical Specifications, System Architecture, and Operational Guides

**Last Updated:** 2026-10-17

This directory contains all core architectural blueprints, database schemas, cryptographic specifications, UI design guidelines, and station manuals for the Heart Check PHC platform.

---

## Technical Specifications Index

| Specification Document | Category | Key Topics Covered | Status |
| :--- | :--- | :--- | :---: |
| [`ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/ARCHITECTURE.md) | Platform Architecture | Full-stack platform architecture, Next.js App Router layout, FastAPI analytics engine, queueing models, and data flows. | Active |
| [`SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SYSTEM_DESIGN.md) | System Design | Detailed service contracts, communication protocols, state machine transitions, and cross-subsystem interactions. | Active |
| [`DATABASE_SCHEMA.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md) | **Master Database Schema & Policies** | Consolidated table structures, column dictionaries, relationships, primary keys, and **Appendix A: Raw Table Column Schemas & Verified RLS Policies**. | Authoritative Master Doc |
| [`SECURITY.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SECURITY.md) | **Security Architecture** | Multi-layer access control: Supabase RLS, Next.js server proxy (`proxy.ts`), Layer 3 Rate Limiting & Cost Protection, and Layer 4 SQL Injection Immunity. | Authoritative Master Doc |
| [`TRANSFER_DASHBOARD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/TRANSFER_DASHBOARD.md) | **Master Transfer Dashboard Guide** | Consolidated Patient Transfer station architecture, FIFO queue lock, pointer event drag-and-drop, and **Section 7 Developer Customization & Where to Edit Guide**. | Authoritative Master Doc |
| [`DATA_ENCRYPTION_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATA_ENCRYPTION_GUIDE.md) | Cryptography & Privacy | Patient phone number AES-256-GCM encryption architecture, key derivation, and PII masking. | Active |
| [`FILE_ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/FILE_ARCHITECTURE.md) | Directory Mapping | Complete directory tree mapping every file, route, component, and utility in the codebase. | Active |
| [`COMPONENTS_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/COMPONENTS_GUIDE.md) | UI Design System | Catalog of reusable UI components (`BackButton`, `ScrollArea`), token conventions, and styling rules. | Active |
| [`CONNECTIVITY_RESILIENCE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/CONNECTIVITY_RESILIENCE.md) | Network Resilience | Weak-signal safeguards, WebSocket fallback mechanisms, 300ms debounce, and LAN migration roadmap. | Active |
| [`SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SETUP_AND_SEEDING.md) | Environment Setup | Local environment setup, database migrations, Python virtual environment, and simulated queue traffic generation. | Active |
| [`LOCAL_NETWORK_SETUP.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/LOCAL_NETWORK_SETUP.md) | Multi-Device Deployment | Local network sharing, IP binding with `npm start`, and station setup for kiosks, monitors, and tablets. | Active |
| [`PRD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/PRD.md) | Product Requirements | Product Requirements Document: problem statement, thesis objectives, user personas, and core operational needs. | Active |
| [`NURSE_DASHBOARD_SYSTEM_DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md) | Clinical Design | Consultation cubicle intake, 3-column Kanban board, optimistic state updates, and IndexedDB outbox queue. | Active |
