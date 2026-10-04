# Cubicles & Examination Rooms Developer Guide: Architecture & Where to Edit

This document serves as the authoritative developer guide for the Cubicles dashboard module located in `app/dashboard/pages/cubicles/` (accessible at both `/dashboard/cubicles` and `/dashboard/pages/cubicles`).

---

## 1. Architectural Purpose & Overview

The Cubicles Dashboard provides real-time operational visibility into outpatient consultation rooms and patient queue flow using a clean, minimal orthogonal process-graph design.

### Minimal Process-Graph Specifications

The dashboard canvas is built as a focused, uncluttered process network:
- **Rectangular Stage Nodes:** Thin-bordered solid cards (`1px border-slate-200 dark:border-[#2e2e2e]`) representing each discrete processing stage in the outpatient pipeline.
- **Horizontal & Vertical Orthogonal Connectors:** Strict 90-degree right-angle lines connecting stages with zero angled crossovers or diagonal segments. 1:1 pixel coordinate matching ensures connector lines connect seamlessly to card borders without gaps.
- **Directional Arrowheads:** SVG marker arrowheads (`#ortho-arrow` and `#ortho-arrow-active`) explicitly indicating directional flow into each stage entrance.
- **Clean Neutral Canvas:** High-contrast neutral background (`bg-slate-50/50 dark:bg-[#0d0d0d]/60`) with crisp borders.
- **Dynamic Services Architecture (Not Hardcoded):**
  - Clinical services are fetched directly from the Supabase `services` table configured in Superadmin (`/superadmin/customization`).
  - When administrators add a new service, rename a service, change its icon (`icon_src`), adjust display order, or remove a service, the process graph updates dynamically without code modification.
  - Any cubicle categories present in the database that are not yet in `services` are automatically synthesized and rendered as their own service rectangle block so that no facility unit is hidden or mixed.
  - Standard service blocks include Consultation, OPD Screening, Warfarin Clinic, OPD Card, ECG Station, Refill Prescription, Benzathine Clinic, OPD Reschedule, or any custom services defined in Superadmin.
- **Live Moving Dots (Strict Real-Time Process State):**
  - Moving dots appear **strictly** when an actual clinical process is happening in real time (e.g., when a patient is called to dispatch, a physician initiates a consultation, or post-exam carryout begins).
  - If the operational queue is idle or stationary, **zero moving dots appear**, keeping the canvas clean, calm, and completely truthful to the live facility state.
  - Supabase WebSocket real-time subscription on the `patients` table ensures that physical patient state transitions trigger immediate visual transit animations across the stages.
- **Whole-Day Queue Simulation Replay Mode ("Simulate Day Flow"):**
  - A dedicated "Simulate Day Flow" button allows supervisors to replay the entire day's patient traffic chronologically across the flowchart stages.
  - Replays patient transitions from Kiosk into Registration, through the branching bus into their assigned clinical service block (Nurse), and out through Carryout into Finished.
  - A "Stop Simulation" button is available at all times to return immediately to standard live real-time monitoring.
- **Clean Service Block Headers (No Descriptions):**
  - Descriptions/subtitles per service are omitted to keep the presentation clean and minimal; each block displays only its service title, icon, capacity badge, room filter pills, and cubicle cards.
- **High-Capacity Solutions for Many Open Rooms and Cubicles:**
  - **Header Room Filter Pills:** For multi-room services (such as Consultation with rooms R1 through R4+), the block header features direct room filter pills (`All | R1 | R2 | R3 | R4`), allowing healthcare staff to immediately focus on a single room.
  - **Universal Search Filter:** A quick search bar at the top of the canvas enables filtering and highlighting by cubicle identifier (`R2-C1`), room (`R1`), attending physician (`Santos`), or patient ticket number (`P-104`).
  - **Block Collapse / Expand Accordion Support:** Each service block can be individually collapsed to a sleek 44px summary bar. Master `Expand All` and `Collapse Inactive` buttons allow supervisors to compact empty services and spotlight active consultation bays.
  - **Compact High-Density Grid with Internal Scrolling:** Cubicles are arranged in a 2-to-3 column responsive grid with smooth internal scroll (`max-h-[110px] phc-scroll`), allowing high cubicle volume without breaking the diagram layout.
  - **Dynamic SVG Bus Spine & Canvas Height:** Canvas height dynamically computes from the vertical height of active blocks, and orthogonal branch/merge bus spines expand symmetrically to ensure 100% pixel-perfect connector alignment.
