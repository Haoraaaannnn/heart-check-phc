# Estimated Wait Time (EWT) — Feature Design Guideline

**Last Updated:** 2026-10-20

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Calculation Strategy](#2-calculation-strategy)
3. [Data Sources and Prerequisites](#3-data-sources-and-prerequisites)
4. [EWT Computation Reference](#4-ewt-computation-reference)
5. [Integration Points](#5-integration-points)
6. [Backend API Design](#6-backend-api-design)
7. [Caveats, Disclaimers, and Edge Cases](#7-caveats-disclaimers-and-edge-cases)
8. [Security and Privacy Checklist](#8-security-and-privacy-checklist)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Cross-References](#10-cross-references)

---

## 1. Feature Overview

The Estimated Wait Time (EWT) feature provides newly queued patients with a real-time, human-readable time estimate from the moment they receive their ticket to the moment they are expected to be called for service. This estimate is computed at ticket generation time and surfaced across three channels:

| Channel | Where |
| :--- | :--- |
| Kiosk screen | Screen 6 (Queue Ticket Generation) — shown on-screen after printing |
| Thermal receipt | Printed directly on the queue ticket slip |
| SMS notification | Included in the initial confirmation SMS sent immediately after ticket generation |

> NOTE: EWT is a projection, not a contract. PHC operational conditions (doctor attendance, patient no-shows, diagnostic delays) introduce variability. The EWT must always be displayed with a disclaimer that the time shown is an estimate only.

---

## 2. Calculation Strategy

### 2.1 Recommended Approach: Hybrid EWT (Position-Based + Historical Rate)

The recommended approach combines two inputs to produce the most accurate, operationally grounded estimate without requiring real-time ML inference at ticket-generation time.

**Formula:**

```
EWT = position_ahead x avg_service_duration_minutes + buffer_minutes
```

| Variable | Description |
| :--- | :--- |
| `position_ahead` | Number of patients already in the queue ahead of the new patient in the same service lane |
| `avg_service_duration_minutes` | Rolling average service duration for the selected service, computed from historical data for the current hour-of-day window (e.g. 7:00-9:00 AM) |
| `buffer_minutes` | A fixed safety margin added to account for doctor start delays, back-to-back processing gaps, and rotation cooldowns (recommended: 5 minutes) |

This approach is tractable because:
- `position_ahead` is derived directly from the live patients table (filterable by service, status = waiting, created_at ordering).
- `avg_service_duration_minutes` is derivable from `consult_start` and `consult_end` timestamps already logged in the `patients` table.
- No external ML inference call is needed at ticket-generation time; the backend computes this inline.

### 2.2 Alternative Approach: M/M/1 Queueing Model (Advanced)

For services with stable, high-volume arrivals (e.g., OPD Screening, Warfarin Clinic), the existing queueing-theory engine in `python_backend/` can be leveraged to compute a more rigorous EWT using the M/M/1 expected waiting time formula:

```
W_q = lambda / (mu * (mu - lambda))
```

This alternative requires a warm path to the FastAPI backend and should be deferred to a later iteration once the simpler hybrid model is validated in production.

---

## 3. Data Sources and Prerequisites

All inputs for EWT computation must be derived from existing live data. No new database columns are required for the calculation itself.

### 3.1 Required Database Queries

**Queue depth (position ahead):**

```sql
SELECT COUNT(*) AS position_ahead
FROM patients
WHERE service = $1
  AND status = 'waiting'
  AND is_historical = false
  AND created_at < $2;
```

- `$1` = service name of the new patient (e.g. `'Adult Cardiology Consultation'`)
- `$2` = `created_at` timestamp of the new patient

**Rolling average service duration for the current hour window:**

```sql
SELECT
  COALESCE(
    AVG(EXTRACT(EPOCH FROM (consult_end - consult_start)) / 60.0),
    15.0
  ) AS avg_duration_minutes
FROM patients
WHERE service = $1
  AND is_historical = false
  AND consult_start IS NOT NULL
  AND consult_end IS NOT NULL
  AND EXTRACT(HOUR FROM consult_start AT TIME ZONE 'Asia/Manila') = $2
  AND consult_end > NOW() - INTERVAL '30 days';
```

- `$1` = service name
- `$2` = current hour in Manila Time (e.g. `8` for the 8:00 AM window)
- The `COALESCE(..., 15.0)` ensures a sensible fallback of 15 minutes per patient if no prior data exists for that hour-service combination.

CAUTION: These queries must only operate on rows where `is_historical = false`. Historical research records are immutable and must never be mutated or mixed into live operational calculations (AGENTS.md Rule 12).

### 3.2 New Column: `estimated_wait_minutes`

Add one nullable integer column to the `patients` table to persist the EWT at point of ticket generation. This allows retrospective accuracy auditing.

```sql
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS estimated_wait_minutes INTEGER;
```

NOTE: Migration scripts belong in `docs/migrations/`. Follow the existing naming convention (e.g. `YYYYMMDD_add_estimated_wait_minutes.sql`) and verify against the live schema in `docs/specifications/DATABASE_SCHEMA.md` before applying.

---

## 4. EWT Computation Reference

### 4.1 Computation Function Signature (TypeScript)

This function runs server-side only inside the `/api/print-ticket` route handler.

```typescript
/**
 * Computes the estimated wait time for a newly queued patient.
 *
 * @param service - The clinical service selected by the patient.
 * @param patientCreatedAt - ISO timestamp when the patient record was inserted.
 * @returns Estimated wait time in minutes, rounded up to the nearest 5 minutes.
 *
 * @remarks
 * Uses a hybrid position-based formula: position_ahead * avg_service_duration + buffer.
 * Falls back to 15 minutes per patient if no historical average is available.
 * Always rounds to the nearest 5-minute bracket to avoid false precision.
 * Never returns a value below 0 or above 180 minutes; clamps at both ends.
 */
async function computeEstimatedWaitMinutes(
  service: string,
  patientCreatedAt: string,
): Promise<number> {
  const BUFFER_MINUTES = 5;
  const FALLBACK_AVG_DURATION = 15;
  const MAX_EWT_MINUTES = 180;

  const positionAhead = await getQueueDepth(service, patientCreatedAt);

  const currentHourManila = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    hour12: false,
  });
  const avgDuration = await getRollingAvgDuration(service, parseInt(currentHourManila, 10));

  const rawEwt = positionAhead * (avgDuration ?? FALLBACK_AVG_DURATION) + BUFFER_MINUTES;
  const clamped = Math.min(Math.max(rawEwt, 0), MAX_EWT_MINUTES);
  return Math.ceil(clamped / 5) * 5;
}
```

### 4.2 Human-Readable Formatting

Always display EWT as a human-readable range, not a single minute count. This softens precision expectations and reduces patient anxiety from false exactness.

| EWT (minutes) | Displayed label |
| :--- | :--- |
| 0 - 9 | "Less than 10 minutes" |
| 10 - 29 | "About 10 - 30 minutes" |
| 30 - 59 | "About 30 minutes - 1 hour" |
| 60 - 119 | "About 1 - 2 hours" |
| 120 - 180 | "About 2 - 3 hours" |
| > 180 | "More than 3 hours" |

TIP: Use a shared utility function `formatEwtLabel(minutes: number): string` exported from `app/kiosk/constants/ewtTexts.ts` so the same label logic is reused across the kiosk screen, print route, and SMS action without duplication.

---

## 5. Integration Points

### 5.1 Kiosk Queue Ticket Screen

**Location:** `app/kiosk/` — Screen 6 (Queue Ticket Generation, after `printTicket` resolves)

**Recommended display layout:**

```
+-------------------------------------+
|       Your Ticket: C-001            |
|       Service: Adult Cardiology     |
|                                     |
|   Estimated Wait Time               |
|   [ About 30 minutes - 1 hour ]     |
|                                     |
|   * This is an estimate only.       |
|     Wait times may vary.            |
+-------------------------------------+
```

**Implementation rules:**
- The EWT label must be displayed in a distinct, readable font size (no smaller than the service name text).
- Use a subtle amber/yellow color token for the EWT value to visually distinguish it from the ticket number (which is the primary identifier).
- Do not use truncation or ellipsis on the EWT label. All text must wrap naturally (AGENTS.md Rule 11).
- The disclaimer text ("This is an estimate only...") must be rendered below the EWT value, not inside the EWT container itself.
- All copy must be sourced from `app/kiosk/constants/ewtTexts.ts` — not hardcoded in JSX (AGENTS.md Rule 2).

**EWT text constants to create (`app/kiosk/constants/ewtTexts.ts`):**

```typescript
export const EWT_TEXTS = {
  sectionLabel: 'Estimated Wait Time',
  disclaimer: 'This is an estimate only. Your actual wait may vary depending on clinic conditions.',
  lessThan10: 'Less than 10 minutes',
  about10to30: 'About 10 to 30 minutes',
  about30to60: 'About 30 minutes to 1 hour',
  about1to2Hours: 'About 1 to 2 hours',
  about2to3Hours: 'About 2 to 3 hours',
  moreThan3Hours: 'More than 3 hours',
} as const;
```

### 5.2 Thermal Receipt Print Format

**Location:** `app/api/print-ticket/route.ts`

The EWT is inserted into the ESC/POS byte stream as a new section between the patient details block and the footer note. This ensures it appears prominently without disrupting the existing barcode and cut sequence.

**Recommended receipt layout:**

```
================================
  PHILIPPINE HEART CENTER
     Outpatient Department
================================
  TICKET:    C-001
  Service:   Adult Cardiology
  Type:      Old Patient
  Date:      2026-10-20  08:32 AM
================================
  Est. Wait: ~30 min - 1 hr
================================
  [BARCODE: C001]

  Please watch the monitor for
  your queue number.

  * Wait time is an estimate.
================================
```

**ESC/POS implementation notes:**

```
[Separator]         "================================"
[Bold ON]           ESC E 1 (0x1B 0x45 0x01)
[Align Left]        ESC a 0 (0x1B 0x61 0x00)
[EWT Line]          "  Est. Wait: ~30 min - 1 hr"
[Bold OFF]          ESC E 0 (0x1B 0x45 0x00)
[Separator]         "================================"
```

**Formatting rules:**
- Prefix the EWT value with `~` (tilde) to visually convey "approximately" without verbose text.
- Keep the EWT line within the standard 32-character thermal receipt width.
- If EWT is unavailable (computation error), print `  Est. Wait: Unavailable` and log the error server-side. Never throw a fatal error that aborts the print job.
- EWT text for receipts must also be sourced from a constants file; add an `EWT_PRINT_TEXTS` export to `app/api/print-ticket/constants/printTexts.ts` (create if not yet present).

**Condensed receipt EWT label map (32-char width constraint):**

| EWT minutes | Printed label |
| :--- | :--- |
| 0 - 9 | `< 10 minutes` |
| 10 - 29 | `~10-30 minutes` |
| 30 - 59 | `~30 min - 1 hr` |
| 60 - 119 | `~1 to 2 hours` |
| 120 - 180 | `~2 to 3 hours` |
| > 180 | `> 3 hours` |

### 5.3 SMS Notification Message

**Location:** `app/actions/sendSMS.ts` — extend the existing `sendSMS` function signature

**Current SMS trigger:** Sent by clinical staff when a patient's ticket is next to be called.

**Proposed change:** Add a second, automatic SMS sent immediately after ticket generation by the kiosk (on successful print). This initial SMS is patient-facing and includes the EWT.

**New server action signature:**

```typescript
/**
 * Dispatches an initial queue confirmation SMS to a newly registered patient.
 *
 * @param phoneNum - Patient's encrypted Philippine mobile number.
 * @param patientNum - Queue ticket identifier (e.g. "C-001").
 * @param service - Service name the patient is queued for.
 * @param ewtMinutes - Computed estimated wait time in minutes.
 * @returns Operation status or sanitized error message.
 *
 * @remarks
 * This action is triggered by the kiosk immediately after successful ticket generation.
 * It must be called server-side only from /api/print-ticket/route.ts.
 * Rate limiting and phone validation rules from sendSMS apply identically here.
 */
export async function sendQueueConfirmationSMS(
  phoneNum: string,
  patientNum: string,
  service: string,
  ewtMinutes: number,
): Promise<{ success?: boolean; error?: string }>;
```

**SMS message template (Filipino/Taglish — consistent with existing message tone):**

```
Heart Check PHC: Matagumpay kang nakapag-pila!

Ticket No.: C-001
Serbisyo: Adult Cardiology

Tinatayang oras ng paghihintay:
~30 minuto hanggang 1 oras

Pakiabangan ang iyong numero sa monitor.
Ang tinatayang oras ay maaaring magbago.
```

**Implementation rules:**
- The `ewtMinutes` parameter must be sanitized (clamped to 0-180) before interpolation.
- The formatted EWT label for SMS must use the same `formatEwtLabel()` utility from `ewtTexts.ts`.
- The SMS template must be defined in a dedicated SMS texts constant — not inline in the action (AGENTS.md Rule 2).
- Never include the patient's full name in the SMS body (AGENTS.md Rule 12 — PII protection).
- The phone number must be decrypted using `decryptPhoneNumber()` before passing to the UniSMS gateway.
- Apply the same sliding-window rate limit and 10-second duplicate cooldown guard already present in `sendSMS.ts`.

WARNING: This new SMS increases per-ticket outbound message count from 1 to 2. Audit the UniSMS monthly quota against projected daily volume before enabling this feature in production to avoid billing overruns (AGENTS.md Rule 12 — Cost Protection).

---

## 6. Backend API Design

### 6.1 EWT Computation Utility (Internal Only)

To avoid blocking the print-ticket route with multiple Supabase queries, extract EWT computation into a dedicated internal utility — not a public-facing route.

**Recommended file layout:**

```
app/
  api/
    print-ticket/
      route.ts            <-- calls computeEstimatedWaitMinutes() inline
      ewtComputation.ts   <-- pure async utility: queries DB, returns minutes
      constants/
        printTexts.ts     <-- EWT print label constants
```

This keeps the EWT logic testable and isolated without adding a new HTTP surface that could be abused.

### 6.2 Persisting EWT to the Database

After computing the EWT, persist it to the `estimated_wait_minutes` column on the patient record before dispatching the print job.

```typescript
await supabase
  .from('patients')
  .update({ estimated_wait_minutes: ewtMinutes })
  .eq('id', patientId)
  .eq('is_historical', false); // Mandatory historical data guard
```

This enables retrospective analysis of EWT accuracy vs. actual wait time (`consult_start - created_at`), which feeds into continuous model improvement.

---

## 7. Caveats, Disclaimers, and Edge Cases

| Scenario | Recommended Handling |
| :--- | :--- |
| Doctor has not arrived yet (no active `in-progress` patients) | Increase `buffer_minutes` to 15 minutes for the first patient of the day; display "Waiting for doctor to begin session" as a secondary label |
| Service lane is empty (`position_ahead = 0`) | Display "You are next! Estimated wait: less than 5 minutes" |
| No historical data for this service-hour combination | Use `FALLBACK_AVG_DURATION = 15` minutes and display "Estimated Wait: Approximately 15 minutes (based on general average)" |
| `consult_end` is null (ongoing consultations) | Exclude those records from the rolling average query; use only completed records |
| EWT computation throws an error | Skip EWT on ticket/SMS/print gracefully; log error server-side; never abort the ticket generation flow |
| Patient is a rotation case (`cooldown_until` is active) | Do not include that patient in `position_ahead` count; they are temporarily suspended from the queue |

---

## 8. Security and Privacy Checklist

This checklist is an extension of the mandatory Pre-Commit Checklist in AGENTS.md, scoped to the EWT feature.

- [ ] `estimated_wait_minutes` column is covered by existing RLS policies; verify INSERT and SELECT are restricted to authenticated clinical roles only.
- [ ] EWT computation queries use parameterized SQL (`$1`, `$2`); no raw string concatenation.
- [ ] All queries include `is_historical = false` guard to protect research records.
- [ ] The new `sendQueueConfirmationSMS` action passes through the same phone validation and rate limit logic as `sendSMS`.
- [ ] `ewtMinutes` is clamped to `[0, 180]` before interpolation into any message string.
- [ ] Patient full name is never included in SMS or ticket display.
- [ ] No new `NEXT_PUBLIC_` environment variables are introduced for EWT feature.
- [ ] EWT computation errors are caught and logged server-side; no raw tracebacks reach the client.
- [ ] UniSMS quota impact of the new initial SMS is reviewed before production rollout.

---

## 9. Implementation Roadmap

Tasks are ordered by dependency. Each task should be treated as a separate, focused pull request.

| Step | Task | Files Affected |
| :---: | :--- | :--- |
| 1 | Add `estimated_wait_minutes` column migration | `docs/migrations/YYYYMMDD_add_estimated_wait_minutes.sql` |
| 2 | Create shared `formatEwtLabel()` utility and `EWT_TEXTS` constants | `app/kiosk/constants/ewtTexts.ts` |
| 3 | Build `computeEstimatedWaitMinutes()` internal utility with DB queries | `app/api/print-ticket/ewtComputation.ts` |
| 4 | Integrate EWT into `/api/print-ticket/route.ts` (DB persist + print line) | `app/api/print-ticket/route.ts`, `app/api/print-ticket/constants/printTexts.ts` |
| 5 | Display EWT on kiosk Screen 6 after print confirmation | `app/kiosk/` (ticket confirmation component) |
| 6 | Create `sendQueueConfirmationSMS` server action | `app/actions/sendSMS.ts` or new `app/actions/sendQueueConfirmationSMS.ts` |
| 7 | Trigger `sendQueueConfirmationSMS` from `/api/print-ticket/route.ts` | `app/api/print-ticket/route.ts` |
| 8 | Validate EWT accuracy: compare `estimated_wait_minutes` vs. `(consult_start - created_at)` | New query in FastAPI analytics or dashboard report |

---

## 10. Cross-References

- [Self-Service Kiosk and Thermal Printing](../../brain/knowledge/kiosk-and-printing.md) — ESC/POS command reference and existing receipt layout
- [Analytics Engine and ML Models](../../brain/knowledge/analytics-and-ml.md) — M/M/1 queueing formulas for the advanced approach
- [Queue and State Transitions](../../brain/architecture/queue-and-state.md) — Patient state machine and FIFO discipline
- [PHC OPD Operational Workflow](../../brain/knowledge/phc-opd-workflow.md) — Service timing benchmarks and patient stages
- [SMS Action (`app/actions/sendSMS.ts`)](../../app/actions/sendSMS.ts) — Existing rate limiting, phone validation, and UniSMS dispatch
- [Database Schema Specification](./DATABASE_SCHEMA.md) — Live schema reference before running migrations
- [System Design Specification](./SYSTEM_DESIGN.md) — Full architectural context

---

_Last updated: 2026-10-20 — Initial design guideline for Estimated Wait Time (EWT) feature covering kiosk screen, thermal receipt, and SMS channels._
