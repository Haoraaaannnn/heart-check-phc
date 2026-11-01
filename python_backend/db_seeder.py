"""
db_seeder.py
Live Demo Queue Generator for Heart Check PHC.

Simulates kiosk check-in ticket generation so patients immediately appear
on the Clinical Transfer Hub (/transfer) in 'On Progress' status ready for
triage, registration desk calling, and cubicle assignment.

Adheres strictly to:
1. Exact kiosk patient schema:
   - status: 'On Progress'
   - cubicleNum: None
   - counter: None
   - is_historical: False
   - reg_start / reg_end / consult_start / consult_end: None
2. Privacy Mandate (RA 10173):
   - Never generates phone numbers (phoneNum = None).
3. Sequence-Aware Queue Numbering:
   - Queries today's active tickets from Supabase.
   - If Consultation already has 1001, the next ticket generated is 1002.
   - Zero sequence collisions across all services and prefixes.
4. Backward Compatibility:
   - Preserves generate_fake_patients for legacy analytics forecasting tests.
"""

import argparse
import csv
import json
import os
import random
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from dotenv import load_dotenv

# Resolve repository and environment paths
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
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
CSV_PATH = os.path.join(BASE_DIR, "simulated_patients.csv")

# Manila timezone (UTC+08:00) for operational day calculations
MANILA_TZ = timezone(timedelta(hours=8))

# Standard service prefix scheme (matching smsPrefixRules.ts and app_settings queue_prefix_map)
DEFAULT_SERVICE_PREFIXES: Dict[str, Dict[Optional[str], str]] = {
    "OPD Screening": {None: "1", "Adult": "1", "Pedia": "1"},
    "Consultation": {"Adult": "5", "Pedia": "2", None: "1"},
    "ECG": {None: "3"},
    "OPD Card": {None: "4"},
    "Refill Prescription": {None: "6"},
    "Warfarin": {None: "10"},
    "OPD Reschedule": {None: "8"},
    "Benzathine": {None: "9"},
}

# Standard pad lengths per service
DEFAULT_PAD_LENGTHS: Dict[str, int] = {
    "OPD Screening": 3,
    "Consultation": 3,
    "ECG": 3,
    "OPD Card": 3,
    "Refill Prescription": 3,
    "Warfarin": 3,
    "OPD Reschedule": 3,
    "Benzathine": 3,
}

# Default balanced mix for clinical workstation demo
DEFAULT_DEMO_PLAN = [
    {"service": "Consultation", "subcategory": "Adult", "count": 3},
    {"service": "Consultation", "subcategory": "Pedia", "count": 2},
    {"service": "OPD Screening", "subcategory": "Adult", "count": 2},
    {"service": "Warfarin", "subcategory": None, "count": 1},
    {"service": "ECG", "subcategory": None, "count": 1},
    {"service": "Refill Prescription", "subcategory": None, "count": 1},
]

# Services requiring registration at Registration Counters 1 to 5
REQUIRES_REGISTRATION = ["Consultation", "OPD Screening"]

# Services and cubicle mappings preserved for legacy generate_fake_patients compatibility
SERVICES = {
    "Consultation": {"resource": "Doctor", "avg_time": 15},
    "OPD Screening": {"resource": "Triage", "avg_time": 8},
    "OPD Card": {"resource": "Admin", "avg_time": 5},
    "Warfarin": {"resource": "Nurse", "avg_time": 10},
    "Benzathine": {"resource": "Nurse", "avg_time": 12},
    "ECG": {"resource": "Technician", "avg_time": 20},
    "Refill Prescription": {"resource": "Admin", "avg_time": 5},
    "OPD Reschedule": {"resource": "Admin", "avg_time": 5},
}

SERVICE_WEIGHTS = {
    "Consultation": 0.45,
    "OPD Screening": 0.10,
    "OPD Card": 0.10,
    "Warfarin": 0.10,
    "Benzathine": 0.08,
    "ECG": 0.07,
    "Refill Prescription": 0.05,
    "OPD Reschedule": 0.05,
}

