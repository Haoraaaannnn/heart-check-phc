# Vercel Kiosk Tablet & Laptop USB Thermal Printer Bridge Guide

**Last Updated:** 2026-11-06  
**System:** Heart Check PHC  

---

## 1. Problem Overview & Hardware Constraints

This setup addresses the following physical deployment scenario:
1. **Cloud Deployment:** The Heart Check PHC system is hosted live on **Vercel** (`https://your-domain.vercel.app`).
2. **Kiosk on Tablet:** The self-service patient intake kiosk (`/kiosk`) is displayed on a tablet running in a web browser.
3. **No Tablet OTG:** The tablet has no USB OTG adapter, preventing the thermal printer from connecting directly to the tablet.
4. **Printer Wired to Laptop:** The ESC/POS thermal receipt printer is plugged directly into a laptop via a standard USB cable.
5. **Cloud-to-Local Barrier:** Vercel functions run in AWS serverless data centers and cannot communicate directly with private IP addresses or local device nodes (`/dev/usb/lp0`).

---

## 2. Architecture: Supabase Realtime Cloud-to-Hardware Bridge

Both the tablet (on Vercel) and the laptop connect to the same **Supabase** cloud database. 

Instead of routing print jobs through local network requests or cables, the system uses **Supabase Realtime WebSockets** as a high-speed wireless bridge:

```
┌─────────────────────────────────┐
│         PATIENT TABLET          │
│   (Vercel: .../kiosk)           │
│                                 │
│   Patient completes check-in    │
│   and confirms registration     │
└───────────────┬─────────────────┘
                │
                ▼  (Cloud HTTPS)
┌─────────────────────────────────┐
│        SUPABASE DATABASE        │
│   Row inserted into `patients`  │
└───────────────┬─────────────────┘
                │
                ▼  (Realtime WebSocket Event in ~50ms)
┌─────────────────────────────────┐
│           YOUR LAPTOP           │
│   Running `print-bridge.mjs`    │
│   Catches new patient event     │
└───────────────┬─────────────────┘
                │
                ▼  (Writes binary ESC/POS stream to /dev/usb/lp0)
┌─────────────────────────────────┐
│     PHYSICAL THERMAL PRINTER    │
│   Ticket prints immediately     │
└─────────────────────────────────┘
```

- When a patient finishes check-in on the tablet, a new row is inserted into the `patients` table.
- A lightweight Node.js script on the laptop catches the `INSERT` event over WebSockets in approximately 50 to 100 milliseconds.
- The laptop immediately compiles the ESC/POS receipt commands and writes them to `/dev/usb/lp0`.
- The receipt prints right next to the laptop with zero cables attached to the tablet.

---

## 3. Step-by-Step Setup Guide

### Step 1: Configure Linux USB Permissions on Your Laptop

On Linux, USB printer device nodes are owned by `root:lp` with restricted permissions. Grant write permissions to your user account:

#### One-Time Permanent Rule (Recommended)
Create a udev rule so permissions persist across reboots and reconnections:
```bash
sudo nano /etc/udev/rules.d/99-thermal-printer.rules
```
Paste the following lines:
```udev
SUBSYSTEM=="usb", ATTRS{bInterfaceClass}=="07", MODE="0666", GROUP="lp"
KERNEL=="lp[0-9]*", SUBSYSTEM=="usbmisc", MODE="0666", GROUP="lp"
```
Reload the udev service:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

#### Quick Temporary Grant
If testing immediately:
```bash
sudo chmod 666 /dev/usb/lp*
```

Verify your printer is detected:
```bash
ls -l /dev/usb/lp*
```
You should see `/dev/usb/lp0` with `crw-rw-rw-` permissions.

---

### Step 2: Create the Print Bridge Script

Create the bridge script at `scripts/print-bridge.mjs` in your repository:

