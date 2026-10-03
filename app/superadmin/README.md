# SuperAdmin Domain Developer Guide: Architecture & Where to Edit

This document serves as the authoritative developer guide for maintaining, extending, and modifying the SuperAdmin module in `app/superadmin/`.

It details the module architecture, solid background design standard, separation-of-concerns principles, and provides an exhaustive lookup table showing where to make edits for any visual, textual, layout, logic, or navigational changes.

---

## 1. Architectural Principles & Enterprise Design Standard

The SuperAdmin subsystem adheres strictly to the architectural standards defined in `AGENTS.md`:

1. **Solid Surfaces for Enterprise Clinical Administration:**
   - Backgrounds use a solid neutral foundation (`bg-slate-50 dark:bg-slate-950`).
   - Cards, tables, and modal dialogs utilize solid surface tokens (`bg-white dark:bg-slate-900`) with crisp solid borders (`border-slate-200 dark:border-slate-800`) and subtle elevation shadows (`shadow-xs`).
   - Official Philippine Heart Center red/rose accents (`text-rose-600`, `bg-rose-600`, `border-rose-500`) are applied throughout to reflect the hospital brand identity.
   - Glassmorphism, translucent milky opacity, blurry glowing gradients, and backdrop blur filters are eliminated in favor of high-contrast, clean, solid surfaces suitable for enterprise hospital administration.

2. **Strict Separation of Concerns:**
   - **UI Component Files (`components/`):** Pure rendering and layout assembly. Components never declare hardcoded string copy or ad-hoc style objects.
   - **Text Files (`constants/*Texts.ts`):** All labels, descriptions, column headers, titles, placeholders, and error messages live in dedicated text files.
   - **Style Dictionaries (`constants/*Styles.ts`):** Layout class combinations, role badges, button tokens, card surfaces, and border configurations.

3. **Sub-Modules and Canonical Pages:**
   - `app/superadmin/page.tsx`: Core portal orchestrator hosting User Accounts management and System Automation Settings.
   - `app/superadmin/facilities/`: Clinical rooms, doctor/nurse cubicles, and physical front-desk registration counters.
   - `app/superadmin/customization/`: Outpatient kiosk services catalog, bilingual Tagalog/English copy, and Boxicon assignments.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change user table text copy, modal headers, or notification copy** | [superadminTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/constants/superadminTexts.ts) |
| **Change user table styles, role pills, modal sizes, or button colors** | [superadminStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/constants/superadminStyles.ts) |
| **Change system settings text copy, timeout descriptions, or lockout labels** | [settingsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/constants/settingsTexts.ts) |
| **Change system settings panel styles, inputs, or card layouts** | [settingsStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/constants/settingsStyles.ts) |
| **Change facilities text copy, room prompts, or counter labels** | [facilitiesTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/facilities/constants/facilitiesTexts.ts) |
| **Change facilities room card styles, cubicle chips, or counter badges** | [facilitiesStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/facilities/constants/facilitiesStyles.ts) |
| **Change kiosk customization text copy, bilingual placeholders, or prompts** | [customizationTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/constants/customizationTexts.ts) |
| **Change kiosk customization form styles, icon dropdown, or table layout** | [customizationStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/constants/customizationStyles.ts) |
| **Change user data fetching, search logic, role filter, or pagination** | [useSuperadminUsers.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/hooks/useSuperadminUsers.ts) |
| **Change user creation/edit form state, desk toggles, or save handlers** | [useUserModalState.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/hooks/useUserModalState.ts) |
| **Change idle timeout duration (default: 20 min) or tracked user activity** | [useIdleTimeout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/hooks/useIdleTimeout.ts) |
| **Change superadmin role authentication guard or redirection** | [useRequireAuth.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/hooks/useRequireAuth.ts) |
| **Change left sidebar navigation groups, route items, or icons** | [superadminNav.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/constants/superadminNav.ts) |
| **Change sidebar layout, active link styles, or status indicator** | [SuperAdminSidebar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/navigation/SuperAdminSidebar.tsx) / [superadminNavStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/constants/superadminNavStyles.ts) |
| **Change top header bar, live Manila clock, breadcrumbs, or theme toggle** | [SuperAdminHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/navigation/SuperAdminHeader.tsx) |
| **Change light/dark theme toggle, appearance tokens, or nav icons** | [SuperAdminHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/navigation/SuperAdminHeader.tsx) / [superadminNavStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/constants/superadminNavStyles.ts) |
| **Change user KPI summary cards (Total Accounts, Clinical, Registration, Admins)** | [UserStatsCards.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/UserStatsCards.tsx) |
| **Change staff accounts table structure, columns, or action buttons** | [UserTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/UserTable.tsx) |
| **Change clinical cubicle assignment selector layout or group categories** | [ClinicalAssignmentsSelector.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/ClinicalAssignmentsSelector.tsx) |
| **Change registration service/room/counter assignment selector** | [RegistrationAssignmentsSelector.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/RegistrationAssignmentsSelector.tsx) |
| **Change add/edit user modal layout or validation workflow** | [UserModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/UserModal.tsx) |
| **Change delete user confirmation modal** | [DeleteUserModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/DeleteUserModal.tsx) |
| **Change auto-rotation, login attempts, or lockout duration settings logic** | [SettingsPanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/SettingsPanel.tsx) |
| **Change change-password security form logic or validation** | [ChangePasswordCard.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/ChangePasswordCard.tsx) |
| **Change rooms and cubicles management panels** | [RoomsPanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/RoomsPanel.tsx) |
| **Change physical registration counters management panel** | [CountersPanel.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/CountersPanel.tsx) |
| **Change TypeScript contracts for user accounts, cubicles, or assignments** | [superadmin.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/types/superadmin.ts) |

