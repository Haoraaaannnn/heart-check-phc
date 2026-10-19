# Common System Issues & Troubleshooting Playbook

This document details diagnostic steps and resolutions for frequently encountered issues across **Heart Check PHC**.

---

## 1. Thermal Printer Connection Timeouts (`/api/print-ticket`)

### Symptoms
- The kiosk check-in flow freezes at the final screen or logs a 504 Gateway Timeout.
- The physical printer fails to feed paper or cut the ticket.

### Root Causes
- USB-to-Serial adapter cable disconnected or mapped to a different COM/tty port.
- Network IP printer unreachable on the local subnet (IP changed via DHCP).
- Printer buffer full or paper roll exhausted.

### Resolution Steps
1. Verify physical connectivity and power indicators on the thermal printer.
2. In `app/api/print-ticket/route.ts`, check the configured printer socket host and port.
3. Test direct socket connectivity from the terminal:
   ```bash
   nc -zv <PRINTER_IP> 9100
   ```
4. Confirm paper roll is properly seated with thermal side facing the print head.
5. Note: The API enforces a 5-second socket timeout; ensure the printer's keep-alive response is within this window.

---

## 2. Supabase RLS Policy Infinite Recursion

### Symptoms
- Database queries fail with PostgreSQL error code `42P17` (`infinite recursion detected in policy for relation ...`).
- Kiosk check-in or staff login hangs indefinitely.

### Root Causes
- An RLS policy on `patients` or `cubicles` contains a subquery that references the same table without using `SECURITY DEFINER` helper functions.

### Resolution Steps
1. Inspect the active RLS policy in Supabase SQL editor:
   ```sql
   SELECT tablename, policyname, qual FROM pg_policies WHERE schemaname = 'public';
   ```
2. Replace recursive inline subqueries with a dedicated PostgreSQL function marked `SECURITY DEFINER`:
   ```sql
   CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean 
   SECURITY DEFINER STABLE AS $$
     SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin');
   $$ LANGUAGE sql;
   ```
3. Update the RLS policy to call `is_admin()` directly.

---

## 3. Cross-Origin Resource Sharing (CORS) Errors with FastAPI

### Symptoms
- The Next.js frontend console reports: `Access to fetch at 'http://localhost:8000/api/...' has been blocked by CORS policy`.

### Root Causes
- FastAPI backend `ALLOWED_ORIGINS` does not match the frontend origin port (e.g. `localhost:3000` vs `127.0.0.1:3000`).

### Resolution Steps
1. Check `python_backend/main.py` CORS middleware configuration.
2. Ensure `ALLOWED_ORIGINS` includes both IPv4 loopback and localhost variants:
   ```python
   ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
       "http://192.168.*.*" # If running across local clinic LAN
   ]
   ```
3. Note: In production, client requests should proxy through Next.js Route Handlers (`app/api/*`) rather than calling FastAPI directly from the browser.

---

## 4. WebSocket Drops & Disconnect Loops

### Symptoms
- Waiting room monitor (`/monitor`) fails to update ticket callouts in real time.
- Status badge on `/transfer` repeatedly alternates between "Connected" and "Reconnecting".

### Root Causes
- Hospital Wi-Fi dropping idle TCP connections.
- Supabase Realtime channel subscription limit exceeded.

### Resolution Steps
1. Verify WebSocket heartbeat in browser DevTools Network tab (Filter: `WS`).
2. Verify that component cleanup functions properly unsubscribe from channels:
   ```typescript
   useEffect(() => {
     const channel = supabase.channel('queue_changes').subscribe();
     return () => { supabase.removeChannel(channel); };
   }, []);
   ```
3. Check fallback HTTP polling interval (should automatically trigger after 3 failed reconnects).

---

## Cross-References

- [Database Troubleshooting](./database-troubleshooting.md)
- [Network Resilience & Offline Safeguards](../architecture/network-resilience.md)
- [Security Model & Route Guarding](../architecture/security-model.md)