CUBICLE_MAP = {
    "Consultation": [
        "R1 C1", "R1 C2", "R1 C3", "R1 C4", "R1 C5",
        "R2 C1", "R2 C2", "R2 C3", "R2 C4", "R2 C5",
        "R3 C1", "R3 C2", "R3 C3", "R3 C4", "R3 C5",
        "R4 C1", "R4 C2", "R4 C3", "R4 C4", "R4 C5",
    ],
    "OPD Screening": ["R1 C1", "R1 C2", "R1 C3"],
    "OPD Card": ["Admin C1"],
    "Warfarin": ["Warfarin C1"],
    "Benzathine": ["Benzathine C1"],
    "ECG": ["ECG R1"],
    "Refill Prescription": ["Refill C1"],
    "OPD Reschedule": ["Reschedule C1"],
}


def get_manila_today_range() -> Tuple[str, str]:
    """
    Returns UTC ISO timestamp strings for start and end of today in Manila time.
    """
    now_manila = datetime.now(MANILA_TZ)
    today_start_manila = now_manila.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start_manila = today_start_manila + timedelta(days=1)

    start_iso = today_start_manila.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    end_iso = tomorrow_start_manila.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return start_iso, end_iso


def fetch_today_patients_from_supabase() -> List[Dict[str, Any]]:
    """
    Fetches all active patients created today in Manila time from Supabase.
    """
    if not SUPABASE_URL or not SERVICE_KEY:
        return []

    start_iso, end_iso = get_manila_today_range()
    query_url = (
        f"{SUPABASE_URL}/rest/v1/patients"
        f"?created_at=gte.{start_iso}&created_at=lt.{end_iso}"
        f"&is_historical=eq.false"
        f"&select=id,patientNum,service,subcategory,queue_position,status"
    )

    req = urllib.request.Request(
        query_url,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[Supabase Sync] Warning: Unable to fetch today's patients: {e}")
        return []


def fetch_max_queue_position() -> int:
    """
    Fetches the highest current queue_position across all patients from Supabase.
    """
    if not SUPABASE_URL or not SERVICE_KEY:
        return 0

    query_url = (
        f"{SUPABASE_URL}/rest/v1/patients"
        f"?select=queue_position&queue_position=not.is.null&order=queue_position.desc&limit=1"
    )

    req = urllib.request.Request(
        query_url,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and isinstance(data, list) and len(data) > 0:
                val = data[0].get("queue_position")
                return int(val) if val is not None else 0
    except Exception:
        pass
    return 0


def fetch_services_from_supabase() -> List[Dict[str, Any]]:
    """
    Fetches all active clinical services from the Supabase services table.
    Adapts dynamically to services and configurations added or edited in Superadmin.
    """
    if not SUPABASE_URL or not SERVICE_KEY:
        return []

    query_url = (
        f"{SUPABASE_URL}/rest/v1/services"
        f"?select=id,label_en,queue_prefix,queue_pad_length,requires_registration,has_subcategories"
        f"&order=display_order.asc.nullslast,id.asc"
    )
    req = urllib.request.Request(
        query_url,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data if isinstance(data, list) else []
    except Exception as e:
        print(f"[Supabase Sync] Warning: Unable to fetch services: {e}")
        return []


def fetch_queue_prefix_map_from_supabase() -> List[Dict[str, Any]]:
    """
    Fetches the persisted queue_prefix_map from app_settings table.
    Adapts dynamically to prefix assignments configured in Superadmin's QueuePrefixPanel.
    """
    if not SUPABASE_URL or not SERVICE_KEY:
        return []

    query_url = f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.queue_prefix_map"
    req = urllib.request.Request(
        query_url,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and isinstance(data, list) and len(data) > 0:
                raw_val = data[0].get("value")
                if raw_val:
                    parsed = json.loads(raw_val)
                    if isinstance(parsed, list):
                        return parsed
    except Exception as e:
        print(f"[Supabase Sync] Warning: Unable to fetch queue_prefix_map: {e}")
        return []
    return []


def resolve_service_pad_length(
    service: str,
    services_catalog: Optional[List[Dict[str, Any]]] = None,
) -> int:
    """
    Resolves the queue pad length (number of digits, e.g. 3 -> 001, 4 -> 0001).
    Adapts dynamically to services.queue_pad_length configured in Superadmin.
    """
    if services_catalog:
        service_name_lower = service.strip().lower()
        matched = next(
            (s for s in services_catalog if (s.get("label_en") or "").strip().lower() == service_name_lower),
            None,
        )
        if matched and matched.get("queue_pad_length") is not None:
            try:
                val = int(matched["queue_pad_length"])
                if val >= 1:
                    return val
            except (ValueError, TypeError):
                pass

    return DEFAULT_PAD_LENGTHS.get(service, 3)


def resolve_service_prefix(
    service: str,
    subcategory: Optional[str] = None,
    override_prefix: Optional[str] = None,
    existing_patient_nums: Optional[List[str]] = None,
    services_catalog: Optional[List[Dict[str, Any]]] = None,
    prefix_map: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """
    Resolves the queue prefix for a service and subcategory combination.
    Adapts dynamically to Superadmin changes in this order of precedence:
    1. Explicit CLI override (-p / --prefix)
    2. Explicit queue_prefix set on the service in the services table
    3. queue_prefix_map entry in app_settings (configured via Superadmin Queue Prefix Panel)
    4. Existing queue numbers in the database today (maintains continuity)
    5. Default fallback mappings (smsPrefixRules.ts / DEFAULT_SERVICE_PREFIXES)
    """
    if override_prefix:
        return str(override_prefix).strip()

    # 1. Check if the service in the services table has an explicit queue_prefix defined
    if services_catalog:
        service_name_lower = service.strip().lower()
        matched_svc = next(
            (s for s in services_catalog if (s.get("label_en") or "").strip().lower() == service_name_lower),
            None,
        )
        if matched_svc and matched_svc.get("queue_prefix"):
            clean = str(matched_svc["queue_prefix"]).strip()
            if clean:
                return clean.upper()

    # 2. Check queue_prefix_map from app_settings (configured in Superadmin QueuePrefixPanel)
    if prefix_map:
        name_lower = service.strip().lower()
        sub_lower = subcategory.strip().lower() if subcategory else None

        for item in prefix_map:
            item_svc = (item.get("service") or "").strip().lower()
            item_sub = item.get("subcategory")
            item_sub_lower = item_sub.strip().lower() if item_sub else None

            if item_svc != name_lower:
                continue

            if sub_lower:
                if item_sub_lower == sub_lower and item.get("prefix"):
                    return str(item["prefix"]).strip()
            else:
                if not item_sub_lower and item.get("prefix"):
                    return str(item["prefix"]).strip()

    # 3. Special handling for Consultation without subcategory: check existing tickets
    if service == "Consultation" and existing_patient_nums:
        has_prefix_1 = any(p.startswith("1") and len(p) == 4 and p[1:].isdigit() for p in existing_patient_nums)
        has_prefix_5 = any(p.startswith("5") and len(p) == 4 and p[1:].isdigit() for p in existing_patient_nums)
        if has_prefix_1 and not has_prefix_5:
            return "1"
        if has_prefix_5:
            return "5"

    # 4. Fallback to DEFAULT_SERVICE_PREFIXES
    service_map = DEFAULT_SERVICE_PREFIXES.get(service, {})
    if subcategory in service_map:
        return service_map[subcategory]
    if None in service_map:
        return service_map[None]

    # Fallback to standard 1
    return "1"


def resolve_next_ticket_number(
    prefix: str,
    existing_patient_nums: List[str],
    pad_length: int = 3,
) -> Tuple[str, int]:
    """
    Calculates the next ticket code for a given prefix based on existing patient tickets.
    Matches the logic of PostgreSQL create_patient stored procedure.

    @param prefix - Queue prefix string (e.g. '1', '2', '5', '10').
    @param existing_patient_nums - List of patientNum strings generated today.
    @param pad_length - Minimum padding width for numeric suffix (default: 3).
    @returns Tuple of (formatted_ticket_string, next_numeric_value).
    """
    prefix_str = str(prefix or "").strip()
    prefix_len = len(prefix_str)
    max_num = 0

    for p_num in existing_patient_nums:
        if not p_num:
            continue
        p_str = str(p_num).strip()
        if prefix_len > 0 and not p_str.startswith(prefix_str):
            continue

        suffix = p_str[prefix_len:]
        if suffix.isdigit() and len(suffix) <= 6:
            val = int(suffix)
            if val > max_num:
                max_num = val

    next_num = max_num + 1
    target_len = max(pad_length, len(str(next_num)))
    ticket_str = f"{prefix_str}{str(next_num).zfill(target_len)}"
    return ticket_str, next_num


def build_live_demo_patients(
    plan: Optional[List[Dict[str, Any]]] = None,
    service_filter: Optional[str] = None,
    subcategory_filter: Optional[str] = None,
    count_override: Optional[int] = None,
    prefix_override: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Constructs a batch of post-kiosk patient ticket records adhering strictly to
    the live kiosk schema, sequence numbers, and data privacy rules.
    """
    existing_patients = fetch_today_patients_from_supabase()
    current_queue_pos = fetch_max_queue_position()
    services_catalog = fetch_services_from_supabase()
    prefix_map = fetch_queue_prefix_map_from_supabase()

    # Group existing patient numbers by service and subcategory
    existing_by_service: Dict[str, List[str]] = {}
    for p in existing_patients:
        svc = p.get("service") or "General"
        p_num = p.get("patientNum")
        if p_num:
            existing_by_service.setdefault(svc, []).append(str(p_num))

    # Determine generation items
    generation_items: List[Dict[str, Any]] = []

    if service_filter:
        total_count = count_override if count_override and count_override > 0 else 10
        generation_items.append({
            "service": service_filter,
            "subcategory": subcategory_filter,
            "count": total_count,
            "prefix": prefix_override,
        })
    elif plan:
        generation_items = plan
    else:
        generation_items = DEFAULT_DEMO_PLAN

    records: List[Dict[str, Any]] = []
    now_utc = datetime.now(timezone.utc)

    for item in generation_items:
        service_name = item["service"]
        subcat = item.get("subcategory")
        count = item.get("count", 1)

        # Look up existing numbers for this service
        known_service_nums = existing_by_service.setdefault(service_name, [])

        # Resolve prefix dynamically adapting to Superadmin configurations
        prefix = resolve_service_prefix(
            service=service_name,
            subcategory=subcat,
            override_prefix=item.get("prefix") or prefix_override,
            existing_patient_nums=known_service_nums,
            services_catalog=services_catalog,
            prefix_map=prefix_map,
        )
        pad_length = resolve_service_pad_length(
            service=service_name,
            services_catalog=services_catalog,
        )

        for _ in range(count):
            current_queue_pos += 1
            ticket_str, _ = resolve_next_ticket_number(
                prefix=prefix,
                existing_patient_nums=known_service_nums,
                pad_length=pad_length,
            )
            # Register newly created number so subsequent iterations in this batch increment sequentially
            known_service_nums.append(ticket_str)

            # Small staggering (seconds) to create clean arrival progression
            created_at_iso = (now_utc + timedelta(seconds=len(records) * 2)).strftime("%Y-%m-%dT%H:%M:%SZ")

            record = {
                "patientNum": ticket_str,
                "service": service_name,
                "subcategory": subcat,
                "status": "On Progress",
                "phoneNum": None,
                "cubicleNum": None,
                "counter": None,
                "reg_start": None,
                "reg_end": None,
                "consult_start": None,
                "consult_end": None,
                "queue_position": current_queue_pos,
                "is_historical": False,
                "created_at": created_at_iso,
            }
            records.append(record)

    return records


def insert_patients_to_supabase(records: List[Dict[str, Any]]) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Inserts generated patient records into Supabase patients table via REST API.
    Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS restrictions safely.
    """
    if not SUPABASE_URL or not SERVICE_KEY:
        print("[Supabase Error] SUPABASE_URL or SERVICE_KEY missing in .env.local.")
        return False, []

    endpoint = f"{SUPABASE_URL}/rest/v1/patients"
    batch_size = 500
    inserted: List[Dict[str, Any]] = []

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        payload = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=payload,
            method="POST",
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Prefer": "return=representation",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                if isinstance(resp_data, list):
                    inserted.extend(resp_data)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            print(f"[Supabase Insert Error] HTTP {e.code}: {error_body}")
            return False, inserted
        except Exception as e:
            print(f"[Supabase Insert Error] {e}")
            return False, inserted

    return True, inserted


def insert_patients_via_rpc(records: List[Dict[str, Any]]) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Inserts patient tickets one by one by executing the PostgreSQL create_patient stored procedure.
    Guarantees exact parity with physical kiosk check-in hardware.
    """
    if not SUPABASE_URL or not SERVICE_KEY:
        print("[Supabase Error] SUPABASE_URL or SERVICE_KEY missing in .env.local.")
        return False, []

    endpoint = f"{SUPABASE_URL}/rest/v1/rpc/create_patient"
    inserted: List[Dict[str, Any]] = []

    for record in records:
        service_name = record["service"]
        subcat = record["subcategory"]
        p_num = record["patientNum"]
        # Derive prefix from patientNum (first character or '10')
        prefix = "10" if p_num.startswith("10") else p_num[0] if p_num else "1"

        payload = json.dumps({
            "p_service": service_name,
            "p_subcategory": subcat,
            "p_preferred_cubicles": None,
            "p_prefix": prefix,
            "p_group_by_subcategory": False,
            "p_phone": None,
        }).encode("utf-8")

        req = urllib.request.Request(
            endpoint,
            data=payload,
            method="POST",
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                if isinstance(resp_data, list) and len(resp_data) > 0:
                    inserted.append(resp_data[0])
        except Exception as e:
            print(f"[RPC Error] create_patient failed for {service_name}: {e}")
            return False, inserted

    return True, inserted


def export_patients_to_csv(records: List[Dict[str, Any]], filename: str = CSV_PATH) -> None:
    """
    Exports generated patient records to a CSV file.
    """
    fieldnames = [
        "id",
        "patientNum",
        "service",
        "subcategory",
        "status",
        "phoneNum",
        "cubicleNum",
        "counter",
        "queue_position",
        "is_historical",
        "created_at",
        "reg_start",
        "reg_end",
        "consult_start",
        "consult_end",
    ]

    with open(filename, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            writer.writerow(r)


def generate_fake_patients(
    num_days: int = 30,
    patients_per_day: int = 80,
    start_date: str = "2026-04-21",
    output_filename: str = "simulated_patients.csv",
) -> pd.DataFrame:
    """
    Legacy stochastic patient generator preserved for analytics and forecasting unit tests.
    """
    avg_inter_arrival = 5
    avg_reg_time = 3

    data = []
    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    print(f"Generating patients over {num_days} days...")

    for day in range(num_days):
        current_date = base_date + timedelta(days=day)
        if current_date.weekday() == 6:
            continue

        opd_start = current_date.replace(hour=8, minute=0, second=0, microsecond=0)
        current_time = opd_start

        reg_free_time = opd_start
        resource_free_times = {
            res["resource"]: opd_start
            for res in SERVICES.values()
        }

        daily_volume = max(10, int(np.random.normal(patients_per_day, scale=8)))

        for i in range(1, daily_volume + 1):
            inter_arrival = np.random.exponential(avg_inter_arrival)
            current_time += timedelta(minutes=inter_arrival)
            kiosk_time = current_time

            service_names = list(SERVICE_WEIGHTS.keys())
            service_probs = list(SERVICE_WEIGHTS.values())
            purpose = random.choices(service_names, weights=service_probs, k=1)[0]
            req_resource = SERVICES[purpose]["resource"]
            avg_service_time = SERVICES[purpose]["avg_time"]

            cubicle = random.choice(CUBICLE_MAP[purpose])

            if purpose in REQUIRES_REGISTRATION:
                reg_start = max(kiosk_time, reg_free_time)
                reg_duration = np.random.exponential(avg_reg_time)
                reg_end = reg_start + timedelta(minutes=reg_duration)
                reg_free_time = reg_end
                service_start = max(reg_end, resource_free_times[req_resource])
            else:
                reg_start = None
                reg_end = None
                walk_time = timedelta(minutes=random.uniform(1, 3))
                service_start = max(kiosk_time + walk_time, resource_free_times[req_resource])

            service_duration = np.random.exponential(avg_service_time)
            service_end = service_start + timedelta(minutes=service_duration)
            resource_free_times[req_resource] = service_end

            def fmt(dt: Optional[datetime]) -> Optional[str]:
                if dt is None:
                    return None
                return dt.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S")

            data.append({
                "id": f"{purpose[:3].upper()}-{i:03d}",
                "patientNum": f"{purpose[:3].upper()}-{i:03d}",
                "service": purpose,
                "cubicleNum": cubicle,
                "status": "Done",
                "phoneNum": None,
                "created_at": fmt(kiosk_time),
                "reg_start": fmt(reg_start),
                "reg_end": fmt(reg_end),
                "consult_start": fmt(service_start),
                "consult_end": fmt(service_end),
            })

    df = pd.DataFrame(data)
    df.to_csv(output_filename, index=False)
    return df


def run_live_queue_generation(
    service: Optional[str] = None,
    subcategory: Optional[str] = None,
    count: Optional[int] = None,
    prefix: Optional[str] = None,
    no_insert: bool = False,
    use_rpc: bool = False,
) -> None:
    """
    Main entry point for generating live demo queue tickets directly appearing
    on the Clinical Transfer Hub (/transfer).
    """
    print("-----------------------------------------------------------------")
    print("Heart Check PHC - Live Demo Queue Ticket Generator")
    print("Simulating patient tickets created immediately post-kiosk check-in.")
    print("-----------------------------------------------------------------")

    records = build_live_demo_patients(
        service_filter=service,
        subcategory_filter=subcategory,
        count_override=count,
        prefix_override=prefix,
    )

    if not records:
        print("No patient tickets generated.")
        return

    print(f"Generated {len(records)} patient ticket(s):")
    print(f"{'Ticket':<10} {'Service':<22} {'Subcategory':<14} {'Status':<12} {'Queue Pos':<10}")
    print("-" * 72)
    for r in records:
        sub = r.get("subcategory") or "-"
        print(f"{r['patientNum']:<10} {r['service']:<22} {sub:<14} {r['status']:<12} {r['queue_position']:<10}")
    print("-" * 72)

    export_patients_to_csv(records, CSV_PATH)
    print(f"Exported to {CSV_PATH}")

    if no_insert:
        print("Skipping Supabase insertion (--no-insert flag active).")
        return

    print("Inserting live tickets into Supabase...")
    if use_rpc:
        success, results = insert_patients_via_rpc(records)
    else:
        success, results = insert_patients_to_supabase(records)

    if success:
        print(f"Successfully seeded {len(results) if results else len(records)} tickets to Supabase.")
        print("Open http://localhost:3000/transfer to view live tickets in intake queue.")
    else:
        print("Supabase insertion encountered an issue. Records remain saved in simulated_patients.csv.")


def main():
    parser = argparse.ArgumentParser(
        description="Heart Check PHC - Queue Seeder for Transfer Hub Demo and Testing",
    )
    parser.add_argument(
        "-s", "--service",
        type=str,
        default=None,
        help="Target a specific clinical service (e.g. Consultation, 'OPD Screening', Warfarin, ECG)",
    )
    parser.add_argument(
        "--subcategory",
        type=str,
        default=None,
        help="Target subcategory (e.g. Adult, Pedia)",
    )
    parser.add_argument(
        "-n", "--count",
        type=int,
        default=None,
        help="Number of patient tickets to generate (defaults to balanced demo mix of 10)",
    )
    parser.add_argument(
        "-p", "--prefix",
        type=str,
        default=None,
        help="Custom ticket prefix override (e.g. 1, 2, 5, 10)",
    )
    parser.add_argument(
        "--no-insert",
        action="store_true",
        help="Generate records and save to CSV only without inserting into Supabase",
    )
    parser.add_argument(
        "--rpc",
        action="store_true",
        help="Use PostgreSQL create_patient stored procedure RPC for insertion",
    )
    parser.add_argument(
        "--historical",
        action="store_true",
        help="Run legacy 30-day historical data simulation instead of live queue generation",
    )

    args = parser.parse_args()

    if args.historical:
        generate_fake_patients(
            num_days=30,
            patients_per_day=120,
            start_date="2026-05-01",
            output_filename=CSV_PATH,
        )
    else:
        run_live_queue_generation(
            service=args.service,
            subcategory=args.subcategory,
            count=args.count,
            prefix=args.prefix,
            no_insert=args.no_insert,
            use_rpc=args.rpc,
        )


if __name__ == "__main__":
    main()
