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
   - Backgrounds use a solid neutral foundation (`bg-slate-50 dark:bg-[#0d0d0d]`).
   - Cards, tables, and modal dialogs utilize solid surface tokens (`bg-white dark:bg-[#1a1a1a]`) with crisp solid borders (`border-slate-200 dark:border-[#2e2e2e]`) and subtle elevation shadows (`shadow-xs` / `shadow-sm`).
   - Official Philippine Heart Center red/rose accents (`text-[#a8071a] dark:text-[#f87171]`, `bg-[#a8071a]`, `border-[#a8071a]`) are applied throughout to reflect the hospital brand identity.
   - Centralized theme tokens (`constants/themeTokens.ts`) provide the single source of truth for neutral gray surfaces and sizes across all modules.
   - Blurry glassmorphism, translucent milky opacity, and glowing gradients are eliminated in favor of clean, solid surfaces suitable for hospital administration.
   - Explicit dark styling is applied to native `<option>` tags inside form dropdowns (`themeTokens.surface.selectOption`) to prevent browser unstyled contrast regressions.

3. **Strict Separation of Concerns:**
   - **UI Component Files (`components/`):** Pure rendering and layout assembly. Components never declare hardcoded string copy or ad-hoc style objects.
   - **Text Files (`constants/content.ts`, `constants/dashNavTexts.ts`, `<page>Texts.ts`):** All labels, descriptions, column headers, titles, placeholders, and error messages live in dedicated text files.
   - **Style Dictionaries (`constants/styles.ts`, `constants/dashNavStyles.ts`, `<page>.ts`):** Layout class combinations, metric tones, table styles, card surfaces, and border configurations.

4. **Sub-Modules and Canonical Page Forwarding:**
   - `app/dashboard/page.tsx`: Overview page displaying metrics, queue breakdown, arrival charts, and activity feeds.
   - `app/dashboard/pages/cubicles/`: Real-time cubicle monitoring and consultation tracking.
   - `app/dashboard/pages/patients/`: Patient flow inspection, department distributions, and queue auditing.
   - `app/dashboard/pages/import/`: Graphical drag-and-drop file ingestion interface for PHC workbooks (.xls, .xlsx) and CSV datasets.
   - `app/dashboard/pages/analytics/`: Computational bottleneck forecasting, ARIMA modeling, and Excel export.

5. **Zero-Latency Realtime Streaming & Degraded Polling Fallback:**
   - **Instant In-Memory Updates:** Overview KPI cards, live queue table, ticket status breakdown, and department overview derive updates instantaneously from incoming Supabase Realtime `postgres_changes` payloads (INSERT, UPDATE, DELETE) with zero network delay.
   - **Debounced Server Reconciliation:** Coalesces bursts of incoming database events with a 300ms debounce before executing a background query to synchronize state with PostgreSQL.
   - **30-Second Polling Fallback:** Seamlessly activates a 30-second periodic polling interval when the WebSocket channel drops, errors, or times out, terminating the interval immediately upon reconnection.
   - **Request Sequence Guard & Hysteresis:** Uses `todayFetchIdRef` monotonic request sequencing to discard delayed out-of-order responses, 500ms reconciliation throttle, 2s channel hysteresis, and stabilized dependencies breaking channel teardown loops.
   - **Connection Health Telemetry:** Exposes `isOnline`, `channelStatus`, and `isFullyConnected` to drive the non-intrusive `ConnectionStatusBanner` during network disruptions.

6. **Timeframe Range Selection & Historical Metrics Evaluation:**
   - **Multi-Window Operational Inspection:** Supports one-click filtering across Today, Yesterday, Last 7 Days, and Month-to-Date via [OverviewDateFilter.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/OverviewDateFilter.tsx).
   - **Context-Sensitive KPI Adaptations:** Metric card labels, subtitles, and percentage change indicators adapt dynamically to reflect historical periods ([DashboardMetrics.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/DashboardMetrics.tsx), `METRIC_RANGE_CONFIG`).
   - **Session-Scoped Caching:** Historical queries are cached client-side for 60 seconds to provide 0ms latency when switching between timeframe tabs.
   - **Guaranteed Live Queue Visibility:** While executive metrics evaluate the selected historical range, the Live Queue Table and Recent Activity feed continue streaming today's real-time patient queue.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| **Change centralized theme tokens, neutral dark mode palette (#0d0d0d, #141414, #1a1a1a, #242424, #2e2e2e), or sizing tokens** | [themeTokens.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themeTokens.ts) |
