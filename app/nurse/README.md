# Nurse Station Module Developer Guide

This document provides architectural standards and an exhaustive developer mapping for the Nurse Station module in the Heart Check PHC application.

---

## Architectural Overview

The Nurse Station dashboard manages outpatient consultation workflows across clinical stages:
1. Assigned (patients waiting for consultation)
2. With Doctor (active consultation)
3. Carryout (post-consultation instructions and order release)
4. Done (archived for the day)

The module implements optimistic state transitions backed by an offline-resilient Write-Ahead Logging (WAL) outbox pattern. Clinical actions are committed to local persistent disk storage (IndexedDB) prior to or concurrently with network transmission to Supabase, guaranteeing zero data loss during power outages, workstation reboots, or network disconnects.

### Navigation Sidebar & Presentation Standard (Transfer Dashboard Parity)
- **Unified Responsive Sidebar Standard:** The Nurse Dashboard navigation sidebar (`NurseSidebar.tsx`) follows the exact responsive architecture of the Patient Transfer dashboard (`Sidebar.tsx`).
- **Icon-Only Rail vs. Expanded Text Modes:** Supports an icon-only rail (`w-18` / 72px) to maximize screen space for the 3-column clinical Kanban board, and an expanded panel (`w-64` / 256px) displaying full service category text labels, patient count badges, and room/cubicle hierarchies.
- **Main Area Offset:** The main clinical pipeline Kanban area dynamically offsets with `flex-1 ml-18` in icon-only mode and `flex-1 ml-64` in expanded mode with smooth CSS transitions.
- **Icon / Text Toggle Controls:** Can be toggled between icon-only and expanded-with-text modes at any time via the dedicated single toggle button in the top header bar (`NurseHeader.tsx`). To maintain a clean UI and avoid duplicate controls, no toggle buttons are placed inside the sidebar itself.
- **Real-Time Notification Badges:** Displays full `NotificationBadge` counters in expanded view and compact pulse dots in icon-only rail view.
- **Header Station Selector:** `NurseHeader.tsx` provides a compact station/category dropdown selector for quick one-click cubicle switching.

### Anti-Overlap Responsive Layout Standards
To prevent text collisions across desktop, laptop, and tablet viewports:
- **Header Element Constraints:** In `NurseHeader.tsx`, the left title container enforces `flex-1 min-w-0 overflow-hidden`, station dropdown is bounded (`max-w-[160px] lg:max-w-[200px]`), and attending physician indicators use `hidden xl:flex` with truncation so right-side ledger and live status controls never collide.
- **Stage Column Headers:** `StageColumn.tsx` header enforces `flex items-center justify-between gap-2 min-w-0` and `flex-1 overflow-hidden` on the stage title, ensuring the "+ Move Here" button is never crowded out.
- **Patient Card Boundaries:** `NursePatientCard.tsx` enforces `break-words whitespace-normal leading-snug` on service and subcategory labels (per AGENTS.md Rule 11), wraps `ElapsedTimer` with `shrink-0`, and locks action buttons (`Call`, `With Doctor`, `Back`, `Carryout`, `Done`) with `whitespace-nowrap shrink-0`.
- **Selection Banners:** `NurseSelectionBanner.tsx` constrains origin labels (`max-w-[130px] truncate`), sets instructions to `min-w-0 flex-1`, and guards the cancel button with `whitespace-nowrap shrink-0`.

---

## Where to Edit

Use this table to quickly identify the exact file to modify for any given requirement:

| What to Change | Primary File Path | Notes |
| :--- | :--- | :--- |
| UI text, labels, messages, empty states | `app/nurse/constants/nurseTexts.ts` | All UI strings must be defined here |
| Centralized navigation & sidebar icons | `constants/icons.ts` | Centralized `SIDEBAR_ICONS` and `CATEGORY_ICONS` |
| Navigation rail sidebar | `app/nurse/components/NurseSidebar.tsx` | Fixed responsive rail matching Transfer standard (`w-18 2xl:w-64`) |
| Banner messages & offline sync alerts | `constants/connectionTexts.ts` | Shared across nurse and transfer dashboards |
| Inline styles and layout tokens | `app/nurse/constants/nurse.ts` | CSSProperties and column dimension tokens |
| Clinical stage progression actions | `app/nurse/hooks/useNurseActions.ts` | Optimistic mutations with in-flight stage pinning and outbox persistence |
| Patient data loading & cubicle scoping | `app/nurse/hooks/useNurseData.ts` | Cached cubicle discovery, request sequencing, in-flight mutation overlay, and 0ms realtime patching |
| Offline queue outbox engine | `lib/offlineQueue.ts` | IndexedDB persistent outbox queue and flush worker |
| Offline synchronization React hook | `hooks/useOfflineQueue.ts` | Handles re-sync triggers on reconnect and boot |
| Drag-and-drop pointer interactions | `app/nurse/hooks/useNurseDragAndDrop.ts` | Pointer events and stage validation rules |
| Tablet tap-to-select interactions | `app/nurse/hooks/useNurseSelection.ts` | Mobile/tablet selection workflow |
| Realtime subscription and polling | `app/nurse/hooks/useRealtimeSubscription.ts` | Supabase Realtime channel coordination with 0ms payload dispatch, 50ms debounce, 5s polling fallback, 2s hysteresis, and 500ms trailing-edge throttle |
| Main page coordination | `app/nurse/page.tsx` | Main orchestrator assembling subcomponents |
| Board columns and cards | `app/nurse/components/NurseBoard.tsx` | 3-column clinical pipeline Kanban |
| Patient card & quick actions | `app/nurse/components/NursePatientCard.tsx` | Clinical card with in-button loading spinners for weak signal feedback |
| Quick-action dropdown (tap-to-act) | `app/nurse/components/NurseQuickActionDropdown.tsx` | Contextual popover for direct 1-tap stage progression with in-button loading spinners and auto-dismiss |
| Header bar & desktop cubicle dropdown | `app/nurse/components/NurseHeader.tsx` | Header bar, sync indicators, station dropdown |
| Finished patient archive drawer | `app/nurse/components/FinishedDrawer.tsx` | Slide-over drawer for completed patients |
| Audio announcements (TTS) | `app/nurse/page.tsx` | Deepgram Text-to-Speech integration |
| Patient types and schemas | `types/Types.ts` | Core domain model for patient records |

---

## Offline Outbox and Power Loss Handling

When a nurse changes a patient stage:
1. `enqueueMutation` in `lib/offlineQueue.ts` saves the operation payload and exact clinical timestamp directly into IndexedDB on the device.
2. The UI reflects the change immediately.
3. If online, the mutation is pushed to Supabase and dequeued upon success.
4. If a power outage cuts the workstation, the record survives on disk. Upon reboot and page load, `useOfflineQueue` detects the pending item and automatically replays it to Supabase.
