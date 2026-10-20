# Kiosk Services & Customization Developer Guide: Architecture & Where to Edit

**Last Updated:** 2026-10-20

This document serves as the developer editing guide for the Kiosk Services Customization module located in `app/superadmin/customization/`.

---

## 1. Module Overview & Architecture

The Kiosk Customization module provides hospital administrators with a user-friendly interface to create, modify, order, and govern outpatient services offered at kiosk touchscreens.

### Core Capabilities

1. **Dynamic Service Directory (Zero Hardcoded Baseline):**
   - Services are not hardcoded to legacy constants like "Consultation" or "OPD Screening".
   - Any service label (English and Filipino) can be entered and modified.
   - Clinical behavior across the hospital (Kiosk, Transfer, Nurse, and Monitor) is dynamically governed by 7 boolean and enum capability checklist flags stored on the PostgreSQL `services` table.

2. **The 7 Clinical Capability Checklist Flags:**
   - `requires_registration` (`bool`): Determines whether patients must report to Registration Counters 1 to 5 for document verification before queueing.
   - `has_subcategories` (`bool`): Determines whether the touchscreen prompts for age cohort triage (Adult 19+ vs Pedia 18 and below).
   - `requires_cubicle` (`bool`): Determines whether the kiosk displays doctor and room selection cards, routing patients to physical examination rooms.
   - `requires_nurse` (`bool`): Governs appearance on the 3-stage Nurse Station Kanban (/nurse: Assigned -> With Doctor -> Carryout -> Done).
   - `show_on_monitor` (`bool`): Governs broadcasting of active queue tickets on public waiting area TV monitors (/monitor).
   - `auto_assign` (`bool`): Controls whether the transfer coordinator distributes waiting patients FIFO without staff manual drag-and-drop.
   - `monitor_layout` (`varchar`): TV monitor calling layout style: `'cubicle'` (split-screen doctor cards) or `'table'` (multi-patient matrix grid).

3. **Queue Ticket Prefix & Padding:**
   - `queue_prefix` (`text`): First letter or number on the queue ticket (e.g. `C`, `S`, `1`, `4`).
   - `queue_pad_length` (`int4`): Digit padding following prefix (e.g. 3 digits yields `001`, producing `C001` or `1001`).

4. **Strict Separation of Concerns:**
   - Presentation layout in `app/superadmin/customization/page.tsx`.
   - Text copy and tooltips in `app/superadmin/customization/constants/customizationTexts.ts`.
   - Style dictionaries and capability badges in `app/superadmin/customization/constants/customizationStyles.ts`.
   - Data types in `types/Services.ts`.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| --- | --- |
| **Change service copy, bilingual placeholders, checklist labels, or table headers** | [customizationTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/constants/customizationTexts.ts) |
| **Change form card styles, checklist cards, toggle styling, or table badge colors** | [customizationStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/constants/customizationStyles.ts) |
| **Change service form state handling, Supabase queries, or table rendering** | [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/page.tsx) |
| **Change service deletion confirmation modal dialog** | [DeleteServiceModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/components/DeleteServiceModal.tsx) |
| **Change Service TypeScript interface or database column types** | [types/Services.ts](file:///home/jensen/Github-Repositories/heart-check-phc/types/Services.ts) |
| **Change curated Boxicon glyphs list or resolution fallback** | [constants/icons.ts](file:///home/jensen/Github-Repositories/heart-check-phc/constants/icons.ts) |
| **Change global theme tokens, surfaces, or border tokens** | [constants/themeTokens.ts](file:///home/jensen/Github-Repositories/heart-check-phc/constants/themeTokens.ts) |

---

## 3. Directory Layout

```
app/superadmin/customization/
├── README.md                              # This developer guide
├── page.tsx                               # Kiosk services catalog, editor form, and live ticket preview
├── components/
│   └── DeleteServiceModal.tsx             # Accessible confirmation dialog replacing native browser confirm
└── constants/
    ├── customizationTexts.ts              # Centralized copy, bilingual labels, tooltips, and validation errors
    └── customizationStyles.ts             # Tailwind CSS dictionaries, checklist cards, and table badges
```
