# Heart Check PHC: Local Network Sharing and Multi-Device Deployment Guide

## Overview

This guide provides exhaustive, step-by-step instructions for running the Heart Check PHC platform on a host server or development workstation and sharing access across a Local Area Network (LAN) or private Wi-Fi network. 

By configuring host bindings and network interfaces, clinical and administrative staff can operate multiple specialized stations simultaneously on separate physical devices:
- Self-Service Touchscreen Kiosk (`/kiosk`) on dedicated kiosk touch hardware.
- Public Queue Display Monitor (`/monitor`) on waiting room smart TVs, HDMI displays, or mini PCs.
- Clinical Transfer Station (`/transfer`) on front-desk laptops or tablets.
- Consultation Cubicle Station (`/nurse`) on clinical tablets (iPad, Galaxy Tab) or desktop computers.
- OPD Analytics & Superadmin Workstation (`/dashboard`, `/superadmin`) on administrator laptops or workstations.
- Station Gateway Selector (`/select-screen`) for rapid workstation selection on any mobile device.

---

## Architecture of Local Network Deployment

In a local clinical deployment, a single host machine (or on-premise local server) runs both the Next.js frontend application and the Python FastAPI analytics backend. All client devices communicate with the host over the local router:

```
                      +---------------------------------------+
                      |         Local Wi-Fi / Router          |
                      |          (Subnet: 192.168.1.0/24)     |
                      +-------------------+-------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
+-------v-----------------------+ +-------v-----------------------+ +-------v-----------------------+
|          Host Server          | |     Touchscreen Kiosk         | |      Public TV Monitor        |
|  IP: 192.168.1.100            | |  IP: 192.168.1.101            | |  IP: 192.168.1.102            |
|  - Next.js (Port 3000)        | |  Browser: Chrome Kiosk Mode   | |  Browser: Fullscreen (F11)    |
|  - FastAPI (Port 8000)        | |  URL: .../kiosk               | |  URL: .../monitor             |
+-------------------------------+ +-------------------------------+ +-------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-----------------------+                                   +-------v-----------------------+
|     Nurse Clinical Tablet     |                                   |   Admin / Doctor Laptop       |
|  IP: 192.168.1.103            |                                   |  IP: 192.168.1.104            |
|  Browser: Safari / Chrome PWA |                                   |  Browser: Edge / Chrome       |
|  URL: .../nurse               |                                   |  URL: .../dashboard           |
+-------------------------------+                                   +-------------------------------+
```

---

## 1. Understanding `npm start` vs `npm run dev`

Next.js provides two ways to run the web server: development mode and production server mode.

### How `npm start` Works in Heart Check PHC

