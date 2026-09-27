# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System
# Nurse Dashboard System Design & Refactoring Specification

## 1. Executive Summary & Clinical Rationale

The **Nurse Dashboard** (`app/nurse/`) is the point-of-care clinical management interface utilized by triage nurses, staff nurses, and outpatient care coordinators at the Philippine Heart Center (PHC). 

In PHC outpatient operations, after a patient is checked in via the self-service kiosk and transferred/assigned to a consultation or screening cubicle via the Patient Transfer Dashboard (`app/transfer/`), clinical governance shifts directly to the attending nurse station.

### Clinical Progression Lifecycle

The clinical workflow within each consultation cubicle follows a four-stage linear progression:

```
[Transfer Assignment]
        │
        ▼
┌─────────────────────────┐
│ Stage 1: Assigned Queue │ ◄── Patient waiting in hallway/lobby; nurse triggers TTS audio call.
└───────────┬─────────────┘
            │ Nurse initiates consultation
            ▼
┌─────────────────────────┐
│ Stage 2: With Doctor    │ ◄── Active medical evaluation inside cubicle; consult timer running.
└───────────┬─────────────┘
            │ Physician concludes exam, delegates post-consult orders
            ▼
┌─────────────────────────┐
│ Stage 3: Carryout       │ ◄── Prescriptions, lab orders, follow-up scheduling, medication counseling.
└───────────┬─────────────┘
            │ Nurse completes all care orders
            ▼
┌─────────────────────────┐
│ Stage 4: Finished Today │ ◄── Timestamps sealed, archived in daily completion ledger.
└─────────────────────────┘
```

### Why Refactor the Nurse Dashboard?

The Patient Transfer Dashboard (`app/transfer/`) recently underwent an architectural overhaul, establishing a standard for clinical interfaces in the repository:
- Non-scrollable, fit-to-screen viewport architecture (`h-screen overflow-hidden`).
- Strict separation of concerns (copy isolated in `transferTexts.ts`, styling objects in `transfer.ts`).
- Dual-mode interaction engine (Pointer Events drag-and-drop combined with Click-to-Select tablet mode).
- Defensive data handling and role-based access control with Superadmin bypass.
- Comprehensive JSDoc documentation without emojis.

In contrast, the current Nurse Dashboard (`app/nurse/`) suffers from critical architectural, usability, and styling regressions:
- Monolithic vertical scrolling (`overflow-y-auto`): All sections (`AssignedSection`, `WithDoctorSection`, `CarryoutSection`, `FinishedTable`) are stacked vertically in a single page column, forcing clinical staff to scroll up and down on tablets and desktop monitors.
- 100% hardcoded strings and styles: Violates `AGENTS.md` Rule 2. There is no `nurseTexts.ts` or `nurse.ts`.
- Single interaction paradigm: Patient state transitions rely solely on button clicks with no pointer drag-and-drop or tap-to-stage selection affordances.
- Table column misalignment: `FinishedTable.tsx` declares 4 header columns (`<th>`) but renders 5 data cells (`<td>`), misaligning consult end and carryout end timestamps.
- Role-based access control defect: `useNurseData.ts` queries `user_cubicles` without Superadmin/Admin bypass, locking supervisors out of the nurse view.
- Missing waiting duration timer in Assigned Queue: Nurses cannot see how long patients have been waiting in the hallway.
- Crude user alerts: Errors trigger synchronous `window.alert()` dialogs.

This document serves as the architectural blueprint and operational guideline to refactor and redesign `app/nurse/` to achieve complete parity with the standards established by `app/transfer/`.

---

## 2. Gap Analysis: Transfer Dashboard Standard vs. Current Nurse Dashboard

