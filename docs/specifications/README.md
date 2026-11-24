# Technical Specifications & System Architecture

**Last Updated:** 2026-11-24

This directory contains the authoritative technical specifications, database schemas, cryptographic blueprints, UI design guidelines, and system models for the **Heart Check PHC** platform.

---

## Technical Specifications Index

| Specification Document | Category | Key Topics Covered |
| :--- | :--- | :--- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | **Platform Architecture** | Full-stack platform architecture, Next.js 15 App Router layout, FastAPI analytics engine, M/M/1 queueing models, Dual-Mode Network Resilience, and the Decoupled Standard. |
| [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) | **Database Schema & Policies** | Consolidated table structures, column dictionaries, relationships, primary keys, ticket movement history triggers, and verified Supabase RLS policies. |
| [`SECURITY.md`](./SECURITY.md) | **Master Security Architecture** | Multi-layer access control: Supabase RLS, Server Route Guarding (`proxy.ts`), Rate Limiting & Abuse Controls, SQL Injection Immunity, and AES-256-GCM Phone Encryption. |
| [`DESIGN.md`](./DESIGN.md) | **Visual Design & Layout Standards** | Visual design system, prohibition of pillbox shapes and icon backgrounds, high-contrast solid surfaces, layout archetypes, color tokens, and separation-of-concerns architecture. |
| [`PRD.md`](./PRD.md) | **Product Requirements Document** | Problem statement, collaborative integration framing, user personas, operational scope, and success criteria. |
| [`REQUIREMENTS.md`](./REQUIREMENTS.md) | **Software Requirements Specification (SRS)** | Complete functional and non-functional requirements (academic thesis modular format) referencing active codebase architecture across all workstations. |
| [`ESTIMATED_WAIT_TIME.md`](./ESTIMATED_WAIT_TIME.md) | **Wait Time & Queueing Formulas** | Hybrid EWT formula, database queries, thermal receipt ESC/POS integration, kiosk Screen 6 display, SMS confirmation message, and queue modeling. |
| [`PRINTER_SETUP_GUIDE.md`](./PRINTER_SETUP_GUIDE.md) | **Hardware Printing Architecture** | Hybrid dual-tier printer engine supporting direct plug-and-play WebUSB/WebSerial API detection and TCP/IP raw socket Ethernet printing. |
| [`SETUP_AND_SEEDING.md`](./SETUP_AND_SEEDING.md) | **Development Setup & Seeding** | Local environment setup, database migrations, Python virtual environment, and simulated queue traffic generation. |
