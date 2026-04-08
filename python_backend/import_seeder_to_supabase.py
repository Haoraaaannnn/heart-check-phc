"""Import generated patient seed data into Supabase patients table."""
import csv
import json
import os
import urllib.request
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "..", ".env.local"))
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

CSV_PATH = os.path.join(BASE_DIR, "simulated_patients.csv")
REST_ENDPOINT = f"{SUPABASE_URL}/rest/v1/patients"


def build_records(limit=None):
    records = []
    with open(CSV_PATH, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for i, row in enumerate(reader, start=1):
            if limit is not None and i > limit:
                break
            records.append({
                "phoneNum": None,
                "service": row["purpose"],
                "patientNum": f"seed-{row['queue_number']}",
                "cubicleNum": None,
                "status": "seeded",
                "reg_start": row["reg_start"],
                "reg_end": row["reg_end"],
                "consult_start": row["consult_start"],
                "consult_end": row["consult_end"]
            })
    return records


def insert_records(records):
    payload = json.dumps(records).encode("utf-8")
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
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.status, response.read().decode("utf-8")


def main():
    if SUPABASE_URL is None or SUPABASE_KEY is None:
        raise RuntimeError("Supabase URL and key must be set in .env.local")

    limit = int(os.environ.get("SEED_IMPORT_LIMIT", "200"))
    print(f"Importing up to {limit} seeded patient rows into Supabase patients table...")
    records = build_records(limit=limit)
    print(f"Prepared {len(records)} records")
    status, body = insert_records(records)
    print(f"HTTP {status}")
    print(body)


if __name__ == "__main__":
    main()