| Architectural Dimension | Transfer Dashboard Standard (`app/transfer/`) | Current Nurse Dashboard (`app/nurse/`) | Target Nurse Dashboard Specification |
| :--- | :--- | :--- | :--- |
| **Viewport & Scrolling** | Non-scrollable fit-to-screen (`h-screen overflow-hidden`). Only internal queue list scrolls via `.phc-scroll`. | Full-height page vertical scroll (`overflow-y-auto`). Monolithic 4-section vertical stack. | Non-scrollable Kanban/Board view (`h-screen overflow-hidden`). Three side-by-side clinical stage columns with internal card scrolling only. Finished roster in a drawer/modal. |
| **Separation of Concerns** | All copy in `transferTexts.ts`. All styles in `transfer.ts`. Global tokens in `/constants/`. | 100% hardcoded UI text and inline Tailwind utilities. Minimal 15-line `constants.ts` in `lib/`. | Dedicated `app/nurse/constants/nurseTexts.ts` and `app/nurse/constants/nurse.ts`. Domain types in `app/nurse/types/nurse.ts`. |
| **Interaction Modes** | Dual-mode: Pointer Events Drag-and-Drop (`useDragAndDrop`) + Click-to-Select Tablet Mode (`useTransferSelection`). | Single mode: Direct button clicks only ("With Doctor", "Carryout", "Done", "Back"). | Dual-mode: Pointer Events Drag-and-Drop between stage columns + Click-to-Select Tablet Mode with floating `NurseSelectionBanner`. Direct buttons preserved on cards. |
| **Visual Feedback & Affordances** | Target stations highlight with glowing borders (`assignTargetCard`), floating ghost card via React Portal. | Minimal button hover states. No stage highlight or visual drag affordance. | Stage columns illuminate as valid drop targets (`border-emerald-400 bg-emerald-50/50`). Floating portal drag ghost. Pulse badges. |
| **Timers & Urgency** | Real-time `ElapsedTimer` with configurable warning threshold (`warnAfterSeconds = 120`). | `ElapsedTimer` used only in `WithDoctorSection` (10m threshold). Zero timers for waiting or carryout. | Configurable timers in all three active stages: Waiting duration (`warnAfter = 15m`), Consultation duration (`warnAfter = 10m`), Carryout duration (`warnAfter = 10m`). |
| **Table Formatting** | Structured, defense-checked data grids with empty states. | Bug: 4 header columns vs 5 body cells in `FinishedTable.tsx` (offsets timestamps). | Corrected 5-column table (`Queue No.`, `Service`, `Cubicle`, `Consult End`, `Carryout End`) with defensive date parsing and duration calculation. |
| **Access Control (RBAC)** | Role check with Superadmin/Admin bypass: grants full visibility to all rooms and counters. | Strict `user_cubicles` join without Superadmin bypass. Admins/Superadmins get "No cubicles assigned" error. | Superadmin/Admin bypass incorporated into `useNurseData.ts`, enabling supervisor access to any nurse station or cubicle. |
| **Audio Announcements** | Deepgram TTS API with retry loops and animated audio state. | Deepgram TTS API present, but lacks cubicle-specific announcement formatting. | Standardized TTS phrasing: `"Number [Letter] [Digits], please proceed to cubicle [CubicleNum]"`. State-locked speaker icon. |
| **Documentation & Code Standards** | Comprehensive file-level and symbol-level JSDoc. Zero emojis. | No JSDoc annotations. Fragmented imports. | 100% JSDoc coverage across all components, hooks, types, and constants. Zero emojis in code, copy, and documentation. |

---

## 3. Core Architectural Principles

Refactoring the Nurse Dashboard requires strictly enforcing the following architectural principles derived from `AGENTS.md` and `TRANSFER_DASHBOARD.md`:

### Principle A: Non-Scrollable Fit-to-Screen Pipeline Layout
Clinical workstations and tablets in outpatient rooms must display all critical stages simultaneously without page-level scrolling:
- The outer shell is locked at `h-screen overflow-hidden`.
- The top header (`NurseHeader`) remains permanently fixed (`shrink-0 z-20`).
- The primary workspace is structured as a **3-Column Clinical Pipeline (Kanban)**:
  1. **Column 1: Assigned Queue** (Waiting / Calling)
  2. **Column 2: With Doctor** (Active Medical Examination)
  3. **Column 3: Carryout** (Post-Consultation & Care Coordination)
- Each column maintains an independent internal scroll container (`flex-1 overflow-y-auto min-h-0 .phc-scroll`). The overall page does not scroll.
- The **Finished Today** archive is accessible via a docked bottom summary bar, tab switch, or side drawer, preventing historical records from occupying primary operational screen real estate.