In `package.json`, the `start` script is defined as:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start -H 0.0.0.0 -p 3000",
  "lint": "eslint"
}
```

Key attributes of `npm start`:
1. **Network Interface Binding (`-H 0.0.0.0`):** By default, Next.js binds to `127.0.0.1` (`localhost`), which only permits connections originating from the same physical machine. The `-H 0.0.0.0` flag binds the Next.js server to all network interfaces, allowing external devices (tablets, kiosks, smartphones) on the local subnet to connect.
2. **Port Specification (`-p 3000`):** Fixes the listening port to 3000.
3. **Mandatory Prerequisite (`npm run build`):** The `npm start` command starts the pre-compiled, optimized production server. It requires `npm run build` to have been executed successfully beforehand. Attempting to run `npm start` without building first will result in an error indicating missing build artifacts in `.next`.

### Comparison: `npm start` vs `npm run dev`

| Dimension | `npm start` (Production Mode) | `npm run dev` (Development Mode) |
| :--- | :--- | :--- |
| **Command** | `npm run build && npm start` | `npm run dev` or `next dev -H 0.0.0.0` |
| **Network Exposure** | Binds to `0.0.0.0:3000` automatically. | Binds to `localhost` by default unless passed `-H 0.0.0.0`. |
| **Performance** | Maximum speed; pre-bundled, minified chunks. | Slower; transpiles and compiles routes on demand. |
| **Multi-Device Stability** | High stability; low memory footprint under multi-device load. | Higher CPU/RAM usage; multiple devices trigger simultaneous compilation. |
| **Code Changes** | Requires a new build (`npm run build`) to reflect changes. | Hot Module Reloading (HMR) updates in real time. |
| **Recommended Use** | Station deployments, demonstrations, UAT, production runs. | Active local code editing and UI prototyping. |

If you need Hot Module Reloading while testing across devices during development, run the dev server with the host parameter:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

---

## 2. Determining the Host Machine IP Address

Before external devices can connect, identify the host machine's private IPv4 address on the local network.

### Linux (Ubuntu, Debian, Fedora, Arch)

Open a terminal and run either:

```bash
hostname -I
```

Or for a detailed network interface listing:

```bash
ip -br addr show
```

Look for the interface connected to your router (typically `wlan0`, `wlp2s0`, or `eth0`/`enp3s0`). Your IP address will resemble `192.168.1.xxx`, `192.168.0.xxx`, or `10.0.0.xxx`.

> Note: Ignore `127.0.0.1` (loopback) and `172.17.x.x` / `docker0` (container virtual networks).

### macOS

Open Terminal and run:

```bash
ipconfig getifaddr en0
```

If using Wi-Fi and `en0` returns nothing, try:

```bash
ipconfig getifaddr en1
```

Alternatively, navigate to **System Settings** -> **Wi-Fi** -> Click **Details** next to the active Wi-Fi connection -> Locate **IP Address**.

### Windows (PowerShell or Command Prompt)

Run:

```cmd
ipconfig
```

Locate the active **Wireless LAN adapter Wi-Fi** or **Ethernet adapter**. The value listed beside **IPv4 Address** is your local network IP (e.g., `192.168.1.150`).

### Router Recommendation: Static IP / DHCP Reservation

In clinical environments where kiosks and monitors run continuously, configure a DHCP reservation on your local Wi-Fi router for the host machine. This guarantees the host IP remains constant across reboots and network reconnects.

---

## 3. Environment Variable Configuration (`.env.local`)

When client devices access the web application from remote browsers, client-side JavaScript executes in the context of the remote device. Therefore, any client-side calls to the Python backend or Supabase must use network-reachable addresses rather than `localhost`.

Open or create `.env.local` in the project root:

```ini
# Supabase Configuration (Cloud-hosted or LAN-accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-server-only

# Python FastAPI Analytics Backend
# Crucial: Replace 192.168.1.100 with your actual host machine IP
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000

# Backend CORS Allowed Origins (comma-separated)
# Must include both localhost and the host IP URL
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.100:3000
```

### Why `NEXT_PUBLIC_API_URL` Is Crucial

In files like `app/dashboard/pages/analytics/hooks/useAnalyticsData.ts` and `app/dashboard/context/HistoricalSummaryContext.tsx`, browser code fetches data from the Python analytics engine:

```typescript
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

- If `NEXT_PUBLIC_API_URL` is omitted or set to `http://localhost:8000`, a remote tablet opening `/dashboard` will attempt to request `http://localhost:8000` on the tablet itself, resulting in `ERR_CONNECTION_REFUSED` or network timeout errors.
- Setting `NEXT_PUBLIC_API_URL=http://192.168.1.100:8000` ensures that all remote devices send analytics requests directly to the host machine.
- Note: Next.js embeds `NEXT_PUBLIC_` variables at build time. Whenever you change `NEXT_PUBLIC_API_URL`, you must re-run `npm run build` before starting `npm start`.

### Why `ALLOWED_ORIGINS` Is Crucial

The Python backend in `python_backend/main.py` enforces Cross-Origin Resource Sharing (CORS) rules. When a tablet accesses the web app at `http://192.168.1.100:3000` and issues an API fetch to `http://192.168.1.100:8000`, the browser sends an `Origin: http://192.168.1.100:3000` header.

The backend parses the `ALLOWED_ORIGINS` environment variable from `.env.local`:

```python
allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS")
if allowed_origins_raw:
    allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]
```

Adding `http://<HOST_IP>:3000` to `ALLOWED_ORIGINS` prevents CORS preflight errors from blocking remote tablets.

