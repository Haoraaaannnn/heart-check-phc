#!/bin/bash
set -e
cd "$(dirname "$0")"
source ./venv/bin/activate
python db_seeder.py
python import_seeder_to_supabase.py
