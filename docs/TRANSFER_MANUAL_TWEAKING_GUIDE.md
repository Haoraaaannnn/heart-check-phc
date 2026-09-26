# Patient Transfer Dashboard — Manual Tweaking & Customization Guide

This guide is designed for developers and administrators who need to tweak, adjust, or customize the **Patient Transfer Dashboard** (`app/transfer/`). It explains **what file to edit, where to find specific settings, and how to safely apply modifications** while keeping the system stable and adhering to the repository's architectural guidelines (`AGENTS.md`).

---

## 1. Directory Structure and File Map

All files relating to the Transfer Dashboard are organized under `app/transfer/`:

```
app/transfer/
├── page.tsx                           # Main dashboard page, orchestrates data, state & flows
├── components/                        # Modular UI components
│   ├── BreadcrumbNav.tsx              # Sticky top breadcrumb bar with BackButton
│   ├── ConsultationFlow.tsx           # Multi-step flow for Consultation (Subcategory -> Room -> Board)
│   ├── CubicleCard.tsx                # Compact horizontal cubicle card tile
│   ├── DoctorsModal.tsx               # Modal container for doctor-to-cubicle assignments
│   ├── DoctorsPanel.tsx               # Internal doctor assignment and active status manager
│   ├── DragGhost.tsx                  # Floating drag preview portal attached to document.body
│   ├── DragHandle.tsx                 # Touch-friendly drag grip handle
│   ├── ElapsedTimer.tsx               # Real-time MM:SS timer component with warning thresholds
│   ├── IdleNumbersPanel.tsx           # Timed-out/idle patient panel (scrolls internally)
│   ├── OPScreeningFlow.tsx            # Multi-step flow for OPD Screening
│   ├── OnProgressSection.tsx          # Active queue panel with strict FIFO lock (scrolls internally)
│   ├── OtherServicesFlow.tsx          # Direct two-column board for non-consultation services
│   ├── QueuePanel.tsx                 # Left column tabbed container (Active Queue + Idle Patients)
│   ├── RegistrationCounterSection.tsx # Non-scrollable horizontal registration counters grid
│   ├── SelectionBanner.tsx            # Floating context banner during Click-to-Select mode
│   ├── ServiceBoard.tsx               # Two-column non-scrollable dashboard canvas (Queue + Stations)
│   ├── Sidebar.tsx                    # Fixed left sidebar navigation rail
│   └── StepPickers.tsx                # SubcategoryPicker & RoomPicker selection cards
├── constants/                         # Centralized styles and copy
│   ├── transfer.ts                    # Layout tokens, CSSProperties style objects & color tokens
│   └── transferTexts.ts               # ALL UI strings, labels, hints, and tooltips
├── hooks/                             # Custom React hooks (business logic & data streaming)
│   ├── index.ts                       # Barrel export file for all hooks
│   ├── dragUtils.ts                   # Pointer coordinate normalization & hit-testing
│   ├── useAutoAssign.ts               # Automated queue-to-cubicle assignment logic
│   ├── useAutoRotate.ts               # Patient timeout and rotation daemon
│   ├── useCubicleData.ts              # Cubicle fetching & doctor-to-cubicle lookup
│   ├── useDragAndDrop.ts              # Pointer drag-and-drop state & target hit-testing
│   ├── useIdlePatients.ts             # Idle patient fetch, reactivate, and remove mutations
│   ├── useIdleTimeout.ts              # Inactivity monitor to preserve session integrity
│   ├── useMaxRotations.ts             # Max rotation thresholds before marking Idle
│   ├── useMyAccess.ts                 # Role-based service, room, and counter access rights
│   ├── usePatientData.ts              # Real-time Supabase active & assigned patient sync
│   ├── useRealtimeSubscription.ts     # Supabase Realtime channel subscription
│   ├── useRegistrationDragAndDrop.ts  # Counter-to-counter pointer drag-and-drop
│   ├── useRegistrationRotate.ts       # Registration counter window timeout rotation
│   ├── useRequireAuth.ts              # Session guard ensuring authenticated access
│   ├── useRotateTimeout.ts            # Rotation interval duration hook
│   └── useTransferSelection.ts        # Click-to-Select tablet transfer interaction hook
├── lib/
│   ├── constants.ts                   # Hospital queue constants, categories & capacity limits
│   └── rotateApi.ts                   # API caller for backend rotation actions
└── types/
    └── transfer.ts                    # Selection models and transfer domain types
```

---

## 2. Common Tweaks Cookbook ("I want to...")

### A. Change UI Text, Wording, or Tooltips
> **Where to edit:** [`app/transfer/constants/transferTexts.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/constants/transferTexts.ts)

All UI copy is strictly separated into `transferTexts.ts`. **Never hardcode text inside component files.**

```typescript
// Example: Modifying queue labels or button copy in transferTexts.ts
export const transferTexts = {
  queueTabTitle: "Active Queue",            // Left tab title
  servingNext: "Serving Next",              // Top patient badge
  assignHereBtn: "Assign Here",             // Cubicle selection button
  reassignHereBtn: "Move Here",             // Cubicle reassignment button
  moveToCounterBtn: "Move Here",            // Counter selection button
  // ...
};
```

---

### B. Change Colors, Highlight Borders, or Card Styles
> **Where to edit:** [`app/transfer/constants/transfer.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/constants/transfer.ts)

