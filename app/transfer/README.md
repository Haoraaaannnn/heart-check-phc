# Patient Transfer Module Developer Guide

This document provides architectural standards and an exhaustive developer mapping for the Patient Transfer module in the Heart Check PHC application.

---

## Architectural Overview

The Patient Transfer dashboard manages patient queues, cubicle room assignments, registration counter flow, auto-rotation timers, text-to-speech audio announcements, and SMS alerts.

The module incorporates offline-resilient Write-Ahead Logging (WAL) via an IndexedDB outbox. When assignments are confirmed or counter releases occur, actions are recorded on disk before/concurrently with network transmission to Supabase. This guarantees that pending transfers are never lost due to sudden power outages or network dropouts.

### Navigation Sidebar & Board Display Standard
- **Navigation Sidebar:** Uses centralized Boxicons defined in the root `constants/icons.ts` (`SIDEBAR_ICONS`, `CATEGORY_ICONS`, and `resolveServiceIcon`). Supports two view modes: an icon-only rail (`w-18` / 72px) to maximize workstation screen space, and an expanded panel (`w-64` / 256px) displaying full service category text labels and patient count badges. Can be toggled between icon-only and expanded-with-text modes via the dedicated single toggle button in the top header bar next to the title. To maintain a clean UI and avoid duplicate controls, no toggle buttons are placed inside the sidebar itself. The main transfer board smoothly offsets between `ml-18` and `ml-64`.
- **Board Actions & Patient Cards:** Action buttons and table cards use explicit, semantic text labels (`SEL`, `WAIT`, `Call`, `Calling...`, `Back`, `Assign`, `Activate`, `Remove`, `Close`, `Doctors`) rather than ambiguous icon buttons.
- **Manual Assignment Confirmation:** Pending patient assignments are reviewed and confirmed via a dedicated dialog (`ConfirmAssignmentModal.tsx`) rather than a header button, giving operators clear visibility into patient numbers, target cubicles, subcategories, and SMS notifications before committing changes.
- **Registration Counters & Station Tiles:** Zero placeholder icon boxes in tile headers; titles and doctor names are rendered cleanly as typography.
- **Drag Handles:** Render pure-CSS triple indicator lines with `data-drag-handle="true"` for touch safety.
- **Normalized Selection Buttons Standard:** Patient group selection (`SubcategoryPicker`) and consultation room selection (`RoomPicker`) buttons follow a normalized system standard:
  - Standard button width: `min-w-[320px]` to `max-w-[480px]` (~420px per button in 2-column grids).
  - Standard button height: `min-h-[116px]` with `p-6` padding and `rounded-2xl` corners.
  - Expansive containers: `max-w-4xl` (patient group) and `max-w-5xl` (rooms) with `gap-6`.
  - Clean typography-first anatomy: title heading + queue count badge on top row, patient breakdown details below.

---

## Where to Edit

Use this table to quickly identify the exact file to modify for any given requirement:

| What to Change | Primary File Path | Notes |
| :--- | :--- | :--- |
| Text copy, button labels, modal headers, badges | `app/transfer/constants/transferTexts.ts` | All UI text strings and button labels |
| Centralized navigation & sidebar icons | `constants/icons.ts` | Centralized `SIDEBAR_ICONS` and `CATEGORY_ICONS` |
| Selection button standard tokens & dimensions | `app/transfer/constants/transfer.ts` | `selectionCardTokens`, `transferLayoutTokens` |
| Transfer UI thresholds & categories | `app/transfer/lib/constants.ts` | Queue capacities, service names, cooldowns |
| Connection banner messages | `constants/connectionTexts.ts` | Centralized network and offline sync copy |
| Main transfer orchestrator | `app/transfer/page.tsx` | Flow routing, confirm persistence, sync |
| Confirm assignment modal | `app/transfer/components/ConfirmAssignmentModal.tsx` | Dialog for reviewing pending patient assignments and SMS alerts |
| Navigation sidebar | `app/transfer/components/Sidebar.tsx` | Service category navigation and centralized icons |
| Drag-and-drop grip handle | `app/transfer/components/DragHandle.tsx` | Pure CSS indicator lines with touch drag gating |
| Consultation flow layout | `app/transfer/components/ConsultationFlow.tsx` | Consultation cubicles and waiting list |
| OPD screening flow layout | `app/transfer/components/OPScreeningFlow.tsx` | OPD screening cubicles and waiting list |
| Other services flow layout | `app/transfer/components/OtherServicesFlow.tsx` | Non-cubicle service queues |
| Two-column board container | `app/transfer/components/ServiceBoard.tsx` | Assembles queue list and cubicle/station list |
| Active queue patient list | `app/transfer/components/OnProgressSection.tsx` | Queue patient cards with call/assign actions |
| Station / cubicle card | `app/transfer/components/CubicleCard.tsx` | Station status, call button, and back button |
| Registration counters section | `app/transfer/components/RegistrationCounterSection.tsx` | Counter cards and patient release flow |
| Idle / holding numbers section | `app/transfer/components/IdleNumbersSection.tsx` | Accordion container for idle patients |
| Idle patient card panel | `app/transfer/components/IdleNumbersPanel.tsx` | Activate and remove patient actions |
| Subcategory & room pickers | `app/transfer/components/StepPickers.tsx` | Typography cards for selecting subcategory/room |
| Selection banner (tablet tap mode) | `app/transfer/components/SelectionBanner.tsx` | Floating active selection bar with cancel |
| Doctor management modal & panel | `app/transfer/components/DoctorsModal.tsx`, `DoctorsPanel.tsx` | Doctor assignment modal and drawer |
| Offline queue outbox engine | `lib/offlineQueue.ts` | IndexedDB persistent outbox queue and flush worker |
| Offline synchronization React hook | `hooks/useOfflineQueue.ts` | Background synchronization engine |
| Drag-and-drop operations | `app/transfer/hooks/useDragAndDrop.ts` | Pointer event drag-and-drop mechanics |
| Registration window drag & drop | `app/transfer/hooks/useRegistrationDragAndDrop.ts` | Counter allocation interactions |
| Auto-assignment algorithm | `app/transfer/hooks/useAutoAssign.ts` | Least-occupied cubicle distribution |
| Queue rotation timers | `app/transfer/hooks/useAutoRotate.ts` | Idle rotation and timeout management |
| Realtime subscription | `app/transfer/hooks/useRealtimeSubscription.ts` | Supabase Realtime channel handler with 300ms event debounce, 5s polling fallback, 2s hysteresis, and 500ms overlap throttle |
| Patient types and contracts | `types/Types.ts` | Global patient record interface |

---

## Offline Outbox and Power Loss Handling

When transfer staff confirm assignments or release patients from registration:
1. `enqueueMutation` in `lib/offlineQueue.ts` commits the mutation payload and exact timestamp to the local browser database (IndexedDB).
2. If online, the payload is transmitted to Supabase. Upon server confirmation (`200 OK`), the local entry is cleaned up.
3. If power abruptly fails or WiFi drops, the records remain intact on the workstation SSD. As soon as the page is reopened after power returns, the startup sync worker detects the unsynced entries and flushes them to Supabase in FIFO sequence.