| **Change base dashboard background color or shell wrapper** | [DashboardBg.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/components/backgrounds/DashboardBg.tsx) |
| **Change global semantic surface, muted, line, or shadow tokens** | [globals.css](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/globals.css) / [themes.js](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themes.js) |
| **Change sidebar layout, colors, active highlights, or border styles** | [dashNavStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/dashNavStyles.ts) / [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.sidebar`) |
| **Change sidebar navigation links, route groups, icons, or labels** | [navigation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/navigation.ts) (`DASHBOARD_NAV_GROUPS`) |
| **Change sidebar navigation text copy, brand titles, or category titles** | [dashNavTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/dashNavTexts.ts) |
| **Change left sidebar rail component or mobile drawer behavior** | [DashSideNavigation.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/navigation/DashSideNavigation.tsx) |
| **Change header search box component, dropdown presentation, or palette** | [HeaderSearch.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/components/navigation/HeaderSearch.tsx) |
| **Change header search text copy, placeholders, aria labels, or category headers** | [headerSearchTexts.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/headerSearchTexts.ts) / [content.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/content.ts) |
| **Change header search styles, status badges, dropdown dimensions, or keycaps** | [headerSearchStyles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/headerSearchStyles.ts) / [styles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/styles.ts) |
| **Change header search query debouncing, Supabase lookup, or keyboard shortcuts** | [useHeaderSearch.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/hooks/useHeaderSearch.ts) |
| **Change bottleneck notification dropdown styling, colors, or action handlers** | [NotificationDropdown.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/NotificationDropdown.tsx) |
| **Change overview metric cards, tones, and status colors** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`TONES`, `DASH.metric`) |
| **Change overview card labels, welcome greetings, or activity text** | [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) |
| **Change date filter pill presets, labels, or range descriptions** | [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) (`OVERVIEW_DATE_PRESETS`, `OVERVIEW_DATE_FILTER_TEXTS`) |
| **Change date filter pill bar styling, active colors, or badges** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.dateFilter`) |
| **Change date filter pill bar component markup or behavior** | [OverviewDateFilter.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/OverviewDateFilter.tsx) |
| **Change overview data fetching, sequence guards, or realtime hook logic** | [useOverviewData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/hooks/useOverviewData.ts) / [content.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/content.ts) (`DASHBOARD_REALTIME`) |
| **Change live queue table styling, ticket badges, or table borders** | [styles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/styles.ts) (`DASH.table`) |
| **Change live queue table component or service filter dropdown** | [LiveQueueTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/LiveQueueTable.tsx) |
| **Change hourly arrival chart dimensions, bar radius, or palette colors** | [charts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/charts.ts) |
| **Change historical breakdown text copy, card labels, and table columns** | [historicalTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/historicalTexts.ts) |
| **Change historical breakdown styles, status badges, and table design** | [historicalStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/historicalStyles.ts) |
| **Change historical context banner cards, year pills, or table markup** | [HistoricalContextBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/HistoricalContextBanner.tsx) |
| **Change on-demand historical trigger bar markup or behavior** | [HistoricalContextTrigger.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/HistoricalContextTrigger.tsx) |
| **Change overview data fetching, queue calculations, or Supabase queries** | [useOverviewData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/hooks/useOverviewData.ts) |
| **Change historical summary context provider or Supabase caching** | [HistoricalSummaryContext.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/context/HistoricalSummaryContext.tsx) |
| **Change dashboard skeleton loading styles, dimensions, or animations** | [skeletonStyles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/skeletonStyles.ts) (`DASHBOARD_SKELETON_STYLES`) |
| **Change dashboard skeleton accessibility labels or screen reader text** | [skeletonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/constants/skeletonTexts.ts) (`DASHBOARD_SKELETON_TEXTS`) |
| **Change full-page dashboard overview skeleton layout or assembly** | [DashboardOverviewSkeleton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/DashboardOverviewSkeleton.tsx) |
| **Change individual widget skeleton loaders (metrics, queue, charts)** | [skeletons/](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/components/skeletons/) |
| **Change route-level loading suspense fallback for dashboard** | [loading.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/loading.tsx) |
| **Change cubicles page styles, status colors, and card borders** | [cubicles.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/constants/cubicles.ts) |
| **Change cubicles text copy, headers, and status descriptions** | [cubiclesTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/constants/cubiclesTexts.ts) |
| **Change cubicles pipeline flowchart, speed scales, or idle intervals** | [useCubicleFlowchartData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/hooks/useCubicleFlowchartData.ts) / [cubicles/README.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/cubicles/README.md) |
| **Change patients page styles, table headers, and status colors** | [patients.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patients.ts) |
| **Change patients page text copy, filters, and column titles** | [patientsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patientsTexts.ts) |
| **Change analytics page styles, forecast pills, and modal styling** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change analytics text copy, algorithm labels, and export modal copy** | [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts) |
| **Change excel export modal specification, dropdowns, and date filters** | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx) |
| **Change import page drag-and-drop dropzone, staged files, preview modal, or formats** | [import/README.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/README.md) / [useFileImport.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/hooks/useFileImport.ts) |
| **Change import text copy, format guidelines, and error messages** | [importTexts.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/constants/importTexts.ts) |
| **Change import styles, solid surfaces, and dropzone hover active state** | [importStyles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/constants/importStyles.ts) |
| **Change export page date browser, mode selection, specification preview, or download history** | [export/README.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/README.md) / [useFileExport.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/hooks/useFileExport.ts) |
| **Change export text copy, column descriptions, and compliance formula labels** | [exportTexts.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/constants/exportTexts.ts) |
| **Change export styles, solid surfaces, date chips, and specification cards** | [exportStyles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/constants/exportStyles.ts) |

