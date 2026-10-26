# Public Queue Display Monitor Module Developer Guide

This document provides architectural standards and an exhaustive developer mapping for the Public Queue Display Monitor module in `app/monitor/`.

**Last Updated:** 2026-10-25

---

## Architectural Overview

The Public Queue Display Monitor provides high-visibility, real-time patient queue visualization for waiting areas and hallways in the Philippine Heart Center Outpatient Department. It informs waiting patients of active ticket callouts, room designations, and registration counter updates.

### Public TV Monitor Core Display Standards
All public monitor screens enforce strict wall-mounted TV display standards:
1. **Zero Dark Mode Lock (`layout.tsx`):** Root shell strictly enforces institutional light mode (`bg-slate-50`, `bg-white`, `#cc3535`). Dark mode is strictly banned from TV monitors for maximum readability across bright waiting halls. A `MutationObserver` permanently prevents any background theme provider from re-injecting the `dark` class.
2. **Strict Zero-Scroll TV Viewport Lock:** All screens fill `h-screen h-[100dvh] w-screen w-[100dvw]` with `overflow: hidden` on root, body, and all content wrappers. Because wall-mounted TV monitors have neither mouse nor touch interaction, no scrollbars or clipped overflow are permitted across Full HD (1080p), 4K, 720p, and tablet displays.
3. **Maximum Queue Number Scale:** The patient queue number is the primary operational data point. Ticket numbers scale up to `text-9xl` through `text-[11rem]` (`font-black tabular-nums tracking-tight leading-none`), maximizing card surface without wrapping or overflowing.
4. **Active Calling Highlight:** Stations actively calling patients (via staff recalls or automatic announcements) display a prominent "CALLING NOW" high-contrast amber badge and a 100% opaque red card with an animated amber beacon ring (`.animate-monitor-calling`). The card flashes and blinks without fading opacity or washing out the ticket number to white.
5. **Next in Queue Clarity:** Upcoming tickets in waiting queues are clearly labeled with dedicated "NEXT IN QUEUE" badges and enlarged typography so patients immediately understand who is calling and who is next in line.
6. **Adaptive Multi-Column Splitting:** In cubicle pairing mode (`PairedLayout.tsx`), when active stations exceed 4, the view automatically splits into a balanced 4-column matrix (Queue, Room, Queue, Room) to eliminate vertical overflow.
7. **Fixed-Layout Tables:** Service roster displays (`TableLayout.tsx`) enforce `table-fixed` column distribution, preventing horizontal overflow.

### Routing and Display Modes
1. **Category Selector Gateway (`app/monitor/page.tsx`):**
   - Allows display terminals to select which clinical department or service they present.
   - For services with adult and pediatric divisions (Consultation, OPD Screening), presents a secondary subcategory picker (`Pedia` vs `Adult`).
2. **Dynamic Department Route (`app/monitor/[category]/page.tsx`):**
   - Decodes URL parameters (e.g., `/monitor/Consultation-Adult`, `/monitor/Registration`, `/monitor/ECG`).
   - Automatically chooses the optimal clinical layout based on the service architecture.
3. **Paired Cubicle Layout (`PairedLayout.tsx`):**
   - Used for cubicle-based consultation and examination stations.
   - Pairs consultation cubicles side-by-side with active patient numbers, doctor names, and consultation statuses.
4. **Table Grid Layout (`TableLayout.tsx`):**
   - Used for non-cubicle multi-patient services (e.g., ECG, Warfarin, OPD Card).
   - Renders queue rosters with clear serving and waiting columns.
