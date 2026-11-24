# Heart Check PHC: Master Documentation Portal & Navigation Index

**Last Updated:** 2026-11-24

This master index categorizes all production technical specifications, operational deployment manuals, hardware setup guides, database schemas, and developer manuals across the **Heart Check PHC** repository.

The repository documentation is organized into two primary tiers:
1. **Operational & Deployment Manuals (`docs/` root):** End-to-end user manuals, Docker offline execution, hardware thermal receipt printer bridges, and Cloudflare tunnels.
2. **Technical Specifications (`docs/specifications/`):** Full-stack architecture, master security model, Supabase PostgreSQL schema and RLS policies, UI design standards, and queue modeling.
3. **Database Migrations (`docs/migrations/`):** PostgreSQL DDL migration scripts and stored procedure definitions for Supabase.

---

## Master Directory Layout

```
docs/
├── README.md                              # Master documentation portal (this file)
├── USER_MANUAL.md                         # Hospital Staff End-to-End Operational Manual
├── DOCKER_OFFLINE_EXECUTION_GUIDE.md      # Docker offline execution manual & 1-command sync
├── THESIS_WEB_DEPLOYMENT_GUIDE.md         # Vercel & Railway cloud deployment guide
├── VERCEL_TABLET_USB_PRINTER_SETUP.md     # Tablet WebUSB thermal printer bridge guide
├── CLOUDFLARE_TUNNEL_SETUP_GUIDE.md       # HTTPS tunnel guide for cloud-to-local communication
├── specifications/                        # Core Technical & Architectural Blueprints
│   ├── README.md                          # Dedicated specifications directory index
│   ├── ARCHITECTURE.md                    # Platform architecture, Next.js/FastAPI stack & network resilience
│   ├── DATABASE_SCHEMA.md                 # Table structures, RLS policies & ticket movement history
│   ├── SECURITY.md                        # Master security architecture & AES-256-GCM phone encryption
│   ├── DESIGN.md                          # Master visual design & layout standards specification
│   ├── PRD.md                             # Product Requirements Document & capstone scope
│   ├── REQUIREMENTS.md                    # Software Requirements Specification (SRS)
│   ├── ESTIMATED_WAIT_TIME.md             # Hybrid EWT calculation & queueing theory formulas
│   ├── PRINTER_SETUP_GUIDE.md             # Hybrid dual-tier printer engine & WebUSB specification
│   └── SETUP_AND_SEEDING.md               # Development setup & simulated queue traffic
└── migrations/                            # Database SQL Migrations
    ├── README.md                          # Migrations directory index & execution guide
    ├── encrypt_phone_number.sql           # Schema migration converting phoneNum to encrypted text
    ├── patient_movement_history.sql       # Movement tracking table & AFTER triggers
    └── ...                                # Operational patch scripts
```

---

## 1. Operational & Deployment Guides (`docs/`)

These documents represent live operational runbooks for hospital deployment, device integration, and local resilience:

