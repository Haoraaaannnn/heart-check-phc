# Public Queue Display Monitor Module Developer Guide

This document provides architectural standards and an exhaustive developer mapping for the Public Queue Display Monitor module in `app/monitor/`.

---

## Architectural Overview

The Public Queue Display Monitor provides high-visibility, real-time patient queue visualization for waiting areas and hallways in the Philippine Heart Center Outpatient Department. It informs waiting patients of active ticket callouts, room designations, and registration counter updates.

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
6. **Audio Chime and Speech Gateway (`StartScreen.tsx`):**
   - Modern browsers block unprompted audio autoplay. The monitor presents an initial user-interaction gate ("Click to Start Audio Chime") to establish the Web Audio API context for ticket callout chimes.

---

## Where to Edit

Use this lookup matrix to identify the file to modify for any given requirement:

| What to Change | Primary File Path | Notes |
| :--- | :--- | :--- |
| Service categories and subcategory lists | `app/monitor/lib/constants.ts` | `CATEGORIES` and `SUB_CATEGORIES` definitions |
| Category selector portal and buttons | `app/monitor/page.tsx` | Entry gateway for selecting monitor displays |
| Dynamic monitor page orchestrator | `app/monitor/[category]/page.tsx` | URL parameter decoding and layout switcher |
| Paired cubicle station layout | `app/monitor/components/PairedLayout.tsx` | Cubicle card grid and doctor pairing |
| Service table roster layout | `app/monitor/components/TableLayout.tsx` | Multi-patient grid for non-cubicle services |
| Registration intake window layout | `app/monitor/components/RegistrationLayout.tsx` | Registration counter cards and status callouts |
| Audio chime activation modal | `app/monitor/components/StartScreen.tsx` | User-interaction gateway for Web Audio playback |
| Monitor top header and clock | `app/monitor/components/Header.tsx` | Header bar, department title, and Manila time |
| Monitor footer branding bar | `app/monitor/components/Footer.tsx` | Hospital footer information and live badge |
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