---

## 4. Host Firewall and Router Permissions

The host machine's firewall must permit incoming TCP connections on ports 3000 (Next.js) and 8000 (FastAPI).

### Linux (UFW Firewall)

If Uncomplicated Firewall (UFW) is active on the Linux host, allow traffic:

```bash
sudo ufw allow 3000/tcp comment "Next.js Frontend"
sudo ufw allow 8000/tcp comment "FastAPI Analytics Backend"
sudo ufw status
```

### Windows Defender Firewall

1. Open **Windows Defender Firewall with Advanced Security**.
2. Select **Inbound Rules** -> **New Rule...**
3. Select **Port** -> **TCP** -> Specific local ports: `3000, 8000`.
4. Select **Allow the connection**.
5. Check **Private** (and Domain if applicable; avoid Public unless necessary).
6. Name the rule `Heart Check PHC (Ports 3000, 8000)` and click **Finish**.

### Wi-Fi Router: Disable "AP Client Isolation"

Hospital guest networks, university Wi-Fi, and some commercial routers enable **AP Client Isolation** (also known as Guest Isolation or Client Isolation). This security feature isolates Wi-Fi clients from one another, preventing a tablet from talking to the host laptop even if both are connected to the same SSID.

To ensure connectivity:
- Connect the host and client devices to a private router or dedicated clinical Wi-Fi network.
- Alternatively, connect the host machine via an Ethernet cable or turn on a mobile Wi-Fi hotspot from a dedicated device.

---

## 5. Step-by-Step Launch Procedure

Follow this exact sequence to launch the platform for multi-device access.

### Step 1: Confirm Host IP and Update Configuration

1. Obtain host IP (e.g., `192.168.1.100`).
2. Verify `.env.local` contains:
   ```ini
   NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
   ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
   ```

### Step 2: Build the Next.js Application

From the project root:

```bash
npm run build
```

Ensure the build finishes without errors. This compiles all pages, server actions, and client bundles with the updated environment configuration.

### Step 3: Start the Next.js Production Server

From the project root:

```bash
npm start
```

Expected output:
```text
▲ Next.js 16.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000
✓ Ready in ...ms
```

### Step 4: Start the Python Analytics Backend

In a second terminal window:

```bash
cd python_backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Note: On Windows PowerShell, use `.\venv\Scripts\Activate.ps1`.

Expected output:
```text
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

The `--host 0.0.0.0` flag ensures the backend listens on all network adapters, permitting incoming API requests from external devices.

### Step 5: Verify Connectivity Locally on the Host

Open a browser on the host machine:
- Open `http://localhost:3000` to verify the frontend.
- Open `http://192.168.1.100:3000` to verify LAN binding.
- Open `http://192.168.1.100:8000/health` or `http://192.168.1.100:8000/docs` to verify backend availability.

---

## 6. Connecting Client Devices and Stations

Ensure each client device (kiosk, monitor, tablet, workstation) is connected to the same Wi-Fi network or local subnet.

### Station URL Directory

Assuming host IP is `192.168.1.100`:

| Station Type | Target URL | Primary Hardware | Interaction Mode |
| :--- | :--- | :--- | :--- |
| **Station Selector Gateway** | `http://192.168.1.100:3000/select-screen` | Any device | Touch / Click portal to all stations |
| **Self-Service Kiosk** | `http://192.168.1.100:3000/kiosk` | Touchscreen Kiosk Terminal | Touch-first, centered, virtual keypad |
| **Public Display Monitor** | `http://192.168.1.100:3000/monitor` | Smart TV / HDMI Mini PC | Non-interactive, real-time audio chime |
| **Clinical Transfer Station** | `http://192.168.1.100:3000/transfer` | Desktop PC / Nurse Tablet | Pointer drag-and-drop & FIFO lock |
| **Consultation Cubicle Station** | `http://192.168.1.100:3000/nurse` | iPad / Android Tablet / Laptop | Click-to-Select tablet mode |
| **Analytics & OPD Dashboard** | `http://192.168.1.100:3000/dashboard` | Admin Desktop / Laptop | Mouse, charts, date-range filtering |
| **System Administration** | `http://192.168.1.100:3000/superadmin` | Admin Desktop / Laptop | Account, role, and cubicle management |

