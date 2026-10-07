# Import Data Sub-Module Developer Guide: Architecture & Where to Edit

This document is the authoritative developer guide for maintaining, extending, and configuring the Import Data sub-module located in `app/dashboard/pages/import/`.

---

## 1. Architectural Purpose and Overview

The Import Data sub-module provides a web-based graphical interface for ingesting patient records and time study datasets directly into the PostgreSQL database without manual terminal command execution or hardcoding file paths in Python scripts.

### Key Capabilities
1. **Interactive Drag-and-Drop Dropzone:** Accessible drop target supporting drag events, file picking, and format detection (`.xls`, `.xlsx`, `.csv`).
2. **Dual Dataset Format Support:**
   - **PHC Time and Motion Analysis Workbooks (.xls, .xlsx):** Multi-sheet daily hospital time study files. Parses `Date:` cells, locates `Hospital` column indices, converts afternoon clinic hours (1:00 PM - 7:00 PM) to 24-hour UTC timestamps, and extracts queuing, initial assessment, doctor consultation, and carry-out milestones.
   - **Standard Patient Datasets (.csv, .xlsx):** Tabular queue records mapping `patientNum`, `service`, `status`, `created_at`, `reg_start`, `reg_end`, `consult_start`, `consult_end`, `carryout_start`, `carryout_end`, and `cubicleNum`.
3. **In-Memory Schema Inspection:** Dry-run inspection (`mode=inspect`) parses the file on the server and returns a preview of extracted rows, valid counts, and dropped records without modifying the database.
4. **Research Immutability Guard:** Allows tagging records with `is_historical = true` to preserve historical research datasets against operational mutation.
5. **Secure Batch Insertion & Cache Invalidation:** Uses backend service-role authorization for chunked inserts (`default: 500 rows/batch`) and automatically invalidates analytical caches (`_years_cache`, `_export_dates_cache`, `_monthly_cache`) upon completion.

---

## 2. Directory and File Structure

```
app/dashboard/pages/import/
├── README.md                                 # This developer editing guide
├── page.tsx                                  # Root canonical page assembly
├── components/
│   ├── FileDropzone.tsx                      # Drag-and-drop file target area
│   ├── FilePreviewModal.tsx                  # Schema inspection and sample rows dialog
│   ├── ImportFormatGuide.tsx                 # Documentation card for supported formats
│   ├── ImportHeader.tsx                      # Header banner with breadcrumbs and links
│   ├── ImportOptionsBar.tsx                  # Ingestion options (service, historical, batch)
│   ├── ImportResultsBanner.tsx               # Post-import completion telemetry banner
│   └── StagedFileList.tsx                    # Queue table of staged files and actions
├── constants/
│   ├── import.ts                             # Config constants, service options, size limits
│   ├── importStyles.ts                       # Solid surfaces, dropzone states, Tailwind classes
│   └── importTexts.ts                        # Centralized text copy, instructions, error strings
├── hooks/
│   └── useFileImport.ts                      # Hook managing drag-drop, inspection, and ingestion
└── types/
    └── importTypes.ts                        # TypeScript interfaces for files, previews, options
```

---

## 3. "Where to Edit" Quick Reference Matrix

| Goal / Intended Change | Where to Edit |
| --- | --- |
| **Change text copy, instructions, dropzone hints, error messages, or column titles** | [importTexts.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/constants/importTexts.ts) |
| **Change visual styles, solid surfaces, border colors, dropzone hover highlights, or button themes** | [importStyles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/constants/importStyles.ts) |
| **Change accepted file extensions, maximum file size (50 MB), default service, or batch size options** | [import.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/constants/import.ts) |
| **Change file staging, upload timeout (AbortController), or server query parameters** | [useFileImport.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/hooks/useFileImport.ts) |
| **Change drag-and-drop dropzone layout, file input ref, or drop events** | [FileDropzone.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/components/FileDropzone.tsx) |
| **Change staged files table columns, action buttons, or status badges** | [StagedFileList.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/components/StagedFileList.tsx) |
| **Change inspection preview modal dialog, sample row table, or KPI cards** | [FilePreviewModal.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/components/FilePreviewModal.tsx) |
| **Change ingestion completion banner, KPI counters, or navigation links** | [ImportResultsBanner.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/components/ImportResultsBanner.tsx) |
| **Change format guideline descriptions, required columns, or tips** | [ImportFormatGuide.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/components/ImportFormatGuide.tsx) |
| **Change target service selector, historical toggle, or batch size inputs** | [ImportOptionsBar.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/import/components/ImportOptionsBar.tsx) |
| **Change Python parsing pipeline, xlrd extraction, date heuristic, or Supabase batch insertion** | [importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py) |
| **Change FastAPI endpoint `/api/import-file` routing or cache invalidation** | [main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py) |
| **Change sidebar navigation link, route definition, or active link matching** | [navigation.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/navigation.ts) / [DashSideNavigation.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/components/navigation/DashSideNavigation.tsx) |
| **Change top header breadcrumb title for Import Data** | [DashboardHeader.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/components/navigation/DashboardHeader.tsx) / [dashNavTexts.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/dashNavTexts.ts) |

---

## 4. Backend Ingestion Pipeline Specification

```
[User Browser Drag & Drop]
           │
           ▼
[POST /api/import-file (raw bytes)]
           │
           ├─► mode="inspect" ──► Parse Excel/CSV ──► Return 10-row preview & stats
           │
           └─► mode="commit"  ──► Parse Excel/CSV ──► Validate Milestones
                                                     │
                                                     ▼
                                      [Batch Insert into 'patients' (service role)]
                                                     │
                                                     ▼
                                      [Invalidate Cache (_monthly, _years, _export)]
                                                     │
                                                     ▼
                                      [Return Ingestion Telemetry & Summary]
```

### Security Compliance
- Service role key usage is strictly isolated within `python_backend/importer.py` on the server and is never exposed to client-side bundles.
- All timestamps are normalized to `Asia/Manila` and stored in UTC.
- Research immutability is respected by default (`is_historical = true`).
