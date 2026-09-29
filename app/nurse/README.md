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

---

## Where to Edit

Use this table to quickly identify the exact file to modify for any given requirement:

| What to Change | Primary File Path | Notes |
| :--- | :--- | :--- |
| UI text, labels, messages, empty states | `app/nurse/constants/nurseTexts.ts` | All UI strings must be defined here |
| Banner messages & offline sync alerts | `constants/connectionTexts.ts` | Shared across nurse and transfer dashboards |
| Inline styles and layout tokens | `app/nurse/constants/nurse.ts` | CSSProperties and column dimension tokens |
| Clinical stage progression actions | `app/nurse/hooks/useNurseActions.ts` | Optimistic mutations with outbox persistence |
| Offline queue outbox engine | `lib/offlineQueue.ts` | IndexedDB persistent outbox queue and flush worker |
| Offline synchronization React hook | `hooks/useOfflineQueue.ts` | Handles re-sync triggers on reconnect and boot |
| Drag-and-drop pointer interactions | `app/nurse/hooks/useNurseDragAndDrop.ts` | Pointer events and stage validation rules |
| Tablet tap-to-select interactions | `app/nurse/hooks/useNurseSelection.ts` | Mobile/tablet selection workflow |
| Realtime subscription and polling | `app/nurse/hooks/useRealtimeSubscription.ts` | Supabase Realtime channel coordination |
| Main page coordination | `app/nurse/page.tsx` | Main orchestrator assembling subcomponents |
| Board columns and cards | `app/nurse/components/NurseBoard.tsx` | 3-column clinical pipeline Kanban |
| Header bar and connection status | `app/nurse/components/NurseHeader.tsx` | Header bar, sync indicators, filters |
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
