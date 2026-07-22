import pandas as pd
import os
from dotenv import load_dotenv
from supabase import create_client

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)

EXCEL_PATH   = "/home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/data_entries/NOV.ROOM6-2025_416e4b79-e9bc-4f65-9f91-733b8df90139.xls"
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
BATCH_SIZE   = 500

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def extract_sheet_data(path, sheet_name):
    raw = pd.read_excel(path, sheet_name=sheet_name, header=None, engine="xlrd")

    date_val = None
    for r in range(min(10, len(raw))):
        row_vals = raw.iloc[r].astype(str)
        if row_vals.str.contains("Date:").any():
            col_idx = row_vals[row_vals.str.contains("Date:")].index[0]
            date_val = raw.iloc[r, col_idx + 1]
            break

    header_row, hosp_col = None, None
    for r in range(min(15, len(raw))):
        row_vals = raw.iloc[r].astype(str)
        matches = row_vals[row_vals.str.contains("Hospital", na=False)]
        matches = matches[matches.index >= 15]
        if len(matches) > 0:
            header_row = r
            hosp_col = matches.index[0]
            break

    if header_row is None:
        print(f"WARNING: no header found in sheet '{sheet_name}', skipping")
        return None

    data_start = header_row + 2
    rows = []
    for r in range(data_start, len(raw)):
        hosp_num = raw.iloc[r, hosp_col]
        hosp_str = str(hosp_num).strip().replace(".0", "")
        # Stop at first blank/template row: NaN, non-numeric, or placeholder "0"
        if pd.isna(hosp_num) or not hosp_str.isdigit() or hosp_str == "0":
            break
        rows.append({
            "patientNum":    hosp_str,   # kept in df for reference only, not inserted
            "reg_start":     raw.iloc[r, hosp_col + 1],
            "reg_end":       raw.iloc[r, hosp_col + 2],
            "consult_start": raw.iloc[r, hosp_col + 3],
            "consult_end":   raw.iloc[r, hosp_col + 4],
        })

    if not rows:
        print(f"WARNING: no patient rows found in sheet '{sheet_name}'")
        return None

    df = pd.DataFrame(rows)
    df["sheet_date"] = date_val
    df["sheet_name"] = sheet_name
    return df


def load_all_sheets(path, skip_sheets=None):
    skip_sheets = skip_sheets or []
    xls = pd.ExcelFile(path, engine="xlrd")
    all_dfs = []

    for sheet in xls.sheet_names:
        if sheet in skip_sheets:
            print(f"Skipping '{sheet}' (already imported)")
            continue

        df = extract_sheet_data(path, sheet)
        if df is not None and len(df) > 0:
            all_dfs.append(df)
            print(f"{sheet}: {len(df)} rows")

    if not all_dfs:
        raise ValueError("No data extracted from any sheet.")

    combined = pd.concat(all_dfs, ignore_index=True)
    print(f"\nTotal combined: {len(combined)} rows from {len(all_dfs)} sheets")
    return combined


def combine_date_and_time(df):
    date_part = pd.to_datetime(df["sheet_date"]).dt.date.astype(str)

    def fix_am_pm(t):
        # Handle nulls and invalid types
        if pd.isna(t) or not hasattr(t, "strftime"):
            return None
        
        hour = t.hour
        
        # HEURISTIC FIX: 
        # If Excel gave us a time between 1:00 AM and 7:00 AM, 
        # it almost certainly meant 1:00 PM - 7:00 PM. 
        if 1 <= hour <= 7:
            hour += 12
            
        # Reconstruct the time string with the corrected 24-hour integer
        return f"{hour:02d}:{t.minute:02d}:{t.second:02d}"

    for col in ["reg_start", "reg_end", "consult_start", "consult_end"]:
        # Apply the fix function instead of a simple lambda
        time_str = df[col].apply(fix_am_pm)
        
        # Combine date and corrected time
        combined = pd.to_datetime(date_part + " " + time_str, errors="coerce")
        
        # Localize to Manila, then convert to UTC for Supabase
        df[col] = (
            combined
            .dt.tz_localize("Asia/Manila", ambiguous="NaT", nonexistent="NaT")
            .dt.tz_convert("UTC")
        )
        
    return df


def validate_and_drop(df):
    required = ["reg_start", "reg_end", "consult_start", "consult_end"]
    before = len(df)
    bad = df[df[required].isna().any(axis=1)]
    if len(bad) > 0:
        bad.to_csv("dropped_rows_full.csv", index=False)
        print(f"Saved {len(bad)} dropped rows to dropped_rows_full.csv")
    df = df.dropna(subset=required)
    print(f"Kept {len(df)} of {before} rows total")
    return df


def add_schema_columns(df):
    df["created_at"] = df["reg_start"]
    df["service"]    = "Consultation"
    df["status"]     = "Done"
    df["phoneNum"]   = None
    df["cubicleNum"] = None
    return df


def to_supabase_records(df):
    cols = ["created_at", "phoneNum", "service",
             "cubicleNum", "status", "reg_start", "reg_end",
             "consult_start", "consult_end"]
    out = df[cols].copy()
    for c in ["created_at", "reg_start", "reg_end", "consult_start", "consult_end"]:
        out[c] = out[c].dt.strftime("%Y-%m-%dT%H:%M:%S%z")
    return out.to_dict(orient="records")


def insert_in_batches(records, batch_size=BATCH_SIZE):
    total = len(records)
    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        supabase.table("patients").insert(batch).execute()
        print(f"Inserted rows {i} to {i + len(batch)} of {total}")


if __name__ == "__main__":
    # December 15 was already inserted during testing — skip it here
    # to avoid duplicating those 20 rows. Remove from this list once
    # you've deleted the test rows from Supabase, if you'd rather
    # re-import it fresh as part of the full batch instead.
    # ALREADY_IMPORTED = ["DECEMBER 15, 2025"]

    df = load_all_sheets(EXCEL_PATH)
    df = combine_date_and_time(df)
    df = validate_and_drop(df)
    df = add_schema_columns(df)

    records = to_supabase_records(df)
    print(f"\nReady to insert {len(records)} total records into 'patients'.")
    print("Sample record:", records[0])

    confirm = input("\nType 'y' to insert ALL records into 'patients': ")
    if confirm.strip().lower() == "y":
        insert_in_batches(records)
        print("Done.")
    else:
        print("Skipped insert.")