- **Rule 11 Compliance (Prohibition of Text Ellipsis & Truncation):**
  - Text labels, doctor names, room designations, and ticket numbers are rendered in full without truncation or ellipsis (`...`, `…`, `truncate`, `text-ellipsis`).
  - Text wraps naturally using `break-words` and `leading-tight` to preserve clinical legibility.
- **On-Demand Stage Detail Inspector:** The page is primarily dedicated to the process map canvas with no bottom clutter; clicking any stage node or cubicle bay opens `ProcessStageModal` displaying telemetry, attending physicians, and active queues.

---

### Process-Graph Pipeline Map Diagram

```text
                                                 ┌──► ┌──────────────────────────────────────────────┐ ──┐
                                                 │    │   NURSE SERVICE: [Dynamic Service 1]       │   │
                                                 │    │   [ R1-C1 ] [ R1-C2 ] [ R2-C1 ] [ R2-C2 ]    │   │
                                                 │    └──────────────────────────────────────────────┘   │
                                                 ├──► ┌──────────────────────────────────────────────┐ ──┤
                                                 │    │   NURSE SERVICE: [Dynamic Service 2]       │   │
                                                 │    │   [ Station 1 ] [ Station 2 ]                │   │
                                                 │    └──────────────────────────────────────────────┘   │
                                                 ├──► ┌──────────────────────────────────────────────┐ ──┤
                                                 │    │   NURSE SERVICE: [Dynamic Service 3]       │   │
                                                 │    │   [ Station 1 ]                              │   │
                                                 │    └──────────────────────────────────────────────┘   │
                                                 ├──► ┌──────────────────────────────────────────────┐ ──┤
                                                 │    │   NURSE SERVICE: [Dynamic Service 4]       │   │
                                                 │    │   [ Station 1 ]                              │   │
                                                 │    └──────────────────────────────────────────────┘   │
[ KIOSK ] ────────► [ REGISTRATION ] ─────────────┼──► ┌──────────────────────────────────────────────┐ ──┼──► [ CARRYOUT ] ────────► [ FINISHED ]
                                                 │    │   NURSE SERVICE: [Dynamic Service 5]       │   │
                                                 │    │   [ Station 1 ]                              │   │
                                                 │    └──────────────────────────────────────────────┘   │
                                                 ├──► ┌──────────────────────────────────────────────┐ ──┤
                                                 │    │   NURSE SERVICE: [Dynamic Service 6]       │   │
                                                 │    │   [ Station 1 ]                              │   │
                                                 │    └──────────────────────────────────────────────┘   │
                                                 ├──► ┌──────────────────────────────────────────────┐ ──┤
                                                 │    │   NURSE SERVICE: [Dynamic Service 7]       │   │
                                                 │    │   [ Station 1 ]                              │   │
                                                 │    └──────────────────────────────────────────────┘   │
                                                 └──► ┌──────────────────────────────────────────────┐ ──┘
                                                      │   NURSE SERVICE: [Dynamic Service N...]    │
                                                      │   [ Station 1 ]                              │
                                                      └──────────────────────────────────────────────┘
```

---

## 2. Directory Layout & Modular Structure

```
app/dashboard/pages/cubicles/
├── README.md                           # Authoritative developer guide
├── page.tsx                            # Root orchestrating page component
├── components/                         # Modular presentation subcomponents
│   ├── CubicleProcessGraph.tsx         # Clean minimal orthogonal process-graph map canvas
│   ├── ProcessStageModal.tsx           # On-demand stage detail inspector dialog
│   ├── CubiclesHeader.tsx              # Top header banner with live Manila clock
│   ├── CubiclesStatsGrid.tsx           # Metric summary tiles (Total, Available, Occupied, Unavailable)
│   ├── CubicleCard.tsx                 # Status tile for an individual room
│   ├── FlowchartInspectionModal.tsx    # Deep patient journey inspection dialog
│   ├── FlowchartIdleTelemetry.tsx      # Turnaround downtime panel (modular component)
│   ├── FlowchartSummaryBar.tsx         # KPI telemetry strip (modular component)
│   └── PipelineStageNode.tsx           # Legacy stage node component
├── constants/                          # Decoupled styling tokens and copy dictionaries
│   ├── cubicles.ts                     # CSS class tokens, process-graph styles, and theme scales
│   └── cubiclesTexts.ts                # User-facing text strings, labels, and modal copy
├── hooks/                              # Custom React data synchronization hooks
│   ├── useCubicleFlowchartData.ts      # Live pipeline stages aggregation, dynamic services fetch, station telemetry, and WebSocket sync
│   ├── useCubicleHeatmapData.ts        # Hourly heatmap calculations and date queries
│   └── useCubiclesData.ts              # Live 30-second polling for active cubicles and consultations
└── types/                              # TypeScript contracts
    └── cubicle.ts                      # Interfaces for cubicles, flowchart stages, stations, and KPIs
```