---

## 3. Directory Layout

```
app/superadmin/
├── README.md                              # This developer guide
├── layout.tsx                             # Enterprise shell wrapping SuperAdminSidebar & SuperAdminHeader
├── page.tsx                               # Orchestrator: User Accounts & System Settings tabs
├── components/                            # Modular presentation components
│   ├── navigation/                        # Enterprise navigation subsystem
│   │   ├── SuperAdminSidebar.tsx          # Collapsible desktop rail and mobile drawer
│   │   └── SuperAdminHeader.tsx           # Top bar with breadcrumbs, Manila clock, theme toggle
│   ├── ChangePasswordCard.tsx             # Superadmin password change form card
│   ├── ChangePasswordForm.tsx             # Standalone form component
│   ├── ClinicalAssignmentsSelector.tsx    # Cubicle multi-select by clinical category
│   ├── CountersPanel.tsx                  # Registration counter stations editor
│   ├── DeleteUserModal.tsx                # Destructive user deletion prompt
│   ├── RegistrationAssignmentsSelector.tsx # Service, room, and counter scope toggles
│   ├── RoomsPanel.tsx                     # Consultation rooms and cubicles editor
│   ├── SettingsPanel.tsx                  # Queue timeout and security parameters panel
│   ├── SettingsPannel.tsx                 # Backward-compatibility proxy for SettingsPanel
│   ├── SuperAdminNav.tsx                  # Legacy navigation proxy (kept for compatibility)
│   ├── UserModal.tsx                      # Add/Edit staff account modal dialog
│   ├── UserStatsCards.tsx                 # 4-card executive KPI summary
│   └── UserTable.tsx                      # Searchable, filterable staff accounts table
├── constants/                             # Scoped dictionaries
│   ├── settingsStyles.ts                  # Settings panel class tokens
│   ├── settingsTexts.ts                   # Settings copy and validation messages
│   ├── superadminNav.ts                   # Enterprise navigation route hierarchy & groups
│   ├── superadminNavStyles.ts             # Sidebar, drawer, and header style tokens
│   ├── superadminStyles.ts                # Main layout, table, and modal class tokens
│   └── superadminTexts.ts                 # Main UI text copy and table labels
├── customization/                         # Outpatient kiosk services management
│   ├── page.tsx                           # Kiosk services catalog and editor
│   └── constants/
│       ├── customizationStyles.ts         # Service editor and icon picker styles
│       └── customizationTexts.ts          # Bilingual copy and validation messages
├── facilities/                            # Consultation rooms and registration counters
│   ├── page.tsx                           # Tabbed facilities administration page
│   └── constants/
│       ├── facilitiesStyles.ts            # Facility card and cubicle chip styles
│       └── facilitiesTexts.ts             # Room and counter labels and messages
├── hooks/                                 # Custom controller hooks
│   ├── useIdleTimeout.ts                  # 20-minute inactivity session expiration
│   ├── useRequireAuth.ts                  # Guard validating active session
│   ├── useSuperadminUsers.ts              # User list retrieval, filtering, pagination
│   └── useUserModalState.ts               # Modal form state, access options, submission
├── lib/                                   # Domain API utilities
│   └── adminApi.ts                        # Authenticated fetch wrapper for superadmin API
└── types/                                 # Type definitions
    └── superadmin.ts                      # Contracts for users, cubicles, access options
```

---

## 4. Role & Assignment Security Reference

The SuperAdmin portal governs account permissions across the following role domains:

1. **Superadmin (`superadmin`):**
   - Full access to account creation, facility management, kiosk customization, and global timeout settings.
2. **Administrator (`admin`):**
   - Operational management, queue reporting, and live analytics oversight.
3. **Doctor (`doctor`) & Nurse (`nurse`):**
   - Clinical staff assigned to specific consultation or screening cubicles (`cubicleIds`).
   - Only authorized to call and serve tickets within their assigned physical rooms.
4. **Registration Officer (`registration`):**
   - Front-desk intake staff assigned to specific kiosk services, consultation rooms, and physical counter stations (`counters: 1-5`).