All inline style objects and design tokens live in `TransferStyle`:

- **Active Drop Target Highlight:** Edit `TransferStyle.activeDropzone`
- **Selected Patient Row (Red ring):** Edit `TransferStyle.selectedPatientRow`
- **Eligible Target Station (Green ring):** Edit `TransferStyle.assignTargetCard`
- **Floating Banner Shadow:** Edit `TransferStyle.selectionBanner`

```typescript
// Example: In app/transfer/constants/transfer.ts
export const TransferStyle = {
  assignTargetCard: {
    borderColor: '#10b981',                         // Green border for eligible stations
    backgroundColor: 'rgba(236, 253, 245, 0.5)',   // Light emerald tint
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
  } as CSSProperties,
  // ...
};
```

---

### C. Change Maximum Capacity per Cubicle (Default: 5)
> **Where to edit:** [`app/transfer/lib/constants.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/lib/constants.ts)

By default, cubicles accept a maximum of 5 patients (1 actively being served + 4 waiting). To adjust this hospital-wide threshold:

```typescript
// app/transfer/lib/constants.ts - Line 27
export const MAX_PATIENTS_PER_CUBICLE = 5; // Change to 3, 4, 6, etc.
```

---

### D. Change Timer Warning and Rotation Durations
> **Where to edit:**
> 1. [`app/transfer/lib/constants.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/lib/constants.ts)
> 2. [`app/transfer/components/ElapsedTimer.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/ElapsedTimer.tsx)

- **Default Timeout Duration (Before auto-rotating):**
  ```typescript
  // app/transfer/lib/constants.ts - Line 17
  export const ROTATE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes (in milliseconds)
  ```
- **Max Rotations Before Moving to Idle (Default: 5):**
  ```typescript
  // app/transfer/lib/constants.ts - Line 18
  export const MAX_ROTATIONS_BEFORE_IDLE = 5;
  ```
- **Elapsed Timer Color Warning Threshold (Red when exceeded):**
  ```typescript
  // app/transfer/components/ElapsedTimer.tsx - Line 6
  warnAfterSeconds = 120 // Turns timer text red after 120 seconds
  ```

---

### E. Change Default Registration Counters (Default: Counters 1–5)
> **Where to edit:**
> 1. [`app/transfer/components/RegistrationCounterSection.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/RegistrationCounterSection.tsx#L49)
> 2. [`app/transfer/hooks/useMyAccess.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useMyAccess.ts#L107)

When a staff member does not have specific counter restrictions assigned in `user_counters`, the dashboard defaults to 5 counters:

```typescript
// app/transfer/components/RegistrationCounterSection.tsx - Line 49
const DEFAULT_COUNTERS = [1, 2, 3, 4, 5]; // Add or remove counter numbers here
```

---

### F. Change Grid Layout & Responsive Columns for Cubicles and Counters
> **Where to edit:**
> 1. **Registration Counters Grid:** [`app/transfer/components/RegistrationCounterSection.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/RegistrationCounterSection.tsx#L96)
> 2. **Cubicles Grid:** [`app/transfer/components/ServiceBoard.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/ServiceBoard.tsx#L220)
> 3. **Column Width Ratio (Left Queue vs Right Stations):** [`app/transfer/components/ServiceBoard.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/ServiceBoard.tsx#L151)

Both Registration Counters and Cubicles share the same responsive horizontal grid:

```tsx
{/* 2 columns on small screens, 3 on tablets, 5 on desktop */}
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
  {/* Cards */}
</div>
```

To alter the balance between the Left Queue Panel and Right Station Board:
```tsx
{/* In ServiceBoard.tsx */}
{/* Left Column (QueuePanel): currently 4 of 12 columns */}
<div className="md:col-span-4 lg:col-span-4 h-full flex flex-col min-h-0 overflow-hidden">
  <QueuePanel ... />
</div>

{/* Right Column (Counters + Cubicles): currently 8 of 12 columns */}
<div className="md:col-span-8 lg:col-span-8 h-full flex flex-col min-h-0 gap-2.5 overflow-hidden">
  {/* Registration Counters + Cubicles */}
</div>
```

---

### G. Adjusting Click-to-Select (Tablet Mode) Behavior
> **Where to edit:**
> - Logic & state: [`app/transfer/hooks/useTransferSelection.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useTransferSelection.ts)
> - Floating guidance banner: [`app/transfer/components/SelectionBanner.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/SelectionBanner.tsx)

- **How it works:**
  1. Staff clicks the top patient in the queue (`index === 0`), a cubicle patient, or a counter patient.
  2. `selectPatient(patient, sourceType, sourceId)` records `selectedPatient`.
  3. Eligible stations highlight visually with `assignTargetCard` styling.
  4. Clicking the destination calls `assignSelectedToCubicle(targetCubicle)` or `moveSelectedToCounter(targetCounter)`.
  5. The action commits optimistically to local React state, updates `pendingUpdates`, and clears selection.
- **Keyboard Shortcut:** Tapping the `Escape` key immediately cancels the active selection via a window listener inside `useTransferSelection.ts`.

---

### H. Adjust Text-to-Speech (Deepgram Audio Announcements)
> **Where to edit:**
> - API call & voice model: [`app/transfer/page.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx#L370) (`speak()` function)
> - Queue call phrasing: [`app/transfer/components/OnProgressSection.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/OnProgressSection.tsx#L230)
> - Cubicle call phrasing: [`app/transfer/components/CubicleCard.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/components/CubicleCard.tsx#L225)

The dashboard uses Deepgram's text-to-speech API. To change the speech phrasing:

```tsx
// In CubicleCard.tsx:
onSpeak(
  `Number ${letter} ${digits}, Number ${letter} ${digits}, go to ${cubicle.cubicleNum}`,
  topPatient.id
);
```

---

### I. Adjust SMS Notifications
> **Where to edit:**
> - Server action: [`app/actions/sendSMS.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts)
> - Confirm trigger: [`app/transfer/page.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx#L515) (`handleConfirm()` function)

When staff clicks the red **"Confirm N Assignments"** button in the header bar, `handleConfirm()` iterates through pending assignments and triggers `sendSMS(phoneNum, patientNum, cubicleNum)`.

---

## 3. Critical Rules for Manual Editing (Avoiding Common Pitfalls)

| Pitfall | Why it breaks | How to do it properly |
| :--- | :--- | :--- |
| **`'use client';` placement** | In Next.js client component hooks, having docblocks above `'use client';` can trigger module bundler resolution errors. | **Always put `'use client';` on Line 1** of custom hooks and client components. |
| **Click event bubbling (`stopPropagation`)** | Clicking a patient inside a cubicle/counter will bubble up to the outer card target handler. | **Always call `e.stopPropagation()`** in child click/pointer handlers (e.g. `handleTopPatientClick`, audio button, undo button). |
| **Array safety (`null` vs `undefined`)** | During asynchronous polling, data from Supabase may momentarily be empty or undefined. Calling `.length` or `.filter` directly will crash the app. | **Always use defensive fallback arrays:**<br>`const safePatients = Array.isArray(patients) ? patients : [];` |
| **Non-scrollable container requirement** | Adding `overflow-y-auto` to the outer page or station cards reintroduces scrolling bugs on tablets. | The **only** elements permitted to scroll are the patient lists inside `OnProgressSection.tsx` and `IdleNumbersPanel.tsx`. |
| **Importing newly created hooks** | TypeScript Language Server in IDEs may fail to index new files in subdirectories. | Export hooks through [`app/transfer/hooks/index.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/index.ts) or re-export from established hook files. |
| **Hardcoding UI text** | Violates `AGENTS.md` Rule 2 (Separation of Concerns). | Add all text strings to [`transferTexts.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/constants/transferTexts.ts). |
| **Using emojis in code or docs** | Emojis degrade readability across developer toolchains, terminals, and clinical documentation. | **Zero emojis allowed** across all documentation, markdown files, code comments, commit messages, and UI copy. |
| **Automated command/file execution** | Automated command runs risk unintended environment alterations, build desyncs, or port conflicts. | **Prohibition on automated execution:** Agents must never execute bash or terminal commands; all command and file executions must be performed manually by the user. |

---

## 4. Operational and Development Rules

All contributors, engineers, and AI assistants working in this repository must strictly obey the core operational constraints defined in `AGENTS.md`:

### A. Absolute Prohibition on Command and File Execution
- Automated tools, AI assistants, and background agents must **NEVER** execute terminal commands, bash scripts, builds (`npm run build`, `npm run dev`), linters, migrations, or test suites.
- **All executions are performed manually by the user.** The agent's role is strictly confined to inspecting, analyzing, and editing code and documentation files.
- When an execution, verification, or build step is required, provide the exact command in a markdown code block for the user to execute manually in their terminal.

### B. Prohibition on Emojis
- Emojis must **NEVER** be used in any documentation files (`.md`), code comments, JSDoc annotations, commit messages, or UI copy.
- All documentation, headings, tables, and lists must use clean, professional, plain-text formatting without pictorial icons or symbols.

---

## 5. Quick Verification Checklist

After editing any code in the transfer dashboard, verify:

- [ ] Does the page compile with zero TypeScript errors?
- [ ] Are both PC and tablet views completely non-scrollable (except the left active/idle queue)?
- [ ] Does Click-to-Select work by tapping a patient and then tapping a station?
- [ ] Does pointer drag-and-drop still function as expected?
- [ ] Does pressing `Escape` or tapping "Cancel" dismiss selection mode cleanly?
- [ ] Are all new labels exported from `transferTexts.ts`?
- [ ] Are all documentation files, code comments, and strings completely free of emojis?
- [ ] Were zero terminal commands or scripts executed automatically (all execution left to the user)?