### Principle B: Dual-Mode Patient Progression Engine
Nurses alternate between mouse workstations and bedside/hallway tablets:
1. **Pointer Events Drag-and-Drop:**
   - Unified Pointer Events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) ensure seamless input across mice, touchscreens, and styluses.
   - Dedicated drag grip handle (`data-drag-handle="true"`).
   - Card dragging renders an unclipped preview card (`NurseDragGhost`) via React Portal attached to `document.body`.
   - Stage columns define drop targets (`data-stage-id="assigned"`, `data-stage-id="with_doctor"`, `data-stage-id="carryout"`, `data-stage-id="done"`).
2. **Click-to-Select / Tap-to-Advance (Tablet Mode):**
   - Tapping a patient card enters Selection Mode.
   - Eligible target stage columns pulse with emerald borders (`assignTargetCard`) and display "+ Move Here" buttons.
   - A floating context banner (`NurseSelectionBanner`) displays patient queue number, origin stage, instructions, and a 1-tap Cancel button (dismissible via `Escape`).
3. **Card Quick Actions:**
   - Prominent 1-tap primary action buttons on the card ("Call", "Start Consult", "To Carryout", "Finish") remain available for direct advancement.

### Principle C: Clinical Urgency & Elapsed Timers
Outpatient bottlenecks occur when patients wait too long in the hall or remain stuck in consultation:
- Every active stage card must feature an `ElapsedTimer`.
- **Assigned Queue:** Calculates elapsed time from assignment (`created_at` or `reg_end`). Warning threshold: 15 minutes.
- **With Doctor:** Calculates elapsed time from consultation start (`consult_start`). Warning threshold: 10 minutes.
- **Carryout:** Calculates elapsed time from carryout start (`carryout_start`). Warning threshold: 10 minutes.
- Visual styling transitions from neutral gray/green to pulsing amber/red when thresholds are exceeded.

### Principle D: Strict Separation of Concerns (`AGENTS.md`)
- **Copy:** All labels, descriptions, tooltips, dialogs, empty states, and audio scripts are isolated in `app/nurse/constants/nurseTexts.ts`.
- **Styling & Tokens:** All layout dimensions, CSSProperties dictionaries, theme colors, and stage borders are isolated in `app/nurse/constants/nurse.ts`.
- **Domain Models:** All nurse-specific interfaces and state types are isolated in `app/nurse/types/nurse.ts`.

---

## 4. Component Structure & Target Directory Layout

The refactored `app/nurse/` module must follow the established structure below:

```text
app/nurse/
├── page.tsx                           # Main orchestrator, route guard & state coordinator
├── components/
│   ├── AssignedSection.tsx            # Column 1: Assigned Queue (re-engineered with drag handle & timer)
│   ├── CarryoutSection.tsx            # Column 3: Post-consultation carryout stage
│   ├── ElapsedTimer.tsx               # Reusable MM:SS timer with configurable warning threshold
│   ├── FinishedDrawer.tsx             # Collapsible drawer / modal for completed patients
│   ├── FinishedTable.tsx              # Corrected 5-column table with search and time summaries
│   ├── NurseBoard.tsx                 # 3-Column non-scrollable fit-to-screen pipeline container
│   ├── NurseDragGhost.tsx             # React Portal preview card following pointer during drag
│   ├── NurseDragHandle.tsx            # Accessible touch grip handle for card dragging
│   ├── NurseHeader.tsx                # Fixed sticky top bar (cubicle indicator, doctor on duty, sync status)
│   ├── NursePatientCard.tsx           # Reusable clinical patient tile used across all stages
│   ├── NurseSelectionBanner.tsx       # Floating context banner during Click-to-Select tablet mode
│   ├── NurseSidebar.tsx               # Collapsible navigation rail for room & cubicle filtering
│   ├── StageColumn.tsx                # Reusable pipeline column container with dropzone detection
│   └── WithDoctorSection.tsx          # Column 2: Active doctor consultation stage
├── constants/
│   ├── nurse.ts                       # CSSProperties, layout tokens, theme colors & stage styles
│   └── nurseTexts.ts                  # ALL text copy, labels, tooltips, empty states & TTS phrases
├── hooks/
│   ├── dragUtils.ts                   # Pointer coordinate and drop target hit-testing utilities
│   ├── useIdleTimeout.ts              # Inactivity monitor to preserve clinical session integrity
│   ├── useNurseActions.ts             # State mutations with optimistic updates & Supabase persistence
│   ├── useNurseData.ts                # Real-time data fetching, Superadmin bypass & cubicle scoping
│   ├── useNurseDragAndDrop.ts         # Unified pointer events drag-and-drop between clinical stages
│   ├── useNurseSelection.ts           # Click-to-Select tablet interaction manager
│   ├── useRealtimeSubscription.ts     # Debounced Supabase Realtime channel subscription
│   └── useRequireAuth.ts              # Authentication and clinical role verification guard
├── types/
│   └── nurse.ts                       # Domain types: ClinicalStage, SelectedNursePatient, NurseFilterState
└── lib/
    └── constants.ts                   # Legacy constants re-export for backwards compatibility
```

