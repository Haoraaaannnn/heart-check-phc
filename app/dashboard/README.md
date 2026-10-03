# Admin Dashboard Domain Developer Guide: Architecture & Where to Edit

This document serves as the authoritative developer guide for maintaining, extending, and modifying the Admin Dashboard module in `app/dashboard/`.

It details the module architecture, enterprise navigation structure, solid surface design standard, separation-of-concerns principles, and provides an exhaustive lookup table showing where to make edits for any visual, textual, layout, logic, or navigational changes.

---

## 1. Architectural Principles & Enterprise Design Standard

The Admin Dashboard subsystem adheres strictly to the architectural standards defined in `AGENTS.md`:

1. **Enterprise Navigation Structure:**
   - **Fixed Desktop Left-Rail Sidebar:** Fixed `w-64` left-rail sidebar ([DashSideNavigation.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/DashSideNavigation.tsx)) running full viewport height with categorized navigation groups:
     - Overview & Monitoring
     - Queue Operations
     - Clinical Services
     - Intelligence & Reports
   - **Responsive Mobile Drawer:** Mobile slide-over drawer triggered via the top header hamburger button, providing complete navigation access on mobile viewports with an automatic close handler on navigation.
   - **Sticky Top Header Bar:** Clean `h-16` bar ([DashboardHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/DashboardHeader.tsx)) featuring dynamic breadcrumbs, live Philippine Standard Time ([LiveClock.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/LiveClock.tsx)), single-click light/dark theme toggle, bottleneck alerts dropdown ([NotificationDropdown.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/NotificationDropdown.tsx)), real authenticated user profile chip, and direct session sign-out.
   - **Role-Guarded Session Validation:** Automatic session check validating active user credentials on layout initialization with an animated verification spinner.

2. **Solid Surfaces for Clinical Ergonomics:**
   - Backgrounds use a solid neutral foundation (`bg-slate-50 dark:bg-slate-950`).
   - Cards, tables, and modal dialogs utilize solid surface tokens (`bg-white dark:bg-slate-900`) with crisp solid borders (`border-slate-200 dark:border-slate-800`) and subtle elevation shadows (`shadow-xs` / `shadow-sm`).
   - Official Philippine Heart Center red/rose accents (`text-rose-600`, `bg-rose-600`, `border-rose-500`) are applied throughout to reflect the hospital brand identity.
   - Blurry glassmorphism, translucent milky opacity, and glowing gradients are eliminated in favor of clean, solid surfaces suitable for hospital administration.
   - Explicit dark styling is applied to native `<option>` tags inside form dropdowns to prevent browser unstyled contrast regressions.

3. **Strict Separation of Concerns:**
   - **UI Component Files (`components/`):** Pure rendering and layout assembly. Components never declare hardcoded string copy or ad-hoc style objects.
   - **Text Files (`constants/content.ts`, `constants/dashNavTexts.ts`, `<page>Texts.ts`):** All labels, descriptions, column headers, titles, placeholders, and error messages live in dedicated text files.
   - **Style Dictionaries (`constants/styles.ts`, `constants/dashNavStyles.ts`, `<page>.ts`):** Layout class combinations, metric tones, table styles, card surfaces, and border configurations.

4. **Sub-Modules and Canonical Page Forwarding:**
   - `app/dashboard/page.tsx`: Overview page displaying metrics, queue breakdown, arrival charts, and activity feeds.
   - `app/dashboard/pages/cubicles/`: Real-time cubicle monitoring and consultation tracking.
   - `app/dashboard/pages/patients/`: Patient flow inspection, department distributions, and queue auditing.
   - `app/dashboard/pages/analytics/`: Computational bottleneck forecasting, ARIMA modeling, and Excel export.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change base dashboard background color or shell wrapper** | [DashboardBg.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/components/backgrounds/DashboardBg.tsx) |
