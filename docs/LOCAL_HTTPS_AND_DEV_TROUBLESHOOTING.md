# Heart Check PHC: Local HTTPS Development, Python Backend & CSP Troubleshooting Guide

**Last Updated:** 2026-11-28

This guide explains how local development runs in **Heart Check PHC**, including the automatic HTTPS Caddy gateway, trusting self-signed browser certificates, running the FastAPI Python backend, and fixing `Failed to fetch` / Content Security Policy (CSP) errors.

---

## 1. Two Ways to Run the Frontend in Dev Mode

From the repository root (`package.json`):

| Command | Mode | URL | Proxy / Gateway |
| :--- | :--- | :--- | :--- |
| `npm run dev` | HTTPS Gateway (`scripts/dev-https.mjs`) | `https://localhost` (and `https://<LAN-IP>`) | Caddy reverse proxy on port `443` forwarding to Next.js (`127.0.0.1:3000`) and FastAPI (`127.0.0.1:8000`) |
| `npm run dev:plain` | Direct HTTP (`next dev --webpack`) | `http://localhost:3000` | Next.js built-in `rewrites()` forwarding `/api/*` and `/health` to `http://127.0.0.1:8000` |

### How `npm run dev` Sets Up Local HTTPS
1. `scripts/ensure-certs.mjs` checks for `certificates/localhost.pem` and `certificates/localhost-key.pem`. If missing, it generates a 365-day self-signed certificate via `openssl` with Subject Alternative Names (SANs) for `localhost`, `127.0.0.1`, and your current LAN IPv4 addresses.
2. `scripts/gateway-utils.mjs` checks if Caddy is installed and binds port `443` using `./Caddyfile`.
   - On Linux, if Caddy cannot bind port `443` without root, grant the capability once:
     ```bash
     sudo setcap 'cap_net_bind_service=+ep' $(which caddy)
     ```
   - If Caddy is unavailable or port `443` cannot bind, `npm run dev` prints a warning and falls back to `http://localhost:3000`.
3. Launches Next.js on `127.0.0.1:3000`.

---

## 2. Trusting the Local Self-Signed Certificate in Your Browser

Because `certificates/localhost.pem` is self-signed for offline/LAN clinic use, browsers will initially show a **"Your connection is not private"** (`ERR_CERT_AUTHORITY_INVALID`) warning on `https://localhost`.

### Quick Per-Session Bypass
- Click **Advanced** -> **Proceed to localhost (unsafe)** in Chromium/Chrome/Edge (or **Advanced** -> **Accept the Risk and Continue** in Firefox).
- Note: WebUSB, WebSocket, and `fetch()` calls can behave more strictly if the certificate is not permanently trusted—especially on LAN tablets or mobile devices.

### Permanent Local Trust (Linux)
1. **Chrome / Chromium / Edge (NSS database):**
   - Open `chrome://settings/certificates` -> **Authorities** tab -> **Import** -> select `certificates/localhost.pem` -> check **"Trust this certificate for identifying websites"**.
   - Or via CLI (`libnss3-tools`):
     ```bash
     certutil -d sql:$HOME/.pki/nssdb -A -t "P,," -n "HeartCheckPHC-Localhost" -i certificates/localhost.pem
     ```
2. **Firefox:**
   - Open `about:preferences#privacy` -> **Certificates** -> **View Certificates** -> **Authorities** -> **Import** `certificates/localhost.pem` and trust it for websites.

*(If you regenerate `certificates/localhost.pem` later, re-import the updated certificate.)*

---

## 3. Running the Python FastAPI Backend in Dev Mode

The analytics, forecasting, drill-down, Excel export, and import endpoints run in `python_backend/`.

```bash
cd python_backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Or without auto-reload using the built-in launcher (`python_backend/run.py`):

```bash
cd python_backend
source venv/bin/activate
python run.py
```

### Verification & Environment Loading
- `python_backend/main.py` automatically loads `../.env.local` from the repository root (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Verify the backend is healthy by opening:
  - `http://127.0.0.1:8000/health`
  - `http://127.0.0.1:8000/docs` (FastAPI Swagger UI)