---

## 5. Domain Models & Type Specifications (`types/nurse.ts`)

```typescript
/**
 * @fileoverview Domain types and interface definitions for the Nurse Dashboard.
 *
 * Defines clinical stage states, tablet selection interfaces, cubicle assignments,
 * and view configurations in accordance with AGENTS.md.
 */

import { Patient, Cubicle } from '@/types/Types';

/**
 * Valid clinical progression stages within the nurse dashboard workflow.
 */
export type ClinicalStage = 'assigned' | 'with_doctor' | 'carryout' | 'done';

/**
 * Active patient selection model for Click-to-Select tablet interaction mode.
 */
export interface SelectedNursePatient {
  /** The patient entity being transitioned. */
  patient: Patient;
  /** Current clinical stage of the patient before transition. */
  currentStage: ClinicalStage;
  /** Cubicle number where the patient is currently stationed. */
  cubicleNum: string;
}

/**
 * Representation of a cubicle assigned to the active clinical user.
 */
export interface AssignedNurseCubicle {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
}

/**
 * Filter and view configuration state for the nurse workstation.
 */
export interface NurseFilterState {
  selectedCategory: string | null;
  selectedCubicleNum: string | null;
  selectedRoom: number | null;
}

/**
 * Clinical stage configuration metadata used for column rendering and dropzones.
 */
export interface StageConfig {
  id: ClinicalStage;
  titleKey: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  emptyStateTextKey: string;
  nextStageId?: ClinicalStage;
  previousStageId?: ClinicalStage;
}
```

---

## 6. Centralized Text Dictionary Specification (`constants/nurseTexts.ts`)

All user-facing copy must be extracted into `app/nurse/constants/nurseTexts.ts`. No raw strings are permitted in JSX.

```typescript
/**
 * @fileoverview Centralized text copy dictionary for the Nurse Dashboard.
 *
 * Enforces AGENTS.md Rule 2 (Strict Separation of Concerns).
 * All UI labels, button copy, tooltips, dialogs, empty states, and TTS phrases are defined here.
 */

export const nurseTexts = {
  // Navigation & Header
  dashboardTitle: "Nurse Station",
  patientManagement: "Patient Care Management",
  syncingBadge: "Syncing...",
  liveStatus: "Live",
  logoutLabel: "Logout",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  allMyCubicles: "All My Cubicles",
  myCoverage: "My Coverage",
  roomPrefix: "Room",
  cubiclePrefix: "Cubicle",
  doctorOnDuty: "Attending Physician:",
  noDoctorAssigned: "No Doctor Assigned",

  // Clinical Stage Headings
  stageAssignedHeading: "In Queue / Assigned",
  stageWithDoctorHeading: "With Doctor",
  stageCarryoutHeading: "Carryout & Post-Care",
  stageFinishedHeading: "Finished Today",

  // Stage Empty States
  emptyAssigned: "No patients waiting in queue",
  emptyWithDoctor: "No patients currently with doctor",
  emptyCarryout: "No patients for carryout",
  emptyFinished: "No finished patients recorded today",

  // Action Buttons
  btnCall: "Call",
  btnCalling: "Calling...",
  btnWithDoctor: "With Doctor",
  btnCarryout: "Carryout",
  btnDone: "Done",
  btnBack: "Back",
  btnViewFinished: "View Finished Ledger",
  btnCloseFinished: "Close Ledger",
  btnCancelSelection: "Cancel Selection",
  btnMoveHere: "Move Here",

  // Tooltips & Hints
  dragCardHint: "Drag card to next clinical stage",
  tapToSelectHint: "Tap to select patient",
  selectedHintAssigned: "Tap 'With Doctor' column or button to begin consultation",
  selectedHintWithDoctor: "Tap 'Carryout' column to transfer to post-care",
  selectedHintCarryout: "Tap 'Done' column to finish patient session",

  // Click-to-Select Tablet Mode
  selectedPatientPrefix: "Selected:",
  tapStageToMove: "Tap a target stage to advance patient",

  // Finished Table Columns
  tableQueueNo: "Queue No.",
  tableService: "Service",
  tableCubicle: "Cubicle",
  tableConsultEnd: "Consult Finished",
  tableCarryoutEnd: "Carryout Finished",
  tableTotalTime: "Total Duration",

  // Unassigned Account State
  unassignedTitle: "No cubicles assigned",
  unassignedDesc: "Your account does not have any cubicles assigned yet. Ask a Super Admin to assign your room before managing patients.",

  // TTS Announcements
  ttsCallPhrase: (letter: string, digits: string, cubicleNum: string) =>
    `Number ${letter} ${digits}, Number ${letter} ${digits}, please proceed to ${cubicleNum}`,

  // Toast & Error Messages
  errorUpdateFailed: "Unable to update patient status. Please check your network connection.",
  errorUnauthorizedCubicle: "You are not authorized to update patients in this cubicle.",
} as const;

export default nurseTexts;
```

