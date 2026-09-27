# Screen Display Selector Developer Guide: Architecture & Where to Edit

This document is the developer guide for maintaining and extending the Screen Display Selector module located at `app/select-screen/`.

---

## 1. Architectural Purpose & Security Model

The Screen Display Selector serves as the central routing junction for physical screens and terminals in the outpatient clinic. When staff members log into a terminal, they are brought to this interface to configure whether the screen acts as:

1. **A Public Display Terminal:**
   - **Patient Kiosk (`/kiosk/pages/kiosk-new-old-selection`):** A self-service queue ticketing kiosk. When selected, the staff's authenticated session is automatically signed out via `supabase.auth.signOut()` before navigating to the kiosk route to ensure unattended patients cannot access staff privileges or session tokens.
   - **Queue Monitor (`/monitor`):** An overhead live display showing calling queue numbers and room assignments. Designed for public TV displays without interactive timeouts.

2. **A Staff Workstation:**
   - Operational workstations are strictly gated by the staff member's database role (`users.role`).
   - Only workstations authorized for the logged-in user's role are rendered.
   - Route-level security is enforced on the server edge via `proxy.ts`.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change page titles, card descriptions, or button labels** | [selectScreenTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/constants/selectScreenTexts.ts) |
| **Change visual styles, card padding, colors, or animations** | [selectScreen.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/constants/selectScreen.ts) (`SELECT_SCREEN_STYLES`) |
| **Add a new screen option or change destination routes** | [selectScreen.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/constants/selectScreen.ts) (`SCREEN_OPTIONS`) |
| **Change role authorization lists for workstations or displays** | [selectScreen.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/constants/selectScreen.ts) and [proxy.ts](file:///home/jensen/Github-Repositories/heart-check-phc/proxy.ts) |
| **Change session resolution, user lookup, or sign-out logic** | [useCurrentStaff.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/hooks/useCurrentStaff.ts) |
| **Modify card presentation or navigation behavior** | [ScreenOptionCard.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/components/ScreenOptionCard.tsx) |
| **Modify top navbar, staff badge, or hero header** | [SelectScreenHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/components/SelectScreenHeader.tsx) |
| **Change TypeScript interfaces and models** | [selectScreen.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/types/selectScreen.ts) |
| **Change server-side edge proxy access control** | [proxy.ts](file:///home/jensen/Github-Repositories/heart-check-phc/proxy.ts) |

---

## 3. Role Access Matrix

| Screen Option | Route | Allowed Roles | Session Clearance |
| :--- | :--- | :--- | :--- |
| **Patient Kiosk** | `/kiosk/pages/kiosk-new-old-selection` | All authenticated staff | Yes (`signOut` before redirect) |
| **Queue Monitor** | `/monitor` | All authenticated staff | No (remains public display) |
| **Registration & Transfer** | `/transfer` | `registration`, `nurse`, `staff`, `admin`, `superadmin` | No (active workstation) |
| **Nurse Station** | `/nurse` | `nurse`, `staff`, `doctor`, `admin`, `superadmin` | No (active workstation) |
| **Operations Dashboard** | `/dashboard` | `admin`, `superadmin` | No (active workstation) |
| **Super Admin Console** | `/superadmin` | `superadmin` | No (active workstation) |