| Operational Guide | Focus Area | Key Content |
| :--- | :--- | :--- |
| [`docs/USER_MANUAL.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/USER_MANUAL.md) | Hospital Operations | Comprehensive staff user manual for Kiosk, Transfer, Nurse, Waiting Monitor, Admin Dashboard, and Superadmin portals. |
| [`docs/DOCKER_OFFLINE_EXECUTION_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/DOCKER_OFFLINE_EXECUTION_GUIDE.md) | On-Premise Deployment | Complete Docker Compose offline deployment manual for local hospital environments. |
| [`docs/CLOUDFLARE_TUNNEL_SETUP_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/CLOUDFLARE_TUNNEL_SETUP_GUIDE.md) | Network Tunneling | Cloudflare named tunnel guide connecting local hardware devices to cloud web deployments over HTTPS. |
| [`docs/VERCEL_TABLET_USB_PRINTER_SETUP.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/VERCEL_TABLET_USB_PRINTER_SETUP.md) | Hardware Bridge | Real-time WebSocket bridge allowing cloud-hosted tablet kiosks to print tickets on wired USB thermal printers. |
| [`docs/THESIS_WEB_DEPLOYMENT_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/THESIS_WEB_DEPLOYMENT_GUIDE.md) | Cloud Infrastructure | Production configuration for Next.js on Vercel and FastAPI analytics on Railway. |

---

## 2. Technical Specifications & Architecture (`docs/specifications/`)

Authoritative architectural specifications, cryptographic standards, database models, and design systems:

| Specification Document | Category | Key Content |
| :--- | :--- | :--- |
| [`docs/specifications/ARCHITECTURE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/ARCHITECTURE.md) | Full-Stack Platform | Full-stack Next.js 15 App Router architecture, FastAPI analytics pipeline, M/M/1 queue models, Dual-Mode Network Resilience, and the Decoupled Standard. |
| [`docs/specifications/DATABASE_SCHEMA.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md) | **Database Schema & Policies** | Consolidated table structures, column definitions, primary keys, ticket movement history triggers, and verified Supabase RLS policies. |
| [`docs/specifications/SECURITY.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SECURITY.md) | **Master Security Architecture** | Multi-layer access control: Supabase RLS, Server Route Guarding (`proxy.ts`), Rate Limiting & Abuse Controls, SQL Injection Immunity, and AES-256-GCM Phone Encryption. |
| [`docs/specifications/DESIGN.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DESIGN.md) | **Master Design & Layout Standards** | Visual design system, prohibition of pillbox shapes and icon backgrounds, high-contrast solid surfaces, layout archetypes, color tokens, and separation-of-concerns architecture. |
| [`docs/specifications/PRD.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/PRD.md) | Product Scope | Problem statement, collaborative integration framing, user personas, operational scope, and success criteria. |
| [`docs/specifications/REQUIREMENTS.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/REQUIREMENTS.md) | **Software Requirements (SRS)** | Complete functional and non-functional requirements (academic thesis modular format) referencing active codebase architecture across all workstations. |
| [`docs/specifications/ESTIMATED_WAIT_TIME.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/ESTIMATED_WAIT_TIME.md) | Wait Time & Queue Modeling | Hybrid EWT formula, database queries, thermal receipt ESC/POS integration, kiosk Screen 6 display, and SMS notifications. |
| [`docs/specifications/PRINTER_SETUP_GUIDE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/PRINTER_SETUP_GUIDE.md) | Hardware Printing | Hybrid dual-tier printer engine supporting direct plug-and-play WebUSB/WebSerial API detection and TCP/IP raw socket Ethernet printing. |
| [`docs/specifications/SETUP_AND_SEEDING.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SETUP_AND_SEEDING.md) | Environment Setup | Local development setup, database migrations, Python virtual environment, and simulated queue traffic generation. |

---

## 3. Database SQL Migrations (`docs/migrations/`)

These scripts manage database schema evolutions, stored procedure definitions, and cryptographic type updates:

| Migration Document | Category | Key Content |
| :--- | :--- | :--- |
| [`docs/migrations/README.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/migrations/README.md) | Migration Index | Master guide detailing execution steps, Supabase SQL Editor instructions, and status of all database scripts. |
| [`docs/migrations/encrypt_phone_number.sql`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/migrations/encrypt_phone_number.sql) | Cryptographic Migration | Alters `patients.phoneNum` to text and updates `create_patient` stored procedure signature for AES-256-GCM ciphertext tokens. |
| [`docs/migrations/patient_movement_history.sql`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/migrations/patient_movement_history.sql) | History Logging | Comprehensive ticket movement tracking table and AFTER triggers recording verified staff operators and timestamps. |

---

## 4. Second Brain Knowledge Base (`brain/`)

For AI coding agents and human architects, the repository maintains an Obsidian-compatible second brain under [`brain/INDEX.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/INDEX.md):
- **Current Sprint & State:** [`brain/CURRENT.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/CURRENT.md)
- **Architecture Blueprints & Decisions:** [`brain/decisions/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/decisions/)
