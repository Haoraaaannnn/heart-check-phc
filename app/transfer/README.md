# Patient Transfer Module Developer Guide

This document provides architectural standards and an exhaustive developer mapping for the Patient Transfer module in the Heart Check PHC application.

---

## Architectural Overview

The Patient Transfer dashboard manages patient queues, cubicle room assignments, registration counter flow, auto-rotation timers, text-to-speech audio announcements, and SMS alerts.

The module incorporates offline-resilient Write-Ahead Logging (WAL) via an IndexedDB outbox. When assignments are confirmed or counter releases occur, actions are recorded on disk before/concurrently with network transmission to Supabase. This guarantees that pending transfers are never lost due to sudden power outages or network dropouts.

---

## Where to Edit

Use this table to quickly identify the exact file to modify for any given requirement:

| What to Change | Primary File Path | Notes |
| :--- | :--- | :--- |
| Transfer UI and constants | `app/transfer/lib/constants.ts` | Queue capacities, service names, cooldowns |
| Connection banner messages | `constants/connectionTexts.ts` | Centralized network and offline sync copy |
| Main transfer orchestrator | `app/transfer/page.tsx` | Flow routing, confirm persistence, sync |
| Offline queue outbox engine | `lib/offlineQueue.ts` | IndexedDB persistent outbox queue and flush worker |
| Offline synchronization React hook | `hooks/useOfflineQueue.ts` | Background synchronization engine |
| Consultation flow layout | `app/transfer/components/ConsultationFlow.tsx` | Consultation cubicles and waiting list |
| OPD screening flow layout | `app/transfer/components/OPScreeningFlow.tsx` | OPD screening cubicles and waiting list |
| Other services flow layout | `app/transfer/components/OtherServicesFlow.tsx` | Non-cubicle service queues |
| Navigation sidebar | `app/transfer/components/Sidebar.tsx` | Service category navigation and counters |
| Drag-and-drop operations | `app/transfer/hooks/useDragAndDrop.ts` | Pointer event drag-and-drop mechanics |
| Registration window drag & drop | `app/transfer/hooks/useRegistrationDragAndDrop.ts` | Counter allocation interactions |
| Auto-assignment algorithm | `app/transfer/hooks/useAutoAssign.ts` | Least-occupied cubicle distribution |
| Queue rotation timers | `app/transfer/hooks/useAutoRotate.ts` | Idle rotation and timeout management |
| Realtime subscription | `app/transfer/hooks/useRealtimeSubscription.ts` | Supabase Realtime channel handler |
| Patient types and contracts | `types/Types.ts` | Global patient record interface |

---

## Offline Outbox and Power Loss Handling

When transfer staff confirm assignments or release patients from registration:
1. `enqueueMutation` in `lib/offlineQueue.ts` commits the mutation payload and exact timestamp to the local browser database (IndexedDB).
2. If online, the payload is transmitted to Supabase. Upon server confirmation (`200 OK`), the local entry is cleaned up.
3. If power abruptly fails or WiFi drops, the records remain intact on the workstation SSD. As soon as the page is reopened after power returns, the startup sync worker detects the unsynced entries and flushes them to Supabase in FIFO sequence.
