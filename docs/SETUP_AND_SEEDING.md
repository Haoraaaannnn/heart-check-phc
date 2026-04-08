# Heart Check PHC Setup and Seeding Guide

## Overview
This guide explains how to install and run the frontend, backend, and seeder for Heart Check PHC. It also explains how to automate simulated patient seeding.

---

## 1. Clone the repository

```bash
git clone https://github.com/NejChoco/heart-check-phc.git
cd heart-check-phc
```

If you already have it cloned, make sure you are on the correct branch:

```bash
git checkout Feat-Printing
git pull origin Feat-Printing
```

---

## 2. Frontend setup

### Install Node.js dependencies

From the repository root:

```bash
npm install
```

### Run the frontend

```bash
npm run dev
```

Open the app in your browser:

- `http://localhost:3000`

---

## 3. Backend setup

The backend lives in `python_backend/`.

### Create and activate a Python virtual environment

```bash
cd python_backend
python3 -m venv venv
source venv/bin/activate
```

### Install Python requirements

```bash
pip install -r requirements.txt
```

### Add Supabase environment variables

Create a `.env.local` file in the repository root (next to `README.md`):

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> Note: This file is local only. Do not commit your keys to public repositories.

### Run the backend

From `python_backend/` with the venv active:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API endpoints are:

- `http://localhost:8000/health`
- `http://localhost:8000/api/dashboard-data`

---

## 4. Manual seeding

The seeder script generates realistic simulated patient queue data.

### Run the seeder

From `python_backend/` with the venv active:

```bash
python db_seeder.py
```

This produces:

- `python_backend/simulated_patients.csv`

### Import seed data into Supabase

The repo includes an import helper at `python_backend/import_seeder_to_supabase.py`.

From `python_backend/` with the venv active:

```bash
python import_seeder_to_supabase.py
```

This reads `simulated_patients.csv` and inserts records into the Supabase `patients` table.

Optional limit control:

```bash
SEED_IMPORT_LIMIT=100 python import_seeder_to_supabase.py
```

---

## 5. Automatic seeding

If you want the simulated patient data to refresh automatically, use a small shell wrapper and cron/scheduler.

### Create an auto-seed script

Create `python_backend/auto_seed.sh` with these contents:

```bash
#!/bin/bash
set -e
cd "$(dirname "$0")"
source ./venv/bin/activate
python db_seeder.py
```

Make it executable:

```bash
chmod +x python_backend/auto_seed.sh
```

### Run automatic seeding on a schedule

Use cron on Linux/macOS.

Open your crontab:

```bash
crontab -e
```

Add an entry to run seeding every day at 2:00 AM:

```cron
0 2 * * * cd /full/path/to/heart-check-phc/python_backend && /bin/bash ./auto_seed.sh >> ./auto_seed.log 2>&1
```

Replace `/full/path/to/heart-check-phc` with the real path on your machine.

### Optional: seed to Supabase automatically

If you want the import to run after generation, update `auto_seed.sh` to:

```bash
#!/bin/bash
set -e
cd "$(dirname "$0")"
source ./venv/bin/activate
python db_seeder.py
python import_seeder_to_supabase.py
```

Then the cron job will regenerate and import fresh data automatically.

---

## 6. Full run order

1. Clone repository
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `cd python_backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
4. Set up `.env.local` with Supabase values
5. Start backend: `python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`
6. Start frontend: `npm run dev`
7. Seed data manually: `python python_backend/db_seeder.py`
8. Import seed data if needed: `python python_backend/import_seeder_to_supabase.py`

---

## 7. Notes for GitHub and other devices

- Yes, pushing the repo to GitHub shares the code and project files.
- No, local `NEXT_PUBLIC_SUPABASE_*` keys are not automatically shared.
- Each laptop must clone the repo, install dependencies, and create its own `.env.local`.
- The seeder script is part of the repo, so it will work on every machine once dependencies are installed.

---

## 8. Troubleshooting

- If the frontend cannot reach the backend, check that the backend is running on `localhost:8000`.
- If the dashboard shows no analytics, confirm your Supabase `patients` table has rows or import seeded data.
- If `uvicorn` fails, make sure you are using the `venv` Python interpreter.
