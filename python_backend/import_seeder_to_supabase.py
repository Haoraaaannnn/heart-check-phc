"""Import generated patient seed data into Supabase patients table."""
import csv
import json
import os
import urllib.request
import urllib.error
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "..", ".env.local"))
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

CSV_PATH = os.path.join(BASE_DIR, "simulated_patients.csv")

# Pointing exactly to the 'patients' table as you requested
REST_ENDPOINT = f"{SUPABASE_URL}/rest/v1/patients"

def build_records():
    records = []
    with open(CSV_PATH, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            records.append({
                "phoneNum": None,
                "service": row["purpose"],
                "patientNum": f"seed-{row['queue_number']}",
                "cubicleNum": None,
                "status": "Done", 
                "created_at": row["kiosk_time"],
                "reg_start": row["reg_start"],
                "reg_end": row["reg_end"],
                "consult_start": row["service_start"], 
                "consult_end": row["service_end"]
            })
    return records


def insert_records(records):
    # Upload in batches of 1000 so Supabase doesn't crash from a massive payload
    batch_size = 1000
    total_status = "Success"
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
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
                "Prefer": "return=minimal"
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                print(f"Batch {i//batch_size + 1} imported successfully.")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            print(f"Error on batch {i//batch_size + 1}: {error_body}")
            total_status = "Failed"
            break
            
    return total_status


def main():
    if SUPABASE_URL is None or SUPABASE_KEY is None:
        raise RuntimeError("Supabase URL and key must be set in .env.local")

    print(f"Importing ALL seeded patient rows into Supabase 'patients' table...")
    # The 200 limit trap has been removed!
    records = build_records()
    print(f"Prepared {len(records)} records. Sending to Supabase in batches...")
    
    status = insert_records(records)
    print(f"Import Status: {status}")


if __name__ == "__main__":
    main()