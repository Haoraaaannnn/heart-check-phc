# Analytics Dashboard Module Developer Guide: Architecture & Where to Edit

This document serves as the guide for developers maintaining, modifying, or extending the Analytics Dashboard module in `app/dashboard/pages/analytics/`.

It details the module architecture, separation-of-concerns principles, and provides an exhaustive lookup table showing where to make edits for any visual, textual, layout, logic, or export changes.

---

## 1. Architectural Principles

The Analytics module adheres strictly to the repository separation-of-concerns rules:

1. **Presentation Components (`components/`):**
   - Pure UI rendering and structure.
   - Zero hardcoded text copy, titles, or messages.
   - Zero raw styling objects or hardcoded ad-hoc styles.
   - Consume text copy from dedicated [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts).
   - Consume styling objects and tokens from [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts).

2. **Text Dictionaries (`constants/analyticsTexts.ts`):**
   - Centralize all titles, subtitles, card headers, table headers, empty states, and modal labels as typed constants.
   - Plain-text formatting without emojis.

3. **Style & Token Dictionaries (`constants/analytics.ts`):**
   - Centralize all layout style maps (`ANALYTICS_STYLES`), semantic level colors, chart color palettes (`STAGE_LINES`), polling intervals (`POLL_INTERVAL_MS`), and modal style tokens (`exportModal`).

4. **Interactive Hooks & Data Fetching (`hooks/`):**
   - `useAnalyticsData.ts`: Manages analytics queries, polling intervals, cache staleness thresholds, and date range switches.
   - `useDailyDrilldown.ts`: Manages single-day drill-down queries, 10-second timeout handling, local caching, and date selection state for granular hourly patterns and bottleneck breakdowns.

5. **Reporting & Workbook Export:**
   - [ExportExcelButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelButton.tsx): Action trigger button.
   - [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx): Export dialog supporting specific date, all dates, and month/year selection modes for PHC Time and Motion Analysis workbooks. Queries `/api/available-export-dates` to dynamically display available recorded dates, months, and years with actual recorded queue data.
   - Backend endpoints `/api/export-excel` and `/api/available-export-dates` in `python_backend/main.py`, with workbook generation engine in `python_backend/analytics/export.py`.

6. **Interactive Chart Drill-Down:**
   - [VolumeAndWaitCharts.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/VolumeAndWaitCharts.tsx): Daily volume, hourly distribution, and stage wait time charts. Allows clicking any date or bar on the timeline to instantly trigger daily drill-down.
   - [DailyDrillDownDetail.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/DailyDrillDownDetail.tsx): Dedicated daily inspection panel rendering KPIs (patients seen, average total journey time, peak arrival window, primary bottleneck) and stage-by-stage bottleneck breakdown table for the selected date.
   - Backend endpoint `/api/daily-drilldown` in `python_backend/main.py`.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change page titles, table headers, card subtitles, or empty messages** | [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts) |
| **Change daily drill-down labels, badge texts, reset buttons, or KPI titles** | [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts) |
| **Change Excel export modal titles, mode labels, notices, or confirmation text** | [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts) |
| **Change visual styling, card layouts, table classes, or badge tokens** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change daily drill-down card styles, KPI cards, hint banners, or active bar colors** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change Excel export modal styles, backdrops, date inputs, mode tabs, or button designs** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change date range preset durations, polling intervals, or cache timeouts** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change date range filter pills, dynamic historical years rendering, or year fetch** | [DateRangeSelector.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/DateRangeSelector.tsx) |
| **Change Excel export modal logic, date mode selection, availability filtering, or download trigger** | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx) |
| **Change Excel export trigger button appearance or modal invocation** | [ExportExcelButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelButton.tsx) |
| **Change header banner layout, title presentation, import button, or action alignment** | [AnalyticsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/AnalyticsHeader.tsx) |
| **Change analytics data fetching, polling, or range state management** | [useAnalyticsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/hooks/useAnalyticsData.ts) |
| **Change daily drill-down state, caching, timeout, or single-day fetch logic** | [useDailyDrilldown.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/hooks/useDailyDrilldown.ts) |
| **Change bottleneck stage analysis table presentation or severity mapping** | [BottleneckStageTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/BottleneckStageTable.tsx) |
| **Change daily volume, hourly pattern, stage wait charts, or drill-down click triggers** | [VolumeAndWaitCharts.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/VolumeAndWaitCharts.tsx) |
| **Change daily drill-down detail panel layout, KPI cards, or single-day stage table** | [DailyDrillDownDetail.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/DailyDrillDownDetail.tsx) |
| **Change PHC compliance summary cards or threshold breakdown** | [PHCComplianceSummary.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/PHCComplianceSummary.tsx) |
| **Change linear regression (LR) or ARIMA forecast presentations** | [LRForecast.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/LRForecast.tsx) / [ArimaForecast.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ArimaForecast.tsx) |
| **Change Python backend single-day drill-down calculation or caching** | `python_backend/main.py` (`/api/daily-drilldown`) |
| **Change Python backend export filtering, date bounds, or sheets structure** | `python_backend/main.py` / `python_backend/analytics/export.py` |
| **Change available export dates caching or discovery query** | `python_backend/main.py` (`/api/available-export-dates`) |

---

## 3. Component Breakdown

### Header Banner
- **Component:** [AnalyticsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/AnalyticsHeader.tsx)
- **Role:** Displays page title, subtitle, date range pills, live refreshing indicator, and the Export to Excel trigger button.

### Export to Excel Modal & Trigger
- **Trigger Component:** [ExportExcelButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelButton.tsx)
- **Modal Component:** [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx)
- **Role:** Allows administrative users to pick a specific single date, all recorded dates, or a calendar month/year and clinical department to generate and download a compliant PHC Time and Motion Analysis multi-sheet workbook (.xlsx). Dynamically limits selectable years, months, and dates strictly to recorded patient data.

### Metric Cards Grid
- **Component:** [AnalyticsMetricCards.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/AnalyticsMetricCards.tsx)
- **Role:** Displays system bottleneck status, average patient journey time, next-day volume predictions, and target clinical staffing.

### Bottleneck Analysis Table
- **Component:** [BottleneckStageTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/BottleneckStageTable.tsx)
- **Role:** Tabulates average elapsed times, total patient volume, bottleneck severity rating, and system recommendations per operational queue step across the selected range.

### Volume and Wait Time Charts with Interactive Drill-Down
- **Component:** [VolumeAndWaitCharts.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/VolumeAndWaitCharts.tsx)
- **Drill-Down Component:** [DailyDrillDownDetail.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/DailyDrillDownDetail.tsx)
- **Hook:** [useDailyDrilldown.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/hooks/useDailyDrilldown.ts)
- **Role:**
  - Renders daily volume bars with 7-day trailing moving average, hourly arrival curves, and stage-by-stage wait time trends.
  - Clicking on any date or bar in the Daily Volume Chart, or clicking any date on the Stage Wait Time Trends timeline, triggers interactive drill-down.
  - Automatically loads that day's granular hourly distribution curve into the adjacent chart alongside the range average benchmark.
  - Renders the Daily Drill-Down Detail panel with total patients, average total journey time, peak arrival hour, primary bottleneck step, and the full 5-stage bottleneck severity table for that specific date.
  - Provides a single-click "Reset to Overall Range" action to clear the drill-down and restore standard range analysis.