---

## 7. Style & Layout Property Dictionaries (`constants/nurse.ts`)

Inline styles and design tokens must be structured in `app/nurse/constants/nurse.ts`.

```typescript
/**
 * @fileoverview Architectural constants, theme tokens, and inline style dictionaries
 * for the Nurse Dashboard (`app/nurse/`).
 *
 * Adheres strictly to AGENTS.md separation-of-concerns guidelines.
 */

import { CSSProperties } from 'react';

export const nurseLayoutTokens = {
  sidebarWidthExpanded: '280px',
  sidebarWidthCollapsed: '64px',
  headerHeight: '64px',
  touchTargetMin: '44px',
  columnMinWidth: '320px',
} as const;

export const nurseColorTokens = {
  brandRed: '#cc3535',
  brandRedLight: '#fee2e2',
  assignedBlue: '#2563eb',
  assignedBlueBg: '#eff6ff',
  assignedBlueBorder: '#bfdbfe',
  doctorPurple: '#7c3aed',
  doctorPurpleBg: '#f5f3ff',
  doctorPurpleBorder: '#ddd6fe',
  carryoutOrange: '#ea580c',
  carryoutOrangeBg: '#fff7ed',
  carryoutOrangeBorder: '#fed7aa',
  doneGreen: '#16a34a',
  doneGreenBg: '#f0fdf4',
  doneGreenBorder: '#bbf7d0',
  warningAmber: '#d97706',
  borderSubtle: '#e2e8f0',
  cardBg: '#ffffff',
} as const;

export const NurseStyle = {
  viewportContainer: {
    height: '100vh',
    display: 'flex',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    position: 'relative',
  } as CSSProperties,

  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100%',
    overflow: 'hidden',
  } as CSSProperties,

  headerBar: {
    height: nurseLayoutTokens.headerHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    flexShrink: 0,
    zIndex: 20,
  } as CSSProperties,

  boardContainer: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '1rem',
    padding: '1rem 1.5rem',
    minHeight: 0,
    overflow: 'hidden',
  } as CSSProperties,

  stageColumn: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  } as CSSProperties,

  stageColumnHeader: {
    padding: '0.875rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  } as CSSProperties,

  stageColumnContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 0,
  } as CSSProperties,

  activeDropzone: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(236, 253, 245, 0.6)',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
  } as CSSProperties,

  selectedPatientRow: {
    borderColor: '#cc3535',
    backgroundColor: '#fff1f2',
    boxShadow: '0 0 0 2px rgba(204, 53, 53, 0.25)',
  } as CSSProperties,

  selectionBanner: {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  } as CSSProperties,
} as const;
```

---

## 8. State Machine & Database Mutations

```mermaid
stateDiagram-v2
    [*] --> Assigned: Transferred from Kiosk/Transfer Dashboard
    
    Assigned --> WithDoctor: Nurse clicks "With Doctor" or drags card\nconsult_start = now()
    
    WithDoctor --> Carryout: Doctor completes exam; nurse clicks "Carryout"\nconsult_end = now()\ncarryout_start = now()
    
    Carryout --> Done: Nurse completes orders; clicks "Done"\ncarryout_end = now()\nstatus = 'Done'
    
    WithDoctor --> Assigned: Rollback (Back button)\nconsult_start = null
    
    Carryout --> WithDoctor: Rollback (Back button)\nconsult_end = null\ncarryout_start = null\ncarryout_end = null
```