---

## 7. Hardware-Specific Setup Guidelines

### A. Touchscreen Self-Service Kiosk (`/kiosk`)

The Kiosk station requires a distraction-free, full-screen environment:

1. **Browser Kiosk Mode Launch (Chromium / Google Chrome):**
   ```bash
   google-chrome --kiosk --incognito --disable-pinch --overscroll-history-navigation=0 "http://192.168.1.100:3000/kiosk"
   ```
   Or on Windows:
   ```cmd
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --incognito "http://192.168.1.100:3000/kiosk"
   ```
2. **Kiosk Inactivity Reset:** The kiosk includes an automated idle timer (`IDLE_REDIRECT_MS = 180000`, 3 minutes). If a patient leaves midway through check-in, the screen automatically returns to the welcome slideshow.
3. **Thermal Receipt Printer Setup:** 
   - If a physical thermal printer (e.g., EPSON TM-T82 or Xprinter) is connected via USB to the kiosk terminal, configure the browser print settings to automatically print without the system print preview dialog (`--kiosk-printing` flag in Chrome).
   - The ticket generation endpoint is accessible at `http://192.168.1.100:3000/api/print-ticket`.

### B. Public Waiting Room Display Monitor (`/monitor`)

The public monitor requires continuous display and audible audio announcements:

1. **Hardware:** Any TV with an HDMI stick (Google TV / Firestick / Raspberry Pi / Intel N100 Mini PC) running a modern web browser.
2. **Browser Configuration:** Open `http://192.168.1.100:3000/monitor` and press `F11` to enter fullscreen mode.
3. **Audio Autoplay Permission:** Modern browsers block audio autoplay unless user interaction has occurred:
   - Click anywhere on the monitor screen once upon launch to satisfy the browser's audio gesture policy.
   - Alternatively, navigate to `chrome://settings/content/sound` in Chrome and add `http://192.168.1.100:3000` to the **Allowed to play sound** list so queue chimes play uninhibited.

### C. Clinical Tablets for Nurses & Doctors (`/nurse`)

The Nurse Consultation Station is optimized for tablets (iPad or Android):

1. **Add to Home Screen (Standalone App Experience):**
   - **iPad (Safari):** Open `http://192.168.1.100:3000/nurse`, tap the **Share** button, and select **Add to Home Screen**. Launching from the home screen removes URL bars and browser controls.
   - **Android Tablet (Chrome):** Open `http://192.168.1.100:3000/nurse`, tap the three dots menu, and tap **Install App** or **Add to Home screen**.
2. **Tablet Interaction Mode:**
   - In addition to pointer drag-and-drop, the nurse dashboard includes **Click-to-Select Tablet Mode**.
   - Tapping a patient card activates the selection, displaying a floating bottom action banner allowing the nurse to advance the patient to "With Doctor", "Carryout", or "Done" without dragging across touch boundaries.
3. **Zero-Scroll Standard:** The interface is engineered with fixed bounds to fit within standard tablet resolutions (1024x768 and 1280x800) without page-level scrollbars.

---

## 8. Common Troubleshooting Scenarios

### Problem: "This site can't be reached" / `ERR_CONNECTION_TIMED_OUT` on Tablet

- **Root Cause 1: Different Wi-Fi networks.** Verify that both the host laptop and the tablet are on the exact same Wi-Fi SSID. Check if one device is on a 5 GHz band with guest isolation while the other is on 2.4 GHz.
- **Root Cause 2: Host firewall blocking port 3000.** On the host, verify firewall rules (see Section 4). Temporarily disable the firewall to test if connections succeed.
- **Root Cause 3: AP Client Isolation enabled.** Test whether the tablet can ping the host using a network tool like Fing or Terminal. If packets drop, disable client isolation on the router or switch to a portable hotspot.

### Problem: `npm start` Exits with Error: "Could not find a production build"

- **Root Cause:** Next.js requires `npm run build` prior to `npm start`.
- **Resolution:** Execute `npm run build` from the repository root, wait for compilation to complete, then run `npm start`.