---

## 3. Mandatory "Where to Edit" Lookup Table

Consult this lookup table to identify the exact file to modify for any visual, textual, algorithmic, or structural change:

| Goal / Intended Change | Target File | Path |
| :--- | :--- | :--- |
| **Configure or add clinical services dynamically** | Superadmin Customization / DB `services` | [app/superadmin/customization/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/page.tsx) or Supabase `services` table |
| **Edit text copy, labels, placeholders, or modal strings** | `cubiclesTexts.ts` | [cubiclesTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/constants/cubiclesTexts.ts) (`CUBICLES_TEXTS.flowchart.processGraph`) |
| **Edit process-graph styling tokens, node cards, or borders** | `cubicles.ts` | [cubicles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/constants/cubicles.ts) (`CUBICLES_STYLES.processGraph`) |
| **Edit stage colors, icons, or badges** | `cubicles.ts` | [cubicles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/constants/cubicles.ts) (`PIPELINE_STAGE_STYLES`) |
| **Edit orthogonal path coordinates, live dots, or day simulation** | `CubicleProcessGraph.tsx` | [CubicleProcessGraph.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/components/CubicleProcessGraph.tsx) |
| **Edit stage detail inspector modal dialog** | `ProcessStageModal.tsx` | [ProcessStageModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/components/ProcessStageModal.tsx) |
| **Edit deep patient journey telemetry modal** | `FlowchartInspectionModal.tsx` | [FlowchartInspectionModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/components/FlowchartInspectionModal.tsx) |
| **Edit pipeline calculation logic & services queries** | `useCubicleFlowchartData.ts` | [useCubicleFlowchartData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/hooks/useCubicleFlowchartData.ts) |
| **Edit live cubicle polling or room data** | `useCubiclesData.ts` | [useCubiclesData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/hooks/useCubiclesData.ts) |
| **Edit TypeScript models, contracts, or interfaces** | `cubicle.ts` | [cubicle.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/types/cubicle.ts) |
| **Edit top header banner or Manila live clock** | `CubiclesHeader.tsx` | [CubiclesHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/components/CubiclesHeader.tsx) |
| **Edit top summary statistics tiles** | `CubiclesStatsGrid.tsx` | [CubiclesStatsGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/components/CubiclesStatsGrid.tsx) |
| **Edit overall page layout and composition** | `page.tsx` | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/page.tsx) |

---

## 4. Operational Pipeline Standards

- **Dynamic Services Synchronization:** Services are dynamically fetched from the `services` table configured in Superadmin; they are not hardcoded.
- **Orthogonal Connectors:** All vectors between stages follow strict 90-degree right angles without diagonal or organic curve segments.
- **Strict Live Moving Dots:** Dots appear strictly when active queue processes occur in real time; if the clinic queue is idle, no dots move.
- **Whole-Day Traffic Replay:** Supervisors can replay all of today's patient queue journeys sequentially using the "Simulate Day Flow" control.
- **Stage Processing State:** When a patient is stopped at any node, the node applies `nodeCardProcessing` (`border-rose-500 ring-2 ring-rose-500/30`) with live ticket label and ping indicator.
- **High-Capacity Handling:** Room filter pills, universal search, collapsible blocks, and high-density compact grids ensure large numbers of open rooms and cubicles can be managed without layout disruption.
- **No Text Ellipsis (Rule 11):** All labels, doctor names, cubicle designations, and status badges render full text without ellipsis or truncation (`...`, `…`, `truncate`).
- **Stage Inspector:** Details are hidden by default to keep the map clean; clicking any stage opens `ProcessStageModal`.
- **Zero Emojis:** All documentation, UI strings, and code comments adhere strictly to plain-text formatting without emojis.
