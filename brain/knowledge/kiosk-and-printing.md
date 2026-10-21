# Self-Service Kiosk & Thermal Receipt Printing

This document details the architecture, touchscreen interface standards, step progression, and thermal printing mechanics of the **Heart Check PHC Self-Service Check-In Kiosk**.

---

## 1. Kiosk Screen Progression Flow

The kiosk application (`/kiosk`) guides patients through an intuitive self-check-in workflow:

```
[Screen 1: Category Selection]
       │  Select General Consultation, Specialized Diagnostic, or Triage
       ▼
[Screen 2: Patient Type Selection]
       │  Choose "New Patient" (first check-in) or "Old Patient" (returning)
       ▼
[Screen 3: Service Selection]
       │  Card grid: Consultation, Screening, Warfarin, Benzathine, ECG, etc.
       ▼
[Screen 4: Cubicle Preference (Optional)]
       │  Select specific doctor cubicle if previously directed
       ▼
[Screen 5: SMS Notification Input]
       │  Touchscreen numeric keypad for mobile phone number
       │  Values encrypted using AES-256-GCM before database write
       ▼
[Screen 6: Queue Ticket Generation]
       │  Dispatches print command to /api/print-ticket
       │  Shows printed ticket animation with 5-second auto-reset timer
```

---

## 2. Kiosk UI Centering & Layout Rules (AGENTS.md Rule 9)

To ensure usability across varied touchscreen heights and physical kiosk enclosures:

1. **Universal Centering:**
   - All interactive contents, banners, card grids, instructions, and numeric keypads must be **vertically and horizontally centered** between the top navigation bar and the wave footer.
2. **In-Flow Back Button (Non-Overflow):**
   - The back button is strictly rendered in-flow inside a dedicated `topNavWrapper` container.
   - It must never float, use absolute positioning, or collide with screen headers.
3. **Scrollable Card Containers:**
   - On screens with multiple cards (`kiosk-services`, `kiosk-cubicle-selection`), the container is centered using `m-auto flex flex-col items-center justify-center`.
   - Content must never stick to the top or leave asymmetric gaps at the bottom.
4. **No Text Truncation:**
   - Long clinical service names (e.g. "Pediatric Cardiology Consultation") must wrap naturally without ellipsis.

---

## 3. Thermal Receipt Printing (`/api/print-ticket`)

The kiosk connects to an ESC/POS thermal receipt printer (e.g. Epson TM-T88, Xprinter, or POS-80) via USB serial or local TCP/IP socket.

### ESC/POS Command Generation

The Route Handler `app/api/print-ticket/route.ts` generates raw byte streams:

```
[Initialize Printer]       ESC @ (0x1B 0x40)
[Align Center]             ESC a 1 (0x1B 0x61 0x01)
[Bold Header Text]         "PHILIPPINE HEART CENTER"
                           "Outpatient Department"
[Separator Line]           "--------------------------------"
[Ticket Code (Double Size)] GS ! 0x11 (0x1D 0x21 0x11)
                           "TICKET: C001"
[Normal Size Details]      "Service: Adult Cardiology"
                           "Type: Old Patient"
                           "Date: 2026-10-16 08:32 AM"
[Barcode / Code 128]       GS k 73 ... "C001"
[Footer Note]              "Please watch the monitor for your number"
[Paper Feed & Cut]         GS V 66 0 (0x1D 0x56 0x42 0x00)
```

### Hardware Status Telemetry & On-Screen Fallback
- **ESC/POS Status Probing (`DLE EOT 1-4`):** Real-time bitwise polling detects `out_of_paper`, `paper_jam`, `cover_open`, and `offline` conditions.
- **Unrestricted Queueing Without Printer:** Queue intake at the kiosk is never blocked by missing or faulty printers; patients can queue freely via Continue/Skip.
- **On-Screen Digital Fallback:** When physical tickets cannot be printed, an on-screen fallback card (`QueuePrintFallbackCard.tsx`) provides smartphone photo guidance, on-demand SMS delivery (`/api/print-ticket/send-sms`), masked phone display, and immediate completion controls with a 25-second countdown.

---

## 4. Print Queue Ticket Format (`queue_prefix` & `queue_pad_length`)

Printed queue tickets are formatted using service parameters configured in the SuperAdmin `/superadmin/customization` module:

- **Queue Prefix (`queue_prefix`):** The first letter or number printed on the ticket (e.g. `C` for Consultation, `S` for OPD Screening, `1` for Room 1).
- **Digit Padding (`queue_pad_length`):** The zero-padded numeric length following the prefix (default `3`, yielding `001` to `999` for tickets like `C001`, or `4` yielding `10001`).
- The ticket code is calculated sequentially each day and resets each morning at 00:00 Manila Time (+08:00).

---

## Cross-References

- [PHC OPD Operational Workflow](./phc-opd-workflow.md)
- [Thermal Receipt Printer Setup Guide (`docs/specifications/PRINTER_SETUP_GUIDE.md`)](../../docs/specifications/PRINTER_SETUP_GUIDE.md)
- [Kiosk Developer Guide (`app/kiosk/README.md`)](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/README.md)
- [Common System Issues & Troubleshooting](../debugging/common-issues.md)

---

_Last updated: 2026-10-21 — Reconciled with dual-mode WebUSB and Network Socket Port 9100 printer architecture._