### Problem: Analytics Charts Show "Failed to Load" on Remote Tablets

- **Root Cause 1: `NEXT_PUBLIC_API_URL` missing or pointing to `localhost:8000`.** If set to localhost, the remote tablet tries to contact port 8000 on its own loopback interface. Update `.env.local` to point to `http://<HOST_IP>:8000` and re-run `npm run build`.
- **Root Cause 2: CORS rejection on FastAPI backend.** Ensure `ALLOWED_ORIGINS` in `.env.local` contains `http://<HOST_IP>:3000`. Restart the Uvicorn server so changes take effect.
- **Root Cause 3: Backend not bound to `0.0.0.0`.** Ensure Uvicorn is launched with `--host 0.0.0.0` and not `--host 127.0.0.1`.

### Problem: Host IP Address Changed After Reconnecting to Wi-Fi

- **Root Cause:** DHCP leased a new IP address to the host computer.
- **Resolution:**
  1. Check the new IP using `hostname -I` or `ipconfig`.
  2. Update `NEXT_PUBLIC_API_URL` and `ALLOWED_ORIGINS` in `.env.local`.
  3. Re-run `npm run build && npm start`.
  4. Access the new URL on client tablets.
  5. To prevent this permanently, set a static IP or DHCP reservation on the router.

---

## 9. Security and Network Isolation Standards

In accordance with system architectural guidelines:

1. **Service Role Isolation:** The `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is never exposed to client browsers or prefixed with `NEXT_PUBLIC_`. Client components on external tablets communicate with Supabase solely using the public anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) subject to Row Level Security policies.
2. **Server-Side Route Guarding:** Clinical workstations (`/nurse`, `/transfer`, `/dashboard`, `/superadmin`) require valid session authentication enforced by Next.js middleware (`proxy.ts`). Unauthenticated users on the local network cannot access administrative tools without proper credentials.
3. **VLAN Segmentation:** In a live clinical facility, keep patient kiosk touchscreens and public monitor displays on a dedicated clinical VLAN separate from hospital administrative records and internet guests.

---

## 10. Developer "Where to Edit" Reference Map

When modifying configuration scripts, network bindings, or endpoint paths, refer to this directory map:

| Configuration Item | File Path | Architectural Responsibility |
| :--- | :--- | :--- |
| **NPM Scripts & Server Flags** | [`package.json`](file:///home/jensen/Github-Repositories/heart-check-phc/package.json) | Modifies `start` (`-H 0.0.0.0 -p 3000`) and `dev` scripts. |
| **Client Environment Variables** | [`.env.local`](file:///home/jensen/Github-Repositories/heart-check-phc/.env.local) | Configures `NEXT_PUBLIC_API_URL`, `ALLOWED_ORIGINS`, and Supabase keys. |
| **FastAPI Backend Entry Point** | [`python_backend/main.py`](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py) | CORS origins setup, FastAPI routes, and server configuration. |
| **Uvicorn Programmatic Runner** | [`python_backend/run.py`](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/run.py) | Configures host (`0.0.0.0`) and port (`8000`) for Python launcher. |
| **Historical Summary Fetch Context** | [`app/dashboard/context/HistoricalSummaryContext.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/context/HistoricalSummaryContext.tsx) | Base API client URL resolution for dashboard summaries. |
| **Analytics Query Hooks** | [`app/dashboard/pages/analytics/hooks/useAnalyticsData.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/analytics/hooks/useAnalyticsData.ts) | Fetches forecasting, queue metrics, and regression outputs. |
| **Station Selector Gateway** | [`app/select-screen/page.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/select-screen/page.tsx) | Gateway navigation portal for quickly choosing a workstation on any device. |
| **Kiosk Navigation Timing Tokens** | [`app/kiosk/constants/kioskNavigation.ts`](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskNavigation.ts) | Inactivity auto-redirect threshold (`IDLE_REDIRECT_MS = 180000`). |
| **Public Monitor Audio Chime** | [`app/monitor/page.tsx`](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/page.tsx) | Queue callout sound triggering and Supabase Realtime subscriptions. |
