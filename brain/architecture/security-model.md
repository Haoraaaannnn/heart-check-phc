# Security Model & Route Guarding

This document outlines the zero-trust security architecture, credential isolation protocols, authentication mechanisms, and API safeguards implemented across **Heart Check PHC**.

---

## 1. Two-Tier Access Control Model

Access control is enforced at two distinct, non-overlapping architectural layers:

```
Request from Client / Browser
             │
             ▼
[Layer 1: Server Middleware & Route Guarding (proxy.ts)]
- Verifies session tokens & JWT integrity
- Validates user role against requested path (/nurse, /transfer, /superadmin)
- Redirects unauthorized callers before rendering UI
             │
             ▼
[Layer 2: Supabase PostgreSQL Row-Level Security (RLS)]
- Evaluates auth.uid() and role claim at the database layer
- Enforces row-level isolation between live and historical patient data
- Restricts INSERT, UPDATE, DELETE permissions per table
```

### Zero-Trust Session Verification
- Client-side route guards (such as React hooks or client components) serve purely as visual conveniences to prevent UI flashing.
- **Client checks are never treated as security boundaries.**
- All authorization decisions are strictly validated on the server prior to data retrieval or state mutation.

---

## 2. Principle of Least Privilege & Service-Role Isolation

- **Client-Side Boundary:**
  - Client components must exclusively instantiate the Supabase client using `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - All client requests are subject to Postgres RLS policies.
- **Service-Role Isolation:**
  - The Supabase Service Role Key bypasses all RLS policies and grants administrative table access.
  - **The service-role key must NEVER be exposed to client-side bundles or environment variables prefixed with `NEXT_PUBLIC_`.**
  - Use of the service-role client is strictly confined to server-only Route Handlers (`app/api/*`) and internal CLI maintenance scripts.

---

## 3. Route Handlers & Input Validation

1. **Zod Validation in Next.js:**
   - Every API Route Handler (`app/api/**/route.ts`) validates incoming JSON bodies and query parameters against explicit Zod schemas.
   - Malformed payloads are rejected immediately with structured `400 Bad Request` responses before database queries execute.
2. **Pydantic Validation in FastAPI:**
   - FastAPI endpoints (`python_backend/routers/*`) enforce strict Pydantic models with explicit type constraints, numeric ranges, and string lengths.
3. **Defense Against SQL Injection:**
   - All database interactions use parameterized queries via the Supabase client SDK or parameterized query builders.
   - Raw string interpolation or concatenation into SQL queries is strictly prohibited.

---

## 4. Authentication & Account Protection

- **Brute-Force Rate Limiting:**
  - The `/api/auth/login` endpoint records failed authentication attempts in the `login_attempts` audit table.
  - Accounts are temporarily locked after consecutive failed attempts, displaying a cooldown countdown banner to the user.
- **Session Cookie Flags:**
  - Session cookies enforce `HttpOnly` (preventing access by client-side scripts), `Secure` (in production environments), and `SameSite=Lax` / `Strict` to prevent Cross-Site Request Forgery (CSRF).
- **Password Reset Safeguards:**
  - Password reset tokens expire after 15 minutes.
  - Tokens are single-use only and invalidated immediately upon consumption via `password_reset_attempts`.

---

## 5. Cross-Service Interconnection Security (Next.js to FastAPI)

- **Network Timeouts:**
  - All HTTP requests from Next.js Route Handlers to the Python FastAPI backend are wrapped in an `AbortController` configured with an explicit **10-second timeout**.
  - Prevents upstream FastAPI processing delays from causing connection pool exhaustion in Next.js.
- **Error Sanitization:**
  - Errors returned from FastAPI or Supabase are intercepted and sanitized before returning to the browser.
  - Raw Python stack traces, internal database error codes, and server file paths are stripped and logged internally.
- **CORS Configuration:**
  - FastAPI explicitly whitelists trusted origins (`ALLOWED_ORIGINS`). Wildcard origins (`allow_origins=["*"]`) are forbidden on production analytical endpoints.

---

## 6. Content Protection & XSS Mitigation

- React's native string escaping is used across all rendered components.
- The use of `dangerouslySetInnerHTML` is prohibited.
- User-supplied inputs (patient names, phone numbers, notes) are sanitized and stripped of executable markup.

---

## Cross-References

- [Database & RLS Policies](./database-and-rls.md)
- [System Architecture Overview](./overview.md)
- [Common System Issues & Troubleshooting](../debugging/common-issues.md)
