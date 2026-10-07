# Export Data Sub-Module Developer Guide: Architecture & Where to Edit

This document is the authoritative developer guide for maintaining, extending, and configuring the Export Data sub-module located in `app/dashboard/pages/export/`.

---

## 1. Architectural Purpose and Overview

The Export Data sub-module provides an independent, full-screen clinical workstation for generating and downloading official Philippine Heart Center (PHC) Time and Motion Analysis Excel workbooks (`.xlsx`) and patient queue records (`.csv`).

### Key Capabilities
1. **Interactive Date Availability Querying:** Dynamically fetches recorded calendar years, active months, and distinct clinic days (`/api/available-export-dates`) from the PostgreSQL database, preventing empty or invalid export requests.
2. **Tri-Mode Timeframe Filtering:**
   - **Single Clinic Day:** Exports an authoritative single-day worksheet with patient queue timestamps and bottom compliance calculations.
   - **Calendar Month:** Generates a multi-sheet workbook containing one tab per recorded clinic day in that month.
   - **Rolling Range & Master Archive:** Exports rolling timeframes (90 days, 180 days, 365 days) or the complete historical dataset (`range=all`).
3. **Clinical Department Filtering:** Filters rows by specific clinic service (`Consultation`, `OPD Screening`, `ECG`, `Warfarin`, `OPD Card`, `Refill Prescription`, `OPD Reschedule`, `Benzathine`) or all services (`all`).
4. **Authoritative 10-Column Data Architecture:** Columns A through E capture raw queue milestones (`reg_start`, `reg_end`, `consult_start`, `consult_end`, `carryout_end`), while Columns F through J calculate elapsed waiting and treatment durations.
5. **Hospital Compliance Summary Calculations:** Reproduces the hospital's official 4-row bottom summary block evaluating waiting time (`<= 2.5 hrs`), triage evaluation (`<= 30 mins`), doctor consultation (`<= 1.45 hrs`), and orders processing (`<= 15 mins`).
6. **Session Downloads Tracking:** Retains generated workbooks within session state for rapid re-download without initiating repeated server queries.

---

## 2. Directory and File Structure

```
app/dashboard/pages/export/
├── README.md                                 # This developer editing guide
├── page.tsx                                  # Root canonical page assembly
├── components/
│   ├── ExportDateBrowser.tsx                 # Interactive date, month, and range browser
│   ├── ExportFormatGuide.tsx                 # Documentation card for hospital workbook layout
│   ├── ExportHeader.tsx                      # Top header with breadcrumbs and navigation links
│   ├── ExportHistoryList.tsx                 # Session downloads table and re-download actions
│   ├── ExportOptionsBar.tsx                  # Mode, clinical department, and format toolbar
│   ├── ExportPreviewCard.tsx                 # Detailed specification preview and download trigger
│   ├── ExportResultsBanner.tsx               # Post-download telemetry confirmation banner
│   └── ExportTelemetryCards.tsx              # Dataset KPI summary statistics cards
├── constants/
│   ├── export.ts                             # Config constants, service options, column metadata
│   ├── exportStyles.ts                       # High-contrast solid surfaces and Tailwind classes
│   └── exportTexts.ts                        # Centralized text copy, instructions, and error strings
├── hooks/
│   └── useFileExport.ts                      # React hook managing dates polling, filters, and streaming
└── types/
    └── exportTypes.ts                        # TypeScript interfaces for modes, options, and history
```

---

## 3. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| --- | --- |
| **Change text copy, instructions, labels, formula descriptions, or error messages** | [exportTexts.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/constants/exportTexts.ts) |
| **Change visual styles, solid surfaces, border colors, button themes, or active chips** | [exportStyles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/constants/exportStyles.ts) |
| **Change clinical service options, date modes, rolling ranges, or column specifications** | [export.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/constants/export.ts) |
| **Change date polling logic, export fetch parameters, AbortController timeouts, or history caching** | [useFileExport.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/hooks/useFileExport.ts) |
| **Change top header banner, navigation links, or cache refresh button** | [ExportHeader.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportHeader.tsx) |
| **Change dataset KPI telemetry summary cards** | [ExportTelemetryCards.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportTelemetryCards.tsx) |
| **Change mode selection tabs, service dropdown, or format radio cards** | [ExportOptionsBar.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportOptionsBar.tsx) |
| **Change date chip grid, month cards, or date search filter** | [ExportDateBrowser.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportDateBrowser.tsx) |
| **Change workbook specification preview, column list, compliance block, or download button** | [ExportPreviewCard.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportPreviewCard.tsx) |
| **Change session downloads history table columns, re-download trigger, or status badges** | [ExportHistoryList.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportHistoryList.tsx) |
| **Change post-download confirmation banner, metrics display, or deep-link buttons** | [ExportResultsBanner.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportResultsBanner.tsx) |
| **Change hospital standards explanation or guideline sections** | [ExportFormatGuide.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/export/components/ExportFormatGuide.tsx) |
| **Change openpyxl workbook generator, cell merges, styles, or formulas on backend** | [export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py) |
| **Change FastAPI `/api/export-excel` or `/api/available-export-dates` routes** | [main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py) |
| **Change sidebar navigation link, route definition, or active link matching** | [navigation.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/navigation.ts) / [DashSideNavigation.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/components/navigation/DashSideNavigation.tsx) |
| **Change top header breadcrumbs for Export Data** | [DashboardHeader.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/components/navigation/DashboardHeader.tsx) / [dashNavTexts.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/dashNavTexts.ts) |

---

## 4. Hospital Workbook Architecture Specification

```
[PHILIPPINE HEART CENTER - OUT-PATIENT DIVISION - TIME AND MOTION ANALYSIS]
---------------------------------------------------------------------------------------------------------
Col A: Queuing Time (reg_start)
Col B: Initial Assessment (reg_end)
Col C: Doctor Seen (consult_start)
Col D: Doctor Completed (consult_end)
Col E: Carry Out Completed (carryout_end)
Col F: Queuing Time to Initial Assessment (reg_end - reg_start)
Col G: Initial Assessment to Doctor Seen (consult_start - reg_end)
Col H: Doctor Seen to Doctor Completed (consult_end - consult_start)
Col I: Doctor Completed to Carry Out Completed (carryout_end - consult_end)
Col J: Total Waiting Time (carryout_end - reg_start)
---------------------------------------------------------------------------------------------------------
[Bottom 4-Row Compliance Summary Block]
Row 1: Waiting Time <= 2.5 hrs. = [COUNT]  |  Waiting Time > 2.5 hrs. = [COUNT]  |  Avg Waiting Time = [HH:MM:SS]
Row 2: Evaluate <= 30 mins.     = [COUNT]  |  Evaluate > 30 mins.     = [COUNT]  |  Patients Seen    = [TOTAL]
Row 3: Examine <= 1.45 hrs.     = [COUNT]  |  Examine > 1.45 hrs.     = [COUNT]  |  Doctors on Duty  = [1]
Row 4: Carry Out <= 15 mins.    = [COUNT]  |  Carry Out > 15 mins.    = [COUNT]  |  Patient/Doc/Hour = [RATIO]
```