---

## 4. Fixing `Failed to fetch` / Content Security Policy (CSP) Errors

### Symptom
Browser DevTools Console shows:
> `Refused to connect to 'http://localhost:8000/...' because it violates the document's Content Security Policy`

and the UI displays `Failed to fetch`.

### Why This Happens
1. Both `next.config.ts` and `Caddyfile` define a strict CSP `connect-src` directive:
   ```text
   connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.deepgram.com;
   ```
2. If `.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8000` (or a component falls back to `http://localhost:8000`), the browser tries to connect directly to `http://localhost:8000` instead of `'self'` (`https://localhost` or `http://localhost:3000`).
3. Because `http://localhost:8000` is neither `'self'` nor listed in `connect-src`, the browser blocks the request. Calling `http://localhost:8000` from `https://localhost` also triggers Mixed Content and CORS restrictions (`python_backend/main.py` default `allowed_origins` only lists `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:3001`, and `http://127.0.0.1:3001`).

### Recommended Fix (Use the Built-In Same-Origin Proxy)
Both `Caddyfile` (for `npm run dev` on port `443`) and `next.config.ts` `rewrites()` (for `npm run dev:plain` on port `3000`) already proxy these FastAPI routes to `http://127.0.0.1:8000`:
- `/api/dashboard-data`
- `/api/daily-drilldown`
- `/api/available-export-dates`
- `/api/export-excel`
- `/api/import-file`
- `/health`

To route requests through `'self'` (eliminating CSP, Mixed Content, and CORS issues):
1. Leave `NEXT_PUBLIC_API_URL` empty (or unset) in `.env.local` when developing locally:
   ```env
   NEXT_PUBLIC_API_URL=
   ```
   *(Set `NEXT_PUBLIC_API_URL` only when targeting an external HTTPS backend such as Railway/Hugging Face that is also permitted in `connect-src`.)*
2. Ensure client hooks use relative `/api/...` URLs (empty string fallback `''` instead of `'http://localhost:8000'`).
3. Restart `npm run dev` after editing `.env.local` so Next.js picks up the updated environment variable.

### Alternative (Plain HTTP Only)
If you must call `http://localhost:8000` directly from the browser during local HTTP testing:
- Use `npm run dev:plain` (`http://localhost:3000`), **and** temporarily allow `http://localhost:8000 http://127.0.0.1:8000` in `connect-src` inside `next.config.ts` for non-production environments.
- This will not work on `https://localhost` because browsers block `http://` requests from `https://` pages (Mixed Content).

---

## 5. Quick Troubleshooting Checklist

| Error / Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| `Your connection is not private` on `https://localhost` | Self-signed cert not yet trusted in browser | Trust `certificates/localhost.pem` in browser Authorities (Section 2) or use `npm run dev:plain` |
| `violates the document's Content Security Policy` (`connect-src`) | `NEXT_PUBLIC_API_URL=http://localhost:8000` bypassing same-origin proxy | Clear `NEXT_PUBLIC_API_URL=` in `.env.local` so calls use `/api/...` (`'self'`) and restart dev server |
| `Mixed Content` in Console | `https://localhost` page fetching `http://` API URL | Use relative `/api/...` paths through Caddy/Next.js proxy |
| `502 Bad Gateway` or `ERR_CONNECTION_REFUSED` on `/api/*` | Python backend is not running on port `8000` | Start `uvicorn main:app --host 127.0.0.1 --port 8000 --reload` inside `python_backend/` |
| Port `443` proxy inactive warning on `npm run dev` | Caddy missing or lacks bind permission on port `443` | Run `sudo setcap 'cap_net_bind_service=+ep' $(which caddy)` or access `http://localhost:3000` |
