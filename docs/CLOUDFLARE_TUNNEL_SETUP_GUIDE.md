# Cloudflare Tunnel Setup Guide for Heart Check PHC Python Backend

This guide provides step-by-step instructions for securely exposing the local FastAPI Python backend (`python_backend`) to the public internet using Cloudflare Tunnel (`cloudflared`).

---

## Overview

The Heart Check PHC system utilizes a dual-engine architecture:
- **Frontend & Realtime:** Next.js (Workstations, TV Monitors, Kiosks) deployed locally or on Vercel.
- **Analytics & Data Ingestion Backend:** Python FastAPI server handling time-series forecasting, clinic bottleneck reports, and Excel/CSV dataset batch imports into Supabase.

Cloudflare Tunnel creates an encrypted, outbound-only HTTPS connection from your local host to Cloudflare edge servers. This provides:
- **Zero Open Router Ports:** No incoming ports (such as port 80 or 8000) are opened on your router.
- **Hidden Host IP:** Your physical IP address is never visible to clients or the public.
- **Automated SSL/TLS:** Full HTTPS encryption managed automatically by Cloudflare.
- **Cost:** 100% free under Cloudflare Zero Trust.

---

## Prerequisites

1. Operating System: Ubuntu Linux (or Debian-based distribution).
2. Python 3.10+ with the repository virtual environment (`python_backend/venv`).
3. Root or sudo privileges to install packages and systemd services.
4. (Optional for Permanent Named Tunnels) A domain active on Cloudflare DNS.

---

## Step 1: Install `cloudflared` on Ubuntu

Open your OS terminal and execute the following commands:

```bash
# 1. Download the latest 64-bit Debian package
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# 2. Install package via dpkg
sudo dpkg -i cloudflared.deb

# 3. Remove downloaded installation archive
rm cloudflared.deb

# 4. Verify installation
cloudflared --version
```

---

## Step 2: Start the Python Backend

Your FastAPI backend is configured in `python_backend/run.py` to listen on port `8000`.

1. Navigate to the backend directory and activate the virtual environment:
   ```bash
   cd /home/jensen/Github-Repositories/heart-check-phc/python_backend
   source venv/bin/activate
   ```

2. Start the Uvicorn application server:
   ```bash
   python run.py
   ```

3. Confirm that the application starts locally:
   ```text
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   ```

4. Verify local connectivity in a separate terminal:
   ```bash
   curl http://127.0.0.1:8000/health
   # Expected response: {"status":"ok","message":"Analytics backend is running"}
   ```

---

## Step 3: Choose Your Tunnel Mode

Select between a temporary Quick Tunnel or a production Permanent Named Tunnel.

### Option A: Quick Tunnel (Testing & Development Only)

Quick Tunnels do not require an account or domain. Cloudflare assigns a random public URL ending in `.trycloudflare.com`.

1. Run the tunnel command pointing to your local port:
   ```bash
   cloudflared tunnel --url http://127.0.0.1:8000
   ```

2. Locate the generated public URL in the terminal output:
   ```text
   +--------------------------------------------------------------------------------------------+
   |  Your quick Tunnel has been created! Visit it at:                                          |
   |  https://example-random-words.trycloudflare.com                                            |
   +--------------------------------------------------------------------------------------------+
   ```

3. Note on Quick Tunnels:
   - The URL changes every time the process stops and restarts.
   - Whenever the URL changes, you must update `NEXT_PUBLIC_API_URL` and `INTERNAL_API_URL` in your `.env.local` or hosting configuration.

---

### Option B: Permanent Named Tunnel (Recommended for Production / Vercel)

A Named Tunnel provides a permanent, static URL (e.g., `https://api.yourdomain.com`) that never changes across reboots.

#### Method: Cloudflare Zero Trust Dashboard (Recommended)

1. Open the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. In the left navigation, select **Networks** > **Tunnels**.
3. Click **Add a tunnel** and select **Cloudflared**.
4. Enter a name for your tunnel (e.g., `heart-check-phc-backend`) and click **Save tunnel**.
5. Under **Install and run a connector**, select **Debian / Ubuntu 64-bit**.
6. Copy the provided installation command containing your secret token:
   ```bash
   sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
   ```
   Run this command in your Ubuntu terminal. Cloudflare will install and start `cloudflared` as an auto-starting system service.