```javascript
/**
 * @file scripts/print-bridge.mjs
 * @description Local hardware print bridge connecting cloud Supabase to a USB thermal printer.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : process.env[key];
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[ERROR] Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Identify available Linux USB printer node
function getPrinterDevice() {
  const candidates = ['/dev/usb/lp0', '/dev/usb/lp1', '/dev/usb/lp2'];
  for (const node of candidates) {
    if (fs.existsSync(node)) return node;
  }
  return null;
}

// 3. Build ESC/POS formatted receipt matching project specifications
function buildTicketEscPos(patient) {
  const ESC = '\x1b';
  const GS = '\x1d';
  const RESET = ESC + '@';
  const HIGH_DENSITY = ESC + '7\x07\x14\x02';
  const DOUBLE_STRIKE_ON = ESC + 'G\x01';
  const DOUBLE_STRIKE_OFF = ESC + 'G\x00';
  const CENTER = ESC + 'a\x01';
  const LEFT = ESC + 'a\x00';
  const BOLD_ON = ESC + 'E\x01';
  const BOLD_OFF = ESC + 'E\x00';
  const LARGE_FONT = GS + '!\x11';
  const NORMAL_FONT = GS + '!\x00';
  const CUT = GS + 'V\x00';

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const timeStr = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const cubicle =
    patient.cubicleNum ||
    (Array.isArray(patient.preferredCubicleNums) && patient.preferredCubicleNums[0]) ||
    'Waiting Area';
  const displayCubicle = cubicle === 'Waiting Area' ? cubicle : cubicle.replace(/^cubicle\s*/i, '');

  return (
    RESET +
    HIGH_DENSITY +
    DOUBLE_STRIKE_ON +
    CENTER +
    BOLD_ON +
    'PHILIPPINE HEART CENTER\nQUEUE TICKET\n' +
    BOLD_OFF +
    '================================\n' +
    LEFT +
    `Date: ${dateStr}\n` +
    `Time: ${timeStr} (PHT)\n` +
    BOLD_ON +
    `Service: ${patient.service || 'General Service'}\n` +
    `Cubicle: ${displayCubicle}\n` +
    BOLD_OFF +
    '--------------------------------\n' +
    CENTER +
    LARGE_FONT +
    BOLD_ON +
    `${patient.patientNum}\n` +
    BOLD_OFF +
    NORMAL_FONT +
    '--------------------------------\n' +
    CENTER +
    'Mangyaring maghintay na tawagin\n' +
    'ang inyong numero sa Rehistrasyon.\n\n' +
    'Please wait for your number\n' +
    'to be called at Registration.\n' +
    '================================\n' +
    '\n\n\n\n\n' +
    CUT
  );
}

// 4. In-memory deduplication set
const printedIds = new Set();

async function handlePrint(patient) {
  if (!patient || !patient.patientNum || printedIds.has(patient.id)) return;
  printedIds.add(patient.id);

  const printerNode = getPrinterDevice();
  if (!printerNode) {
    console.warn(`[WARNING] Ticket ${patient.patientNum} created, but no /dev/usb/lp* device was detected on laptop.`);
    return;
  }

  try {
    const rawData = buildTicketEscPos(patient);
    fs.writeFileSync(printerNode, Buffer.from(rawData, 'binary'));
    console.log(`[SUCCESS] Printed Ticket ${patient.patientNum} for ${patient.service} on ${printerNode}`);
  } catch (err) {
    console.error(`[ERROR] Failed to write to ${printerNode}:`, err.message);
  }
}

// 5. Connect and subscribe to Supabase Realtime
console.log('----------------------------------------------------');
console.log('Heart Check PHC - Hardware Print Bridge Active');
console.log(`Target Printer: ${getPrinterDevice() || 'None detected (plug in USB printer)'}`);
console.log('Waiting for ticket creation from Vercel kiosk...');
console.log('----------------------------------------------------');

supabase
  .channel('kiosk-hardware-print-bridge')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patients' }, (payload) => {
    if (payload.new && !payload.new.is_historical) {
      handlePrint(payload.new);
    }
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[READY] Subscribed to Supabase Realtime.');
    }
  });
```

---

### Step 3: Run the Print Bridge on Your Laptop

In your terminal on the laptop:
```bash
node scripts/print-bridge.mjs
```

Expected startup output:
```text
----------------------------------------------------
Heart Check PHC - Hardware Print Bridge Active
Target Printer: /dev/usb/lp0
Waiting for ticket creation from Vercel kiosk...
----------------------------------------------------
[READY] Subscribed to Supabase Realtime.
```

Leave this terminal window running in the background during your kiosk testing or operation.

---

### Step 4: Test from the Tablet

1. Open your Vercel deployment on the tablet:
   ```text
   https://your-domain.vercel.app/kiosk
   ```
2. Complete patient intake (select patient type, service, and submit).
3. The moment the ticket is confirmed on the tablet, the laptop terminal will log:
   ```text
   [SUCCESS] Printed Ticket C001 for Consultation on /dev/usb/lp0
   ```
4. The ticket cuts and ejects from the thermal printer.

---

## 4. Operational Checklist & Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `Target Printer: None detected` | Printer is unplugged or switched off. | Ensure the USB cable is firmly connected to your laptop and power switch is ON. Run `ls -l /dev/usb/lp*`. |
| `[ERROR] Failed to write to /dev/usb/lp0: EACCES` | Linux permission restriction. | Run `sudo chmod 666 /dev/usb/lp0` or verify the udev rule in Step 1. |
| `[ERROR] Missing Supabase credentials` | `.env.local` not found in root. | Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are defined in `.env.local`. |
| Ticket prints blank or text is faint | Thermal paper roll inserted backward or low heat. | Flip paper roll so the heat-sensitive side faces the thermal head. The script automatically applies high-density heating pulses (`ESC 7`). |
| Tablet displays fallback screen | Tablet browser cannot reach local hardware. | This is expected behavior on Vercel without local USB. The fallback screen allows patients to take a photo or receive SMS while the laptop prints the physical paper slip. |

