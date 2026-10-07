"""
importer.py
Data import engine for Heart Check PHC Admin Dashboard.

Processes dropped/uploaded files:
1. PHC Time and Motion Analysis Excel workbooks (.xls, .xlsx)
2. Standard Patient Queue Datasets (.csv, .xlsx)

Extracts, validates timestamps (localized to Asia/Manila and stored in UTC),
adds schema columns, and batch-inserts into the Supabase patients table
using the secure service role key.
"""

import io
import os
import re
from datetime import date, datetime, timedelta
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Returns singleton Supabase client configured with service role key."""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError("Supabase URL or service key is not configured in .env.local")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


def _fix_time_heuristic(t) -> str | None:
    """
    Applies PHC clinic heuristic for AM/PM correction.
    If time is recorded between 1:00 AM and 6:59 AM, PHC afternoon clinic hours
    mean it corresponds to 1:00 PM - 6:59 PM (hour + 12).
    Hour 7 (7:00 AM - 7:59 AM) is preserved as morning arrival because PHC OPD
    patients and staff arrive as early as 7:00 AM for queuing and registration prep.
    """
    if pd.isna(t):
        return None

    # If already a time or datetime object
    if hasattr(t, "hour"):
        hour = t.hour
        if 1 <= hour <= 6:
            hour += 12
        minute = getattr(t, "minute", 0)
        second = getattr(t, "second", 0)
        return f"{hour:02d}:{minute:02d}:{second:02d}"

    # If string representation
    if isinstance(t, str):
        cleaned = t.strip()
        if not cleaned:
            return None
        match = re.match(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?", cleaned)
        if match:
            hour = int(match.group(1))
            minute = int(match.group(2))
            second = int(match.group(3)) if match.group(3) else 0
            if 1 <= hour <= 6:
                hour += 12
            return f"{hour:02d}:{minute:02d}:{second:02d}"

    return None


def resolve_phc_sheet_date(raw_cell_val, sheet_name: str, filename: str = "") -> str | None:
    """
    Intelligently reconciles and validates the sheet date by cross-referencing:
    1. The raw "Date:" cell in the sheet (accounting for Excel serial floats, text dates, and typos).
    2. The sheet name pattern (e.g. "1-15", "10-10", or "MARCH 11, 2025").
    3. The file name (e.g. "2024_JAN.xls", "2024_OCT.xls").

    Guards against common manual data-entry errors in hospital spreadsheets,
    such as stale template copy-pastes (e.g. "45275.0" / 2023-12-15 inside 2024_JAN.xls
    sheet "1-15"), typo date strings (e.g. "1010/2024"), or year/day misalignments.

    Returns:
        ISO date string "YYYY-MM-DD" or None if completely unresolvable.
    """
    base_date = date(1899, 12, 30)

    # 1. Parse raw cell date if present
    cell_date = None
    if isinstance(raw_cell_val, (int, float)) and raw_cell_val > 1000:
        cell_date = base_date + timedelta(days=int(raw_cell_val))
    elif isinstance(raw_cell_val, str) and raw_cell_val.strip():
        s = raw_cell_val.strip()
        # Clean common typo like 1010/2024 -> 10/10/2024
        m_typo = re.match(r"^(\d{2})(\d{2})/(\d{4})$", s)
        if m_typo:
            s = f"{m_typo.group(1)}/{m_typo.group(2)}/{m_typo.group(3)}"
        p = pd.to_datetime(s, errors="coerce")
        if pd.notna(p):
            cell_date = p.date()

    # 2. Extract year from filename if available (e.g. 2024 from 2024_JAN.xls)
    m_yr = re.search(r"(202\d)", filename) if filename else None
    file_year = int(m_yr.group(1)) if m_yr else None

    # 3. Check sheet name pattern M-D or M/D (e.g. 1-15, 10-10, 8-2, 10-4)
    m_md = re.match(r"^(\d{1,2})[-/](\d{1,2})$", sheet_name.strip())
    if m_md:
        s_m, s_d = int(m_md.group(1)), int(m_md.group(2))
        target_year = file_year or (cell_date.year if cell_date else None)
        if target_year:
            sheet_date = date(target_year, s_m, s_d)
            # If cell_date is missing or disagrees with sheet/file context (e.g. 2023-12-15 vs 2024-01-15),
            # the sheet name and filename are authoritative
            if (
                cell_date is None
                or cell_date.year != target_year
                or cell_date.month != s_m
                or cell_date.day != s_d
            ):
                return sheet_date.isoformat()
            return cell_date.isoformat()

    # 4. Check sheet name pattern full text (e.g. "MARCH 11, 2025.", "SEPTEMBER 10, 2025_2")
    clean_name = re.sub(r"_\d+$", "", sheet_name).strip().rstrip(".")
    p_name = pd.to_datetime(clean_name, errors="coerce")
    if pd.notna(p_name):
        s_date = p_name.date()
        if (
            cell_date is None
            or cell_date.year != s_date.year
            or cell_date.month != s_date.month
            or cell_date.day != s_date.day
        ):
            return s_date.isoformat()
        return cell_date.isoformat()

    return cell_date.isoformat() if cell_date else None


def extract_phc_sheet_data(raw: pd.DataFrame, sheet_name: str, filename: str = "") -> pd.DataFrame | None:
    """
    Extracts patient queue rows from a single PHC Time and Motion Excel sheet.

    Scans top rows for 'Date:' label and 'Hospital' header column.
    Extracts Queuing Time, Initial Assessment, Doctor Seen, Doctor Completed,
    and Carry Out Completed timestamps.
    """
    if len(raw) < 5:
        return None

    # Step 1: Detect Sheet Date
    date_val = None
    for r in range(min(10, len(raw))):
        row_vals = raw.iloc[r].astype(str)
        if row_vals.str.contains("Date:", case=False).any():
            matches = row_vals[row_vals.str.contains("Date:", case=False)].index
            if len(matches) > 0:
                col_idx = matches[0]
                if col_idx + 1 < len(raw.columns):
                    date_val = raw.iloc[r, col_idx + 1]
                    break

    # Reconcile date with sheet name and filename context
    resolved_date = resolve_phc_sheet_date(date_val, sheet_name, filename)

    # Step 2: Detect Header row and Hospital number column
    header_row, hosp_col = None, None
    for r in range(min(15, len(raw))):
        row_vals = raw.iloc[r].astype(str)
        matches = row_vals[row_vals.str.contains("Hospital", case=False, na=False)]
        # Prefer PHC column standard (col_idx >= 15)
        phc_matches = matches[matches.index >= 15]
        if len(phc_matches) > 0:
            header_row = r
            hosp_col = phc_matches.index[0]
            break
        elif len(matches) > 0 and header_row is None:
            header_row = r
            hosp_col = matches.index[0]

    if header_row is None or hosp_col is None:
        return None

    # Step 3: Extract patient data rows
    data_start = header_row + 2
    rows = []
    for r in range(data_start, len(raw)):
        hosp_num = raw.iloc[r, hosp_col]
        hosp_str = str(hosp_num).strip().replace(".0", "")

        # Stop at template/blank placeholder rows
        if pd.isna(hosp_num) or not hosp_str.isdigit() or hosp_str == "0":
            break

        row_dict = {
            "patientNum": hosp_str,
            "reg_start": raw.iloc[r, hosp_col + 1] if hosp_col + 1 < len(raw.columns) else None,
            "reg_end": raw.iloc[r, hosp_col + 2] if hosp_col + 2 < len(raw.columns) else None,
            "consult_start": raw.iloc[r, hosp_col + 3] if hosp_col + 3 < len(raw.columns) else None,
            "consult_end": raw.iloc[r, hosp_col + 4] if hosp_col + 4 < len(raw.columns) else None,
            "carryout_end": raw.iloc[r, hosp_col + 5] if hosp_col + 5 < len(raw.columns) else None,
        }
        rows.append(row_dict)

    if not rows:
        return None

    df = pd.DataFrame(rows)
    df["sheet_date"] = resolved_date
    df["sheet_name"] = sheet_name
    return df


def process_phc_workbook(
    file_bytes: bytes,
    filename: str,
    service: str = "Consultation",
    is_historical: bool = True,
) -> tuple[list[dict], dict]:
    """
    Parses a PHC Time and Motion Analysis Excel workbook (.xls or .xlsx).
    Iterates through all sheets, cleans timestamps, and formats Supabase records.
    """
    is_xls = filename.lower().endswith(".xls")
    engine = "xlrd" if is_xls else "openpyxl"

    buffer = io.BytesIO(file_bytes)
    xls = pd.ExcelFile(buffer, engine=engine)

    sheet_dfs = []
    sheets_processed = []

    for sheet in xls.sheet_names:
        try:
            raw = pd.read_excel(buffer, sheet_name=sheet, header=None, engine=engine)
            df = extract_phc_sheet_data(raw, sheet, filename=filename)
            if df is not None and not df.empty:
                sheet_dfs.append(df)
                sheets_processed.append(sheet)
        except Exception as e:
            print(f"Skipping sheet {sheet} due to read error: {e}")
            continue

    if not sheet_dfs:
        raise ValueError(f"No valid patient records found in {filename}. Check that sheets contain Hospital and Date columns.")

    combined = pd.concat(sheet_dfs, ignore_index=True)
    total_extracted = len(combined)

    # Date and time combination
    date_part = pd.to_datetime(combined["sheet_date"], errors="coerce").dt.date.astype(str)

    time_cols = ["reg_start", "reg_end", "consult_start", "consult_end", "carryout_end"]
    for col in time_cols:
        time_str = combined[col].apply(_fix_time_heuristic)
        combined_ts = pd.to_datetime(date_part + " " + time_str, errors="coerce")
        combined[col] = (
            combined_ts
            .dt.tz_localize("Asia/Manila", ambiguous="NaT", nonexistent="NaT")
            .dt.tz_convert("UTC")
        )

    # Validation and dropping of rows missing mandatory milestones
    required = ["reg_start", "reg_end", "consult_start", "consult_end"]
    valid_mask = combined[required].notna().all(axis=1)
    dropped_count = int((~valid_mask).sum())
    valid_df = combined[valid_mask].copy()

    if valid_df.empty:
        raise ValueError("All extracted rows were missing required queuing or consultation timestamps.")

    # Schema column enrichment
    valid_df["created_at"] = valid_df["reg_start"]
    valid_df["service"] = service
    valid_df["status"] = "Done"
    valid_df["phoneNum"] = None
    valid_df["cubicleNum"] = None
    valid_df["is_historical"] = is_historical
    valid_df["carryout_start"] = valid_df["consult_end"].where(valid_df["carryout_end"].notna())

    # Build Supabase records list
    ts_cols = ["created_at", "reg_start", "reg_end", "consult_start", "consult_end", "carryout_start", "carryout_end"]
    for c in ts_cols:
        valid_df[c] = valid_df[c].apply(lambda x: x.strftime("%Y-%m-%dT%H:%M:%S%z") if pd.notna(x) else None)

    cols = [
        "created_at", "patientNum", "phoneNum", "service",
        "cubicleNum", "status", "reg_start", "reg_end",
        "consult_start", "consult_end", "carryout_start", "carryout_end",
        "is_historical"
    ]
    raw_records = valid_df[cols].to_dict(orient="records")
    records = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in raw_records]

    # Metadata summary
    dates = valid_df["created_at"].dropna()
    start_date = str(dates.min())[:10] if not dates.empty else None
    end_date = str(dates.max())[:10] if not dates.empty else None

    meta = {
        "format": "phc_excel",
        "sheets_processed": sheets_processed,
        "total_extracted": total_extracted,
        "valid_records": len(records),
        "dropped_records": dropped_count,
        "date_range": {"start": start_date, "end": end_date},
    }

    return records, meta


def process_tabular_dataset(
    file_bytes: bytes,
    filename: str,
    service: str = "Consultation",
    is_historical: bool = True,
) -> tuple[list[dict], dict]:
    """
    Parses a standard patient CSV or Excel dataset with standard column headers.
    """
    buffer = io.BytesIO(file_bytes)
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(buffer)
    else:
        engine = "xlrd" if filename.lower().endswith(".xls") else "openpyxl"
        df = pd.read_excel(buffer, engine=engine)

    if df.empty:
        raise ValueError(f"The file {filename} is empty.")

    total_extracted = len(df)

    # Normalize column names
    col_mapping = {}
    for c in df.columns:
        clean_c = str(c).strip()
        lower_c = clean_c.lower()
        if lower_c in ("patientnum", "patient_num", "ticket", "ticketnum", "hospital_num"):
            col_mapping[c] = "patientNum"
        elif lower_c in ("service", "department"):
            col_mapping[c] = "service"
        elif lower_c in ("status",):
            col_mapping[c] = "status"
        elif lower_c in ("created_at", "kiosk_time", "arrival_time"):
            col_mapping[c] = "created_at"
        elif lower_c in ("reg_start", "queuing_time"):
            col_mapping[c] = "reg_start"
        elif lower_c in ("reg_end", "initial_assessment"):
            col_mapping[c] = "reg_end"
        elif lower_c in ("consult_start", "doctor_seen"):
            col_mapping[c] = "consult_start"
        elif lower_c in ("consult_end", "doctor_completed"):
            col_mapping[c] = "consult_end"
        elif lower_c in ("carryout_start",):
            col_mapping[c] = "carryout_start"
        elif lower_c in ("carryout_end", "carry_out_completed"):
            col_mapping[c] = "carryout_end"
        elif lower_c in ("cubicle", "cubiclenum"):
            col_mapping[c] = "cubicleNum"
        elif lower_c in ("phone", "phonenum"):
            col_mapping[c] = "phoneNum"

    df = df.rename(columns=col_mapping)

    # Ensure patientNum exists
    if "patientNum" not in df.columns:
        if "id" in df.columns:
            df["patientNum"] = df["id"].astype(str)
        else:
            df["patientNum"] = [f"IMP-{i+1:04d}" for i in range(len(df))]
    else:
        df["patientNum"] = df["patientNum"].astype(str)

    # Handle created_at
    if "created_at" not in df.columns:
        if "reg_start" in df.columns:
            df["created_at"] = df["reg_start"]
        else:
            df["created_at"] = datetime.utcnow().isoformat()

    # Datetime formatting
    ts_cols = ["created_at", "reg_start", "reg_end", "consult_start", "consult_end", "carryout_start", "carryout_end"]
    for c in ts_cols:
        if c in df.columns:
            parsed = pd.to_datetime(df[c], errors="coerce")
            # If timestamps already carry timezone info, convert to UTC.
            # If timezone-naive, assume Asia/Manila (consistent with PHC Excel import path).
            if hasattr(parsed, "dt") and parsed.dt.tz is None:
                parsed = parsed.dt.tz_localize("Asia/Manila", ambiguous="NaT", nonexistent="NaT")
            if hasattr(parsed, "dt") and parsed.dt.tz is not None:
                parsed = parsed.dt.tz_convert("UTC")
            else:
                parsed = pd.to_datetime(df[c], errors="coerce", utc=True)
            df[c] = parsed.apply(lambda x: x.strftime("%Y-%m-%dT%H:%M:%S%z") if pd.notna(x) else None)
        else:
            df[c] = None

    if "service" not in df.columns:
        df["service"] = service
    else:
        df["service"] = df["service"].fillna(service)

    if "status" not in df.columns:
        df["status"] = "Done"
    else:
        df["status"] = df["status"].fillna("Done")

    if "phoneNum" not in df.columns:
        df["phoneNum"] = None

    if "cubicleNum" not in df.columns:
        df["cubicleNum"] = None

    df["is_historical"] = is_historical

    # Drop completely empty created_at rows
    valid_mask = df["created_at"].notna()
    dropped_count = int((~valid_mask).sum())
    valid_df = df[valid_mask].copy()

    if valid_df.empty:
        raise ValueError("No rows with valid timestamps could be parsed from the file.")

    cols = [
        "created_at", "patientNum", "phoneNum", "service",
        "cubicleNum", "status", "reg_start", "reg_end",
        "consult_start", "consult_end", "carryout_start", "carryout_end",
        "is_historical"
    ]
    raw_records = valid_df[cols].to_dict(orient="records")
    records = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in raw_records]

    dates = valid_df["created_at"].dropna()
    start_date = str(dates.min())[:10] if not dates.empty else None
    end_date = str(dates.max())[:10] if not dates.empty else None

    meta = {
        "format": "standard_csv" if filename.lower().endswith(".csv") else "standard_excel",
        "sheets_processed": [filename],
        "total_extracted": total_extracted,
        "valid_records": len(records),
        "dropped_records": dropped_count,
        "date_range": {"start": start_date, "end": end_date},
    }

    return records, meta


def parse_and_process_file(
    file_bytes: bytes,
    filename: str,
    service: str = "Consultation",
    is_historical: bool = True,
) -> tuple[list[dict], dict]:
    """
    Intelligently determines file format (PHC Time & Motion vs Tabular)
    and executes appropriate extraction pipeline.
    """
    lower = filename.lower()
    if lower.endswith(".csv"):
        return process_tabular_dataset(file_bytes, filename, service, is_historical)

    if not (lower.endswith(".xls") or lower.endswith(".xlsx")):
        raise ValueError(f"Unsupported file format '{filename}'. Please upload .xls, .xlsx, or .csv files.")

    # Try reading as PHC workbook first
    try:
        return process_phc_workbook(file_bytes, filename, service, is_historical)
    except Exception as phc_err:
        # Fallback: check if it's a standard tabular Excel file
        try:
            return process_tabular_dataset(file_bytes, filename, service, is_historical)
        except Exception:
            raise phc_err


def insert_records_batch(records: list[dict], batch_size: int = 500) -> tuple[int, list[str]]:
    """
    Batch inserts records into Supabase 'patients' table.
    Returns (inserted_count, list_of_error_messages).
    """
    client = get_supabase_client()
    total = len(records)
    inserted = 0
    errors = []

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        try:
            client.table("patients").insert(batch).execute()
            inserted += len(batch)
        except Exception as e:
            err_msg = str(e)
            print(f"Error inserting batch {i}..{i + len(batch)}: {err_msg}")
            errors.append(err_msg)
            break

    return inserted, errors
