"""
import_seeder_to_supabase.py
Import generated patient seed data into Supabase patients table.

Ensures all imported records reflect post-kiosk check-in state:
- status: 'On Progress'
- phoneNum: None (RA 10173 data privacy)
- is_historical: False
- counter: None, cubicleNum: None
- Clean patientNum ticket format matching live kiosk outputs.
"""

import csv
import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

for env_path in [
    os.path.join(ROOT_DIR, ".env.local"),
    os.path.join(ROOT_DIR, ".env"),
    os.path.join(BASE_DIR, ".env.local"),
    os.path.join(BASE_DIR, ".env"),
]:
    if os.path.exists(env_path):
        load_dotenv(env_path)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
CSV_PATH = os.path.join(BASE_DIR, "simulated_patients.csv")
REST_ENDPOINT = f"{SUPABASE_URL}/rest/v1/patients" if SUPABASE_URL else None


def build_records() -> List[Dict[str, Any]]:
    records = []
    if not os.path.exists(CSV_PATH):
        print(f"File not found: {CSV_PATH}")
        return records

    with open(CSV_PATH, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            raw_patient_num = (row.get("patientNum") or "").strip()
            # Clean any legacy 'seed-' prefix if present in old files
            patient_num = raw_patient_num[5:] if raw_patient_num.startswith("seed-") else raw_patient_num

            queue_pos = row.get("queue_position")
            queue_position = int(queue_pos) if queue_pos and queue_pos.strip().isdigit() else None

            record: Dict[str, Any] = {
                "patientNum": patient_num,
                "service": row.get("service") or "General",
                "subcategory": row.get("subcategory") or None,
                "status": row.get("status") or "On Progress",
                "phoneNum": None,
                "cubicleNum": None,
                "counter": None,
                "is_historical": False,
                "created_at": row.get("created_at"),
                "reg_start": row.get("reg_start") if row.get("reg_start", "").strip() else None,
                "reg_end": row.get("reg_end") if row.get("reg_end", "").strip() else None,
                "consult_start": row.get("consult_start") if row.get("consult_start", "").strip() else None,
                "consult_end": row.get("consult_end") if row.get("consult_end", "").strip() else None,
            }
            if queue_position is not None:
                record["queue_position"] = queue_position

            records.append(record)
    return records


def insert_records(records: List[Dict[str, Any]]) -> str:
    if not REST_ENDPOINT or not SUPABASE_KEY:
        print("Missing Supabase configuration.")
        return "Failed"

    batch_size = 500
    total_status = "Success"

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        payload = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(
            REST_ENDPOINT,
            data=payload,
            method="POST",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Prefer": "return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60):
                print(f"Batch {i // batch_size + 1} imported successfully.")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            print(f"Error on batch {i // batch_size + 1}: {error_body}")
            total_status = "Failed"
            break
        except Exception as e:
            print(f"Error on batch {i // batch_size + 1}: {e}")
            total_status = "Failed"
            break

    return total_status


def main():
    if SUPABASE_URL is None or SUPABASE_KEY is None:
        raise RuntimeError("Supabase URL and key must be set in .env.local")

    print(f"Importing seeded patient rows into Supabase 'patients' table...")
    records = build_records()
    if not records:
        print("No records found to import.")
        return

    print(f"Prepared {len(records)} records. Sending to Supabase in batches...")
    status = insert_records(records)
    print(f"Import Status: {status}")


if __name__ == "__main__":
    main()
