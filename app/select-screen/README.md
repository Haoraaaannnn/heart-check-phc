# Screen Display Selector Developer Guide: Architecture & Where to Edit Map

This document is the developer guide for maintaining and extending the Screen Display Selector module located at `app/select-screen/`.

---

## 1. Architectural Purpose & Security Model

The Screen Display Selector serves as the central routing junction for physical screens and terminals across the Out-Patient Department of the Philippine Heart Center. When staff members log into a physical terminal, they are presented with this unified interface to configure whether the screen acts as:

1. **A Public Display Terminal:**
   - **Patient Self-Service Kiosk (`/kiosk/pages/kiosk-new-old-selection`):** Interactive queue ticketing kiosk. When selected, the staff's authenticated session is automatically signed out via `handleSignOut()` (which calls `/api/auth/logout` to destroy session cookies and revokes tokens) before replacing history to the kiosk route to ensure unattended patients cannot access staff privileges, session cookies, or database role claims.
   - **Public Queue Display Monitor (`/monitor`):** An overhead live display showing calling queue numbers and room assignments. Designed for public TV displays without interactive session timeouts.

2. **A Staff Workstation:**
   - Operational workstations are strictly gated by the staff member's database role (`users.role`).
   - Only workstations authorized for the logged-in user's role are rendered.
   - Route-level security is enforced on the server edge via `proxy.ts` with `Cache-Control: no-store` to prevent bfcache retention.
   - **Browser History & Navigation Isolation:** To prevent authenticated staff from backing out into unauthenticated screens (the public landing page `/` and `/login`), `proxy.ts` automatically intercepts requests to `/`, `/login`, and `/forgot-password` from authenticated users and redirects them to `/select-screen`. On the client side, `app/select-screen/hooks/useCurrentStaff.ts` binds `window.history.pushState` and `popstate` listeners to trap the browser Back button on the screen selector, while `app/page.tsx` and `app/login/page.tsx` verify active sessions on mount and on bfcache `pageshow` events to forward any lingering attempts immediately to `/select-screen`. Launching workstations from `ScreenOptionCard.tsx` uses `router.push()`, allowing staff in operational workstations to safely press browser Back to return to `/select-screen`.

---

## 2. Design System & Ergonomics Standards

The Screen Display Selector conforms to the enterprise solid surfaces standard defined in `AGENTS.md`:
- High-contrast solid surfaces with neutral grayish dark mode (`bg-slate-50 dark:bg-[#0d0d0d]`, `bg-white dark:bg-[#1a1a1a]`)
- Crisp 1-pixel borders (`border-slate-200 dark:border-[#2e2e2e]`)
- Centralized theme surfaces and size tokens defined once in [`constants/themeTokens.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themeTokens.ts) and imported directly
- Flawless dual-theme support (`light` and `dark` modes via `next-themes`)
- Enterprise sticky top header with Manila-time clock (`formatManilaDate`, `formatManilaTime`), theme toggle, staff identity chip, and quick sign out
- Zero bluish slate tones, zero blurry glassmorphism, zero emojis, and zero truncated text labels

---

## 3. Mandatory "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Target File | Description |
| :--- | :--- | :--- |
| **Change centralized surface themes, dark mode colors, or sizing scales** | [`constants/themeTokens.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themeTokens.ts) | Modify universal `themeTokens` or `sizeTokens` |
| **Change page titles, card descriptions, or button labels** | [`app/select-screen/constants/selectScreenTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/constants/selectScreenTexts.ts) | Modify text dictionaries and user-facing copy strings |
| **Change visual styles, card padding, colors, or dark mode classes** | [`app/select-screen/constants/selectScreen.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/constants/selectScreen.ts) | Modify `SELECT_SCREEN_STYLES` tokens |
| **Add a new screen option or change destination routes** | [`app/select-screen/constants/selectScreen.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/constants/selectScreen.ts) | Add to or update `SCREEN_OPTIONS` catalog |
| **Change role authorization lists for workstations or displays** | [`app/select-screen/constants/selectScreen.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/constants/selectScreen.ts) and [`proxy.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/proxy.ts) | Modify `ALL_STAFF_ROLES`, `CLINICAL_ROLES`, or edge proxy route guard |
| **Change session resolution, user lookup, or sign-out logic** | [`app/select-screen/hooks/useCurrentStaff.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/hooks/useCurrentStaff.ts) and [`lib/supabase/signOut.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/lib/supabase/signOut.ts) | Update authentication data hook and sign-out orchestrator |
| **Modify card presentation, security warnings, or navigation triggers** | [`app/select-screen/components/ScreenOptionCard.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/components/ScreenOptionCard.tsx) | Card component markup and session clearance logic |
| **Modify top navbar, staff identity chip, or hero header** | [`app/select-screen/components/SelectScreenHeader.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/components/SelectScreenHeader.tsx) | Top navigation bar layout, Manila clock, and theme toggle |
| **Change TypeScript interfaces and models** | [`app/select-screen/types/selectScreen.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/select-screen/types/selectScreen.ts) | TypeScript type definitions for screen options and user profiles |
| **Change server-side edge proxy access control** | [`proxy.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/proxy.ts) | Edge middleware role validation map and cache controls |

---

## 4. Role Access Matrix

| Screen Option | Route | Allowed Roles | Session Clearance |
| :--- | :--- | :--- | :--- |
| **Patient Self-Service Kiosk** | `/kiosk/pages/kiosk-new-old-selection` | All authenticated staff | Yes (`signOut` before redirect) |
| **Public Queue Display Monitor** | `/monitor` | All authenticated staff | No (remains public display) |
| **Patient Transfer & Triage Station** | `/transfer` | `registration`, `nurse`, `staff`, `admin`, `superadmin` | No (active workstation) |
| **Consultation Nurse Station** | `/nurse` | `nurse`, `staff`, `doctor`, `admin`, `superadmin` | No (active workstation) |
| **Operations & Analytics Dashboard** | `/dashboard` | `admin`, `superadmin` | No (active workstation) |
| **SuperAdmin Governance Portal** | `/superadmin` | `superadmin` | No (active workstation) |