| **Change global semantic surface, muted, line, or shadow tokens** | [globals.css](file:///home/jensen/Github-Repositories/heart-check-phc/app/globals.css) / [themes.js](file:///home/jensen/Github-Repositories/heart-check-phc/constants/themes.js) |
| **Change sidebar layout, colors, active highlights, or border styles** | [dashNavStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/dashNavStyles.ts) / [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.sidebar`) |
| **Change sidebar navigation links, route groups, icons, or labels** | [navigation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/navigation.ts) (`DASHBOARD_NAV_GROUPS`) |
| **Change sidebar navigation text copy, brand titles, or category titles** | [dashNavTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/dashNavTexts.ts) |
| **Change left sidebar rail component or mobile drawer behavior** | [DashSideNavigation.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/DashSideNavigation.tsx) |
| **Change top header bar, dynamic breadcrumbs, user chip, or sign-out** | [DashboardHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/DashboardHeader.tsx) |
| **Change header search box placeholder, shortcut, or input behavior** | [HeaderSearch.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/HeaderSearch.tsx) / [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) |
| **Change live Manila clock format or second tick interval** | [LiveClock.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/LiveClock.tsx) / [formatDateTime.ts](file:///home/jensen/Github-Repositories/heart-check-phc/utils/formatDateTime.ts) |
| **Change bottleneck notification dropdown styling, colors, or action handlers** | [NotificationDropdown.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/NotificationDropdown.tsx) |
| **Change overview metric cards, tones, and status colors** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`TONES`, `DASH.metric`) |
| **Change overview card labels, welcome greetings, or activity text** | [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) |
| **Change live queue table styling, ticket badges, or table borders** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.table`) |
| **Change live queue table component or service filter dropdown** | [LiveQueueTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/LiveQueueTable.tsx) |
| **Change hourly arrival chart dimensions, bar radius, or palette colors** | [charts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/charts.ts) |
| **Change historical context banner cards, borders, or loading styles** | [HistoricalContextBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/HistoricalContextBanner.tsx) |
| **Change overview data fetching, queue calculations, or Supabase queries** | [useOverviewData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/hooks/useOverviewData.ts) |
| **Change historical summary context provider or Supabase caching** | [HistoricalSummaryContext.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/context/HistoricalSummaryContext.tsx) |
| **Change cubicles page styles, status colors, and card borders** | [cubicles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/constants/cubicles.ts) |
| **Change cubicles text copy, headers, and status descriptions** | [cubiclesTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/constants/cubiclesTexts.ts) |
| **Change patients page styles, table headers, and status colors** | [patients.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patients.ts) |
| **Change patients page text copy, filters, and column titles** | [patientsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patientsTexts.ts) |
| **Change analytics page styles, forecast pills, and modal styling** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change analytics text copy, algorithm labels, and export modal copy** | [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts) |
| **Change excel export modal specification, dropdowns, and date filters** | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx) |

---

## 3. Directory Layout

```
app/dashboard/
├── README.md                              # This developer guide
├── layout.tsx                             # Enterprise shell wrapping DashSideNavigation & DashboardHeader
├── page.tsx                               # Canonical overview page
├── components/                            # Presentation subcomponents
│   ├── navigation/                        # Enterprise navigation subsystem
│   │   ├── DashSideNavigation.tsx         # Fixed desktop rail and mobile drawer
│   │   ├── DashboardHeader.tsx            # Sticky top bar with breadcrumbs, Manila clock, theme toggle
│   │   ├── HeaderSearch.tsx               # Shortcut-aware search bar
│   │   └── LiveClock.tsx                  # Manila time display
│   ├── DashboardCard.tsx                  # Base solid card wrapper
│   ├── DashboardMetrics.tsx               # 4-column metric summary tiles
│   ├── DonutChart.tsx                     # CSS mask-based donut chart
│   ├── HistoricalContextBanner.tsx        # Zero-activity historical fallback panel
│   ├── HourlyArrivalChart.tsx             # Recharts hourly arrival visualization
│   ├── LiveQueueTable.tsx                 # Live patient ticket table
│   ├── NotificationDropdown.tsx           # Bottleneck alerts dropdown
│   ├── QuickLinks.tsx                     # Action shortcut links
│   ├── RecentActivity.tsx                 # Real-time ticket updates feed
│   ├── ServiceQueueOverview.tsx           # Breakdown by department
│   ├── ServiceStats.tsx                   # Service status metrics
│   ├── StatusBadge.tsx                    # Ticket status pill badge
│   ├── TicketStatusBreakdown.tsx          # Breakdown by ticket status
│   └── WelcomeBanner.tsx                  # Solid header greeting banner
├── constants/                             # Centralized dictionaries
│   ├── charts.ts                          # Dimensions and chart color palettes
│   ├── content.ts                         # Text copy, titles, and metric keys
│   ├── dashNav.ts                         # Navigation contracts
│   ├── dashNavStyles.ts                   # Sidebar, drawer, and header style tokens
│   ├── dashNavTexts.ts                    # Navigation copy, brand labels, and breadcrumbs
│   ├── navigation.ts                      # Route hierarchies & categorized groups
│   └── styles.ts                          # Solid surface class maps (DASH, TONES)
├── context/                               # Context providers (HistoricalSummaryContext)
├── hooks/                                 # Custom hooks (data, theme, idle timeout)
├── pages/                                 # Canonical sub-route implementations
│   ├── analytics/                         # Analytics and forecasting module
│   ├── cubicles/                          # Cubicle monitoring module
│   ├── overview/                          # Overview route forwarding
│   └── patients/                          # Patient queue inspection module
├── analytics/                             # Legacy route forwarding
├── cubicles/                              # Legacy route forwarding
└── patients/                              # Legacy route forwarding
```
