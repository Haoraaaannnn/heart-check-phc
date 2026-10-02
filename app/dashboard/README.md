# Admin Dashboard Domain Developer Guide: Architecture & Where to Edit

This document serves as the guide for developers maintaining, modifying, or extending the Admin Dashboard module in `app/dashboard/`.

It details the module architecture, solid background design standard, separation-of-concerns principles, and provides an exhaustive lookup table showing where to make edits for any visual, textual, layout, logic, or navigational changes.

---

## 1. Architectural Principles & Solid Background Design Standard

The Admin Dashboard adheres strictly to the architectural standards defined in `AGENTS.md`:

1. **Solid Backgrounds for Professional Visual Excellence:**
   - The shell wrapper in [DashboardBg.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/components/backgrounds/DashboardBg.tsx) provides a solid neutral background (`bg-slate-50 dark:bg-slate-950`).
   - Cards, panels, headers, and sidebars utilize solid surface tokens (`--surface: #ffffff` light, `#111827` dark) with crisp solid borders (`--line: #e2e8f0` light, `#374151` dark) and subtle elevation shadows (`--card-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05)`).
   - Glassmorphism, translucent milky opacity (`rgb(255 255 255 / 0.78)`), blurry glowing gradients, and backdrop blur filters (`backdrop-blur-xl`, `backdrop-blur-md`) are replaced with high-contrast, clean, solid surfaces suitable for enterprise clinical administration.

2. **Strict Separation of Concerns:**
   - **UI Component Files (`components/`):** Pure rendering and layout assembly. No raw styling objects, inline color strings, or hardcoded text copy.
   - **Text Files (`constants/content.ts`, `<page>Texts.ts`):** All labels, descriptions, column headers, titles, and empty states.
   - **Style Dictionaries (`constants/styles.ts`, `<page>.ts`):** Layout class combinations, metric tones, table styles, card surfaces, and border configurations.

3. **Sub-Modules and Canonical Page Forwarding:**
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
| **Change dashboard header styles, search input, clock, or brand bar** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.header`) |
| **Change sidebar layout, colors, active highlights, or border styles** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.sidebar`) |
| **Change sidebar navigation links, route groups, icons, or labels** | [navigation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/navigation.ts) |
| **Change overview metric cards, tones, and status colors** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`TONES`, `DASH.metric`) |
| **Change overview card labels, welcome greetings, or activity text** | [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) |
| **Change live queue table styling, ticket badges, or table borders** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.table`) |
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

---

## 3. Directory Layout

```
app/dashboard/
├── components/                  # Presentation subcomponents
│   ├── navigation/              # Header, Sidebar, LiveClock, HeaderSearch
│   ├── DashboardCard.tsx        # Base solid card wrapper
│   ├── DashboardMetrics.tsx     # 4-column metric summary tiles
│   ├── DonutChart.tsx           # CSS mask-based donut chart
│   ├── HistoricalContextBanner  # Zero-activity historical fallback panel
│   ├── HourlyArrivalChart.tsx   # Recharts hourly arrival visualization
│   ├── LiveQueueTable.tsx       # Live patient ticket table
│   ├── NotificationDropdown.tsx # Bottleneck alerts dropdown
│   ├── QuickLinks.tsx           # Action shortcut links
│   ├── RecentActivity.tsx       # Real-time ticket updates feed
│   ├── ServiceQueueOverview.tsx # Breakdown by department
│   ├── TicketStatusBreakdown    # Breakdown by ticket status
│   └── WelcomeBanner.tsx        # Solid header greeting banner
├── constants/                   # Centralized dictionaries
│   ├── charts.ts                # Dimensions and chart color palettes
│   ├── content.ts               # Text copy, titles, and metric keys
│   ├── navigation.ts            # Sidebar routes and item hierarchies
│   └── styles.ts                # Solid class maps (DASH, TONES)
├── context/                     # Context providers (HistoricalSummaryContext)
├── hooks/                       # Custom hooks (data, theme, idle timeout)
├── layout.tsx                   # Dashboard shell wrapping DashboardBg
├── page.tsx                     # Canonical overview page
├── pages/                       # Canonical sub-route implementations
│   ├── analytics/               # Analytics and forecasting module
│   ├── cubicles/                # Cubicle monitoring module
│   ├── overview/                # Overview route forwarding
│   └── patients/                # Patient queue inspection module
└── README.md                    # Developer guide
```