7. Click **Next** to configure the **Public Hostname**:
   - **Subdomain:** `api` (or preferred name)
   - **Domain:** Select your domain from the dropdown
   - **Type:** `HTTP`
   - **URL:** `localhost:8000`
8. Click **Save tunnel**. Your backend will now be live at `https://api.yourdomain.com`.

---

## Step 4: Configure CORS on the Python Backend

In `python_backend/main.py`, the backend checks the `ALLOWED_ORIGINS` environment variable to permit cross-origin HTTP requests from your frontend.

In `.env.local`, ensure your frontend domains are listed (separated by commas):

```env
# Include both local development origins and your production Vercel domain
ALLOWED_ORIGINS=http://localhost:3000,https://heart-check-phc.vercel.app
```

Restart your Python backend after making changes to `.env.local`.

---

## Step 5: Configure Next.js Environment Variables

Next.js communicates with the Python backend via route rewrites and client requests. Configure the following variables in `.env.local` (and in your Vercel Project Settings for production):

```env
# Must include https:// and must NOT have a trailing slash
INTERNAL_API_URL=https://<your-tunnel-subdomain>.trycloudflare.com
NEXT_PUBLIC_API_URL=https://<your-tunnel-subdomain>.trycloudflare.com
```

*(If using Option B, replace with your custom domain: `https://api.yourdomain.com`).*

### Critical Requirement: Protocol Prefix
Next.js route rewrites in `next.config.ts` require external destinations to begin explicitly with `http://` or `https://`:
- Valid: `https://api.yourdomain.com`
- Invalid: `api.yourdomain.com` (Causes rewrite destination error)
- Invalid: ` https://api.yourdomain.com` (Leading space causes rewrite destination error)

---

## Step 6: Run Backend as a Background Service (systemd)

To keep the FastAPI server running 24/7 without keeping a manual terminal open:

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/heart-check-backend.service
   ```

2. Paste the following configuration:
   ```ini
   [Unit]
   Description=Heart Check PHC FastAPI Analytics Backend
   After=network.target

   [Service]
   User=jensen
   WorkingDirectory=/home/jensen/Github-Repositories/heart-check-phc/python_backend
   ExecStart=/home/jensen/Github-Repositories/heart-check-phc/python_backend/venv/bin/python run.py
   Restart=always
   RestartSec=5
   Environment=PYTHONUNBUFFERED=1

   [Install]
   WantedBy=multi-user.target
   ```

3. Reload systemd, enable the service, and start it:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable heart-check-backend
   sudo systemctl start heart-check-backend
   ```

4. Check the service status:
   ```bash
   sudo systemctl status heart-check-backend
   ```

---

## Step 7: Verification and Troubleshooting

### 1. Verify Health Endpoint
From any external device or browser, visit:
```text
https://<your-tunnel-domain>/health
```
Expected response:
```json
{"status":"ok","message":"Analytics backend is running"}
```

### 2. Verify Swagger Documentation
Open the interactive OpenAPI docs:
```text
https://<your-tunnel-domain>/docs
```

### 3. Verify Excel / CSV File Import
1. Navigate to the Admin Dashboard Import module (`/dashboard` -> Import).
2. Upload a sample `.xlsx` or `.csv` dataset.
3. Verify that the inspection preview returns parsed patient rows.
4. Verify that batch ingestion completes successfully without timeout errors.

### Common Issues

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `destination does not start with '/', 'http://', or 'https://'` | `INTERNAL_API_URL` missing `https://` prefix or contains leading space | Update `.env.local` with exact format: `INTERNAL_API_URL=https://...` and restart Next.js |
| Cloudflare Error 502 Bad Gateway | Python backend is not running or not listening on port 8000 | Verify backend status with `sudo systemctl status heart-check-backend` or restart `python run.py` |
| CORS Blocked in Browser Console | Frontend origin is missing from backend configuration | Add frontend domain to `ALLOWED_ORIGINS` in `.env.local` and restart the backend |
| Cloudflare Error 524 Gateway Timeout | File upload or batch processing took longer than 100 seconds | Cloudflare free tier enforces a 100-second request timeout; reduce import file chunk size or split large datasets |

