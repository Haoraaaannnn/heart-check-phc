import pandas as pd
import os
from dotenv import load_dotenv
from supabase import create_client

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, "..", ".env.local")
print("Looking for env at:", os.path.abspath(env_path))
print("File exists?", os.path.exists(env_path))
load_dotenv(env_path)
print("URL loaded:", os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))

EXCEL_PATH   = "/home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/data_entries/NOV.ROOM6-2025_416e4b79-e9bc-4f65-9f91-733b8df90139.xls"
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
TEST_SHEET   = "DECEMBER 15, 2025"

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
        if pd.isna(hosp_num) or not str(hosp_num).strip().replace(".0", "").isdigit():
            break
        rows.append({
            "patientNum":    str(hosp_num).strip(),
            "reg_start":     raw.iloc[r, hosp_col + 1],
            "reg_end":       raw.iloc[r, hosp_col + 2],
            "consult_start": raw.iloc[r, hosp_col + 3],
            "consult_end":   raw.iloc[r, hosp_col + 4],
        })

    df = pd.DataFrame(rows)
    df["sheet_date"] = date_val
    df["sheet_name"] = sheet_name
    return df


def combine_date_and_time(df):
    date_part = pd.to_datetime(df["sheet_date"]).dt.date.astype(str)

    for col in ["reg_start", "reg_end", "consult_start", "consult_end"]:
        # Convert datetime.time objects to "HH:MM:SS" strings first
        time_str = df[col].apply(
            lambda t: t.strftime("%H:%M:%S") if pd.notna(t) and hasattr(t, "strftime") else None
        )

        combined = pd.to_datetime(date_part + " " + time_str, errors="coerce")

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
        bad.to_csv("dropped_rows_test.csv", index=False)
        print(f"Saved {len(bad)} dropped rows to dropped_rows_test.csv")
    df = df.dropna(subset=required)
    print(f"Kept {len(df)} of {before} rows")
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


if __name__ == "__main__":
    df = extract_sheet_data(EXCEL_PATH, TEST_SHEET)
    print(f"Extracted {len(df)} rows from '{TEST_SHEET}'")

    df = combine_date_and_time(df)
    df = validate_and_drop(df)
    df = add_schema_columns(df)

    print(df[["patientNum", "created_at", "reg_start", "reg_end",
               "consult_start", "consult_end"]].to_string())

    records = to_supabase_records(df)
    print(f"\nReady to insert {len(records)} records into queue_table_staging.")
    print("Sample record:", records[0])

    confirm = input("\nType 'yes' to insert into queue_table_staging: ")
    if confirm.strip().lower() == "yes":
        result = supabase.table("patients").insert(records).execute()
        print(f"Inserted {len(records)} rows.")
    else:
        print("Skipped insert.")