# Docker Offline Execution Guide

Execution-focused operational manual for launching Heart Check PHC in 100% air-gapped offline mode using Docker Compose and Local Supabase.

---

## 1. System Topology & Architecture

When running in offline demonstration mode, all cloud dependencies are replaced with local containers on the host laptop:

```
+-------------------------------------------------------------------------------+
|                            Host Machine (Linux / Laptop)                      |
|                                                                               |
|  +------------------------------+       +----------------------------------+  |
|  | heartcheck-frontend          | ----> | heartcheck-python-backend        |  |
|  | Next.js 16 (Port 3000)       |       | FastAPI Analytics (Port 8000)    |  |
|  +------------------------------+       +----------------------------------+  |
|                 |                                         |                   |
|                 +--------------------+--------------------+                   |
|                                      |                                        |
|                       +-------------------------------+                       |
|                       | supabase_db_heart-check-phc   |                       |
|                       | Local Supabase (Port 54321)   |                       |
|                       +-------------------------------+                       |
+-------------------------------------------------------------------------------+
```

- **Frontend Workstations:** `http://localhost:3000` (Next.js container)
- **Analytics Engine:** `http://localhost:8000` (FastAPI container)
- **Database, Auth & Realtime:** `http://localhost:54321` (Local Supabase container)
- **Studio Admin Console:** `http://localhost:54323`

---

## 2. Phase 1: Pre-Presentation Preparation (Internet Required)

Run these two commands while connected to the internet before heading to the presentation room.

### Step 1: Start the Local Supabase Container
```bash
npx supabase start
```
*Note: Starts PostgreSQL, GoTrue, Kong, and Realtime containers.*

### Step 2: One-Command Cloud Database Sync
```bash
npm run db:sync
```
*What this does automatically:*
1. Dumps the latest schema and data from your live Supabase Cloud project (`ewpvlsbbmkxuahhaezvo`).
2. Resets the local `public` schema so that all deletions made in Cloud are completely wiped locally.
3. Restores clean records and re-publishes Supabase Realtime tables.

---

## 3. Phase 2: Launch Offline Docker Stack (Zero Internet Required)

You can now disconnect Wi-Fi or turn off cellular data.

### Step 1: Launch Containers
```bash
docker compose --env-file .env.demo up --build -d
```
*Flags:*
- `--env-file .env.demo`: Injects offline environment variables and local database keys.
- `--build`: Recompiles Next.js and FastAPI images with current code.
- `-d`: Runs containers in background detached mode.

### Step 2: Verify Health Status
```bash
docker compose ps
```
Both `heartcheck-frontend` and `heartcheck-python-backend` should display `Up (healthy)`.

---

## 4. Phase 3: Station URLs & Clinical Access

Open these URLs in Google Chrome browser tabs or client devices on the local network:

| Workstation Role | Localhost URL | LAN Sharing URL |
| :--- | :--- | :--- |
| **Self-Service Kiosk** | `http://localhost:3000/kiosk` | `http://<LAN-IP>:3000/kiosk` |
| **Public TV Monitor** | `http://localhost:3000/monitor` | `http://<LAN-IP>:3000/monitor` |
| **Consultation Cubicle** | `http://localhost:3000/nurse` | `http://<LAN-IP>:3000/nurse` |
| **Triage / Transfer Desk** | `http://localhost:3000/transfer` | `http://<LAN-IP>:3000/transfer` |
| **Analytics Dashboard** | `http://localhost:3000/dashboard` | `http://<LAN-IP>:3000/dashboard` |
| **Database Studio Console** | `http://localhost:54323` | N/A (Host only) |

### Demonstration Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Superadmin** | `jensenurrutia18@gmail.com` | Cloud password or `password123` |
| **Nurse** | `nurse@nurse.com` | Cloud password or `password123` |
| **Registration Staff** | `register@register.com` | Cloud password or `password123` |

---

## 5. Phase 4: Operational Commands & Teardown

### View Live Logs
```bash
# Stream logs from both containers
docker compose logs -f

# Stream only backend or frontend logs
docker compose logs -f python_backend
docker compose logs -f frontend
```

### Restart a Specific Service
```bash
docker compose restart python_backend
docker compose restart frontend
```

### Stop the Offline Stack
```bash
# Stop Next.js and FastAPI containers
docker compose down

# Stop Local Supabase container (frees ~2 GB system RAM)
npx supabase stop
```

---

## 6. Execution Troubleshooting

### 1. Docker Daemon Connection Error
```bash
# Symptom: "failed to connect to the docker API at unix:///var/run/docker.sock"
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Port Conflict (Port 3000 or 8000 already in use)
```bash
# Check what process is holding port 3000 or 8000
sudo lsof -i :3000
sudo lsof -i :8000

# Terminate stale development servers
kill -9 <PID>
```

### 3. Deletions Not Visible Locally
If rows were deleted in Cloud but still appear in Docker:
```bash
# Ensure internet is connected and run clean sync
npm run db:sync
```