---

## 3. Directory Layout

```
app/dashboard/
├── README.md                              # This developer guide
├── layout.tsx                             # Enterprise shell wrapping DashSideNavigation & DashboardHeader
├── loading.tsx                            # Route-level loading boundary rendering DashboardOverviewSkeleton
├── page.tsx                               # Canonical overview page
├── components/                            # Presentation subcomponents
│   ├── navigation/                        # Enterprise navigation subsystem
│   │   ├── DashSideNavigation.tsx         # Fixed desktop rail and mobile drawer
│   │   ├── DashboardHeader.tsx            # Sticky top bar with breadcrumbs, Manila clock, theme toggle
│   │   ├── HeaderSearch.tsx               # Shortcut-aware search bar
│   │   └── LiveClock.tsx                  # Manila time display
│   ├── skeletons/                         # Modular skeletal loading subcomponents
│   │   ├── DashboardMetricsSkeleton.tsx   # 4-tile KPI metric cards skeleton
│   │   ├── HourlyArrivalsSkeleton.tsx     # Hourly arrivals bar chart skeleton
│   │   ├── LiveQueueTableSkeleton.tsx     # Live queue table skeleton
│   │   ├── OverviewDateFilterSkeleton.tsx # Date filter pill bar skeleton
│   │   ├── QuickLinksSkeleton.tsx         # Shortcut buttons skeleton
│   │   ├── RecentActivitySkeleton.tsx     # Activity stream skeleton
│   │   ├── ServiceQueueSkeleton.tsx       # Department queue distribution skeleton
│   │   ├── TicketBreakdownSkeleton.tsx    # Ticket status breakdown donut skeleton
│   │   └── WelcomeBannerSkeleton.tsx      # Welcome header banner skeleton
│   ├── DashboardCard.tsx                  # Base solid card wrapper
│   ├── DashboardMetrics.tsx               # 4-column metric summary tiles
│   ├── DashboardOverviewSkeleton.tsx      # Full page overview skeleton orchestrator
│   ├── DonutChart.tsx                     # CSS mask-based donut chart
│   ├── HistoricalContextBanner.tsx        # Redesigned historical intelligence banner & monthly table
│   ├── HistoricalContextTrigger.tsx       # On-demand historical inspection trigger bar
│   ├── HourlyArrivalChart.tsx             # Recharts hourly arrival visualization
│   ├── LiveQueueTable.tsx                 # Live patient ticket table
│   ├── NotificationDropdown.tsx           # Bottleneck alerts dropdown
│   ├── OverviewDateFilter.tsx             # Timeframe date filter pill bar
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
│   ├── headerSearchStyles.ts              # Solid surface tokens, badges, and dropdown styles
│   ├── headerSearchTexts.ts               # User copy, labels, placeholders, and accessibility
│   ├── historicalStyles.ts                # Solid surface tokens for historical breakdown
│   ├── historicalTexts.ts                 # User copy and labels for historical breakdown
│   ├── navigation.ts                      # Route hierarchies & categorized groups
│   ├── skeletonStyles.ts                  # Solid surface tokens for skeleton loaders
│   ├── skeletonTexts.ts                   # ARIA labels and accessibility copy for skeletons
│   └── styles.ts                          # Solid surface class maps (DASH, TONES)
├── context/                               # Context providers (HistoricalSummaryContext)
├── hooks/                                 # Custom hooks (data, theme, idle timeout, header search)
│   ├── useBottleneckNotifications.ts      # Realtime queue bottleneck alerts
│   ├── useDashboardTheme.ts               # Light/dark mode synchronizer
│   ├── useHeaderSearch.ts                 # Real-time search state, debouncing, and shortcuts
│   ├── useIdleTimeout.ts                  # Session security idle countdown
│   ├── useMountedClock.ts                 # Manila time clock ticker
│   └── useOverviewData.ts                 # Live Supabase metrics and queue aggregation
├── pages/                                 # Canonical sub-route implementations
│   ├── analytics/                         # Analytics and forecasting module
│   ├── cubicles/                          # Cubicle monitoring module
│   ├── overview/                          # Overview route forwarding
│   │   ├── loading.tsx                    # Overview route loading boundary
│   │   └── page.tsx                       # Overview route entrypoint
│   └── patients/                          # Patient queue inspection module
├── analytics/                             # Legacy route forwarding
├── cubicles/                              # Legacy route forwarding
└── patients/                              # Legacy route forwarding
```