### Database Columns Mutated in `patients` Table

1. **`Assigned` -> `With Doctor`:**
   ```typescript
   {
     status: 'With Doctor',
     consult_start: new Date().toISOString(),
   }
   ```
2. **`With Doctor` -> `Assigned` (Rollback):**
   ```typescript
   {
     status: 'Assigned',
     consult_start: null,
   }
   ```
3. **`With Doctor` -> `Carryout`:**
   ```typescript
   {
     status: 'Carryout',
     consult_end: new Date().toISOString(),
     carryout_start: new Date().toISOString(),
     carryout_end: null,
   }
   ```
4. **`Carryout` -> `With Doctor` (Rollback):**
   ```typescript
   {
     status: 'With Doctor',
     consult_end: null,
     carryout_start: null,
     carryout_end: null,
   }
   ```
5. **`Carryout` -> `Done`:**
   ```typescript
   {
     status: 'Done',
     carryout_end: new Date().toISOString(),
   }
   ```

All state updates must execute **optimistically** in local React state first, immediately re-rendering the UI, followed by asynchronous persistence via Supabase. If the Supabase mutation fails, the transaction rolls back gracefully and notifies the user without crude browser alert dialogs.

---

## 9. Interaction Engine Specification

### A. Pointer Events Drag-and-Drop
Modeled directly from `app/transfer/hooks/useDragAndDrop.ts`:
1. **Handle Interaction:** Drag is initiated exclusively through the dedicated touch handle (`<NurseDragHandle />`) to prevent conflicts with page gestures and scrolling.
2. **Pointer Capture:** `setPointerCapture(e.pointerId)` locks coordinates to the moving element.
3. **Ghost Portal:** Renders `<NurseDragGhost />` attached to `document.body` via `createPortal`, following `{ x: e.clientX, y: e.clientY }` with a transform style.
4. **Hit-Testing:** `document.elementsFromPoint(point.x, point.y)` queries elements with `data-stage-id`.
5. **Drop Validation:** 
   - Moving from `assigned` to `with_doctor`: Valid.
   - Moving from `with_doctor` to `carryout`: Valid.
   - Moving from `carryout` to `done`: Valid.
   - Reverse transitions (e.g. `with_doctor` to `assigned`): Valid as rollback actions.
   - Dropping within the same stage: Safe no-op.

### B. Click-to-Select Tablet Mode
Modeled directly from `app/transfer/hooks/useTransferSelection.ts`:
1. Tap a patient card -> sets `selectedPatient = { patient, currentStage, cubicleNum }`.
2. Target stage columns illuminate with green active target styling (`assignTargetCard`).
3. Floating `<NurseSelectionBanner />` appears at the bottom of the screen with patient info and a Cancel button.
4. Tapping the target column header or the card target button completes the stage transition.
5. Tapping `Escape` on a keyboard or tapping the same patient card again deselects the patient.

---

## 10. Data Fetching, Access Control & Realtime Engine

### Superadmin Bypass Implementation in `useNurseData.ts`

The current implementation locks Superadmins and Admins out of `/nurse` because their user IDs are not populated in `user_cubicles`. The refactored hook must replicate the Superadmin bypass pattern from `app/transfer/hooks/useMyAccess.ts`:

```typescript
// Pattern in useNurseData.ts
const { data: userProfile } = await supabase
  .from('users')
  .select('id, role')
  .eq('auth_id', session.user.id)
  .single();

let cubiclesToFetch: AssignedNurseCubicle[] = [];

if (userProfile?.role === 'superadmin' || userProfile?.role === 'admin') {
  // Superadmin bypass: fetch all cubicles in the hospital
  const { data: allCubicles } = await supabase
    .from('cubicle')
    .select('id, cubicleNum, category, room, subcategory, doctorId');
  cubiclesToFetch = (allCubicles || []) as AssignedNurseCubicle[];
} else {
  // Standard clinical nurse: fetch explicitly assigned cubicles
  const { data: links } = await supabase
    .from('user_cubicles')
    .select('cubicle_id')
    .eq('user_id', userProfile.id);

  const cubicleIds = (links ?? []).map(link => link.cubicle_id);
  if (cubicleIds.length > 0) {
    const { data: cubicles } = await supabase
      .from('cubicle')
      .select('id, cubicleNum, category, room, subcategory, doctorId')
      .in('id', cubicleIds);
    cubiclesToFetch = (cubicles || []) as AssignedNurseCubicle[];
  }
}
```

