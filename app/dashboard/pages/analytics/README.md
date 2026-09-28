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

5. **Reporting & Workbook Export:**
   - [ExportExcelButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelButton.tsx): Action trigger button.
   - [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx): Month, year, and service selection dialog for exporting PHC Time and Motion Analysis workbooks. Queries `/api/available-export-dates` to dynamically display only years and months with actual recorded queue data.
   - Backend endpoints `/api/export-excel` and `/api/available-export-dates` in `python_backend/main.py`, with workbook generation engine in `python_backend/analytics/export.py`.

---

## 2. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change page titles, table headers, card subtitles, or empty messages** | [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts) |
| **Change Excel export modal titles, month labels, or confirmation text** | [analyticsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analyticsTexts.ts) |
| **Change visual styling, card layouts, table classes, or badge tokens** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change Excel export modal styles, backdrops, month grid, or button designs** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change date range preset durations, polling intervals, or cache timeouts** | [analytics.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/constants/analytics.ts) |
| **Change Excel export modal logic, date availability filtering, or download trigger** | [ExportExcelModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelModal.tsx) |
| **Change Excel export trigger button appearance or modal invocation** | [ExportExcelButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ExportExcelButton.tsx) |
| **Change header banner layout, title presentation, or action alignment** | [AnalyticsHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/AnalyticsHeader.tsx) |
| **Change analytics data fetching, polling, or range state management** | [useAnalyticsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/hooks/useAnalyticsData.ts) |
| **Change bottleneck stage analysis table presentation or severity mapping** | [BottleneckStageTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/BottleneckStageTable.tsx) |
| **Change daily volume or hourly pattern charts** | [VolumeAndWaitCharts.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/VolumeAndWaitCharts.tsx) |
| **Change PHC compliance summary cards or threshold breakdown** | [PHCComplianceSummary.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/PHCComplianceSummary.tsx) |
| **Change linear regression (LR) or ARIMA forecast presentations** | [LRForecast.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/LRForecast.tsx) / [ArimaForecast.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/ArimaForecast.tsx) |
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
- **Role:** Allows administrative users to pick a specific calendar month, year, and clinical department to generate and download a compliant PHC Time and Motion Analysis multi-sheet workbook (.xlsx). Dynamically limits selectable years and months strictly to recorded patient data.

### Metric Cards Grid
- **Component:** [AnalyticsMetricCards.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/AnalyticsMetricCards.tsx)
- **Role:** Displays system bottleneck status, average patient journey time, next-day volume predictions, and target clinical staffing.

### Bottleneck Analysis Table
- **Component:** [BottleneckStageTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/components/BottleneckStageTable.tsx)
- **Role:** Tabulates average elapsed times, total patient volume, bottleneck severity rating, and system recommendations per operational queue step.