5. **Registration Counter Layout (`RegistrationLayout.tsx`):**
   - Specialized layout for intake windows showing active calling counters and serving tickets.
   - **4-Counter 2x2 Matrix Mode:** When 4 counters are active, automatically switches to a 2-top, 2-bottom widescreen quadrant grid. Each counter card splits horizontally with an enlarged 60% Now Serving card (scaling up to `11.5rem` typography) on the left and a 40% Upcoming Queue Roster on the right (Hero Next Ticket + #2, #3, #4 in-line sequence rows — accepting up to 4 on queue, 5 total per counter).
   - **5+ Column Default Mode:** When 5 or more counters are open, renders vertical side-by-side columns with an enlarged upper 52-54% Now Serving card (scaling up to `9.5rem` typography) and a lower upcoming queue box displaying 4 waiting queue spots (#1 Hero Next in Queue + #2, #3, #4 in-line sequence rows) for a total of 5 queue numbers visible per counter including the one calling.
6. **Audio Chime and Speech Gateway (`StartScreen.tsx`):**
   - Modern browsers block unprompted audio autoplay. The monitor presents an initial user-interaction gate ("Click to Start Audio Chime") to establish the Web Audio API context for ticket callout chimes.

---

## Where to Edit

Use this lookup matrix to identify the file to modify for any given requirement:

| What to Change | Primary File Path | Notes |
| :--- | :--- | :--- |
| Monitor copy and bilingual texts | `app/monitor/constants/monitorTexts.ts` | Centralized bilingual labels, titles, and notices |
| Monitor responsive styles and tokens | `app/monitor/constants/monitorStyles.ts` | Centralized zero-scroll styles, cards, and grid tokens |
| Service categories and subcategory lists | `app/monitor/lib/constants.ts` | `CATEGORIES` and `SUB_CATEGORIES` definitions |
| Category selector portal and buttons | `app/monitor/page.tsx` | Entry gateway for selecting monitor displays |
| Dynamic monitor page orchestrator | `app/monitor/[category]/page.tsx` | URL parameter decoding and layout switcher |
| Paired cubicle station layout | `app/monitor/components/PairedLayout.tsx` | Cubicle card grid and doctor pairing |
| Service table roster layout | `app/monitor/components/TableLayout.tsx` | Multi-patient grid for non-cubicle services |
| Registration intake window layout | `app/monitor/components/RegistrationLayout.tsx` | Registration counter cards and status callouts |
| Audio chime activation modal | `app/monitor/components/StartScreen.tsx` | User-interaction gateway for Web Audio playback |
| Monitor top header and clock | `app/monitor/components/Header.tsx` | Header bar, department title, and Manila time |
| Monitor footer branding bar | `app/monitor/components/Footer.tsx` | Hospital footer information and bilingual notices |
| Active elapsed timer component | `app/monitor/components/ElapsedTimer.tsx` | Dynamic duration timer for ongoing consultations |
| Monitor data loading & doctor mapping | `app/monitor/hooks/useMonitorData.ts` | Database queries for cubicles, patients, counters |
| Real-time subscription & weak-signal polling | `app/monitor/hooks/useRealtimeSubscription.ts` | Supabase Realtime channel with 8s polling fallback |
| Global typography and display tokens | `constants/kiosk.ts` | Centralized scales and presentation tokens |

---

## Weak-Signal Resilience & Queue Synchronization

The Public Monitor hook (`app/monitor/hooks/useRealtimeSubscription.ts`) incorporates dual-mode synchronization to guarantee reliable display even when waiting-room WiFi experiences high latency or packet loss:

1. **300ms Inbound Event Debounce:** Multiple patient updates arriving in rapid succession coalesce into a single fetch, avoiding request storms.
2. **8-Second Polling Fallback:** If the WebSocket connection drops, errors, or times out, the monitor automatically falls back to an 8-second polling interval against PostgreSQL.
3. **2-Second Channel Hysteresis:** A 2-second grace period prevents poll activation thrashing during momentary packet jitter.
4. **500ms Overlap Throttle:** Prevents concurrent polling and WebSocket triggers from firing simultaneous database queries.
5. **Immediate Recovery Reconciliation:** Triggers a fresh query as soon as the channel status recovers to `SUBSCRIBED`, immediately refreshing the display.