### Realtime Subscription Scoping & Debounce

Rather than listening indiscriminately to all hospital patient changes:
1. `useRealtimeSubscription` must subscribe to table `patients`.
2. Event updates must trigger a debounced fetch (e.g. 300ms) to coalesce rapid batch transitions from registration and kiosk events.

---

## 11. Refactoring & Implementation Roadmap

The refactoring will be executed across four distinct, safe phases:

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Constants, Types & Infrastructure Setup       │
│ - Create app/nurse/constants/nurseTexts.ts             │
│ - Create app/nurse/constants/nurse.ts                  │
│ - Create app/nurse/types/nurse.ts                      │
│ - Update app/nurse/lib/constants.ts to re-export       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Hook Modernization & Access Control           │
│ - Refactor useNurseData.ts (Superadmin bypass)         │
│ - Refactor useNurseActions.ts (remove alert, add undo) │
│ - Create useNurseSelection.ts (Click-to-Select)        │
│ - Create useNurseDragAndDrop.ts (Pointer DnD)          │
│ - Enforce direct imports (no barrel index files)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: Component Decomposition & Non-Scroll Board    │
│ - Build NursePatientCard.tsx (timer, call, drag)       │
│ - Build StageColumn.tsx (dropzone, scroll container)   │
│ - Build NurseBoard.tsx (3-column fit-to-screen)        │
│ - Build NurseSelectionBanner.tsx                       │
│ - Build FinishedDrawer.tsx & fix FinishedTable.tsx     │
│ - Build NurseHeader.tsx                                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 4: Page Orchestration & Polish                   │
│ - Refactor app/nurse/page.tsx orchestrator             │
│ - Deepgram TTS voice announcement refinement           │
│ - Comprehensive JSDoc documentation verification       │
│ - Zero-scroll validation on tablet & desktop           │
└────────────────────────────────────────────────────────┘
```

---

## 12. Manual Verification Checklist

Before considering the Nurse Dashboard refactoring complete, verify against this checklist:

- [ ] **Zero Page Scrolling:** The main dashboard (`app/nurse/page.tsx`) does not produce any window or outer container scrollbars on 1920x1080 desktop or 1024x768 tablet viewports.
- [ ] **Stage Column Internal Scrolling:** Only the card lists inside `StageColumn.tsx` scroll vertically when patient volume exceeds the column height.
- [ ] **Dual-Mode Stage Progression:**
  - [ ] A patient card can be dragged via its touch handle from Assigned to With Doctor, With Doctor to Carryout, and Carryout to Done.
  - [ ] A patient card can be tapped to activate Click-to-Select tablet mode, and tapping a destination column or button advances the patient.
  - [ ] Pressing `Escape` or tapping "Cancel" dismisses selection mode cleanly.
- [ ] **Separation of Concerns:**
  - [ ] Zero hardcoded UI text copy in any component file (100% exported from `nurseTexts.ts`).
  - [ ] Zero inline style objects or raw layout measurements in component files (100% exported from `nurse.ts`).
- [ ] **Finished Table Correction:** `FinishedTable.tsx` headers match body columns with zero horizontal misalignment (`Queue No.`, `Service`, `Cubicle`, `Consult Finished`, `Carryout Finished`).
- [ ] **Superadmin & Admin Access:** Logging in with a `superadmin` or `admin` account successfully displays nurse station cubicles without the "No cubicles assigned" blockage.
- [ ] **Live Elapsed Timers:** Real-time timers display in all active stages with warning color thresholds when limits are exceeded.
- [ ] **Deepgram TTS Announcements:** Clicking "Call" announces `"Number [Letter] [Digits], please proceed to cubicle [CubicleNum]"` without throwing audio errors.
- [ ] **Emoji Prohibition:** Zero emojis exist in code, comments, JSDoc annotations, commit messages, or UI copy across the entire repository.
- [ ] **Zero Automated Command Executions:** No terminal commands were run by the AI agent; all builds, linting, and database operations are performed manually by the user.
