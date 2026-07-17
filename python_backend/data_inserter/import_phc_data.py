import pandas as pd

EXCEL_PATH = "/home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/data_entries/NOV.ROOM6-2025_416e4b79-e9bc-4f65-9f91-733b8df90139.xls"

def extract_sheet_data(path, sheet_name):
    raw = pd.read_excel(path, sheet_name=sheet_name, header=None, engine="xlrd")

    date_val = None
    for r in range(min(10, len(raw))):
        row_vals = raw.iloc[r].astype(str)
        if row_vals.str.contains("Date:").any():
            col_idx = row_vals[row_vals.str.contains("Date:")].index[0]
            date_val = raw.iloc[r, col_idx + 1]
            break

    header_row = None
    hosp_col = None
    for r in range(min(15, len(raw))):
        row_vals = raw.iloc[r].astype(str)
        matches = row_vals[row_vals.str.contains("Hospital", na=False)]
        # only accept matches in column index 15+ (skip the left duplicate table)
        matches = matches[matches.index >= 15]
        if len(matches) > 0:
            header_row = r
            hosp_col = matches.index[0]
            break

    if header_row is None:
        print(f"WARNING: no header found in sheet '{sheet_name}', skipping")
        return None

    data_start = header_row + 2

    print(f"--- {sheet_name}: header_row={header_row}, hosp_col={hosp_col} ---")

    rows = []
    for r in range(data_start, len(raw)):
        hosp_num = raw.iloc[r, hosp_col]
        if pd.isna(hosp_num) or not str(hosp_num).strip().replace(".0", "").isdigit():
            break
        rows.append({
            "patientNum":    str(hosp_num).strip(),
            "reg_start":     raw.iloc[r, hosp_col + 1],   # Queuing Time
            "reg_end":       raw.iloc[r, hosp_col + 2],   # Initial Assessment
            "consult_start": raw.iloc[r, hosp_col + 3],   # Doctor Seen
            "consult_end":   raw.iloc[r, hosp_col + 4],   # Doctor Completed
        })

    df = pd.DataFrame(rows)
    df["sheet_date"] = date_val
    df["sheet_name"] = sheet_name
    return df

if __name__ == "__main__":
    df = extract_sheet_data(EXCEL_PATH, "DECEMBER 15, 2025")
    print(df.head(5))