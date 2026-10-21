# Thermal Receipt Printer Setup & Architecture Guide

**Last Updated:** 2026-10-21

Comprehensive technical specification and operational instructions for configuring ESC/POS thermal receipt printers across **Heart Check PHC** workstations and touchscreen kiosks.

---

## 1. Architectural Overview: Solving Web-Based Hardware Printing

Web browsers operate inside a strict security sandbox that isolates web pages from direct operating system drivers and physical local hardware buses. Historically, printing to thermal receipt printers from web applications required:
1. Hardcoded physical USB connection to the specific host server machine running Linux device nodes (`/dev/usb/lp0`).
2. Manual elevated terminal execution (`sudo chmod 666 /dev/usb/lp*`) on every system boot or hardware reconnection.
3. Inability for tablets, mobile phones, or remote workstations to trigger ticket printing.

**Heart Check PHC** resolves this through a **Hybrid Dual-Tier Printer Engine** supporting both direct plug-and-play USB detection and network-wide wireless printing:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          HEART CHECK PHC WEB CLIENTS                            │
│           (Touchscreen Kiosk / Nurse Station / Tablets / Smartphones)            │
└───────────────┬─────────────────────────────────────────────────┬───────────────┘
                │                                                 │
   [Tier 1: Direct USB Detection]                   [Tier 2: Network / Ethernet]
   WebUSB / Web Serial API (navigator.usb)          POST /api/print-ticket
                │                                                 │
                ▼                                                 ▼
   ┌──────────────────────────┐                    ┌──────────────────────────────┐
   │ Chromium Web Sandbox     │                    │ Next.js Backend Handler      │
   │ Direct Bulk OUT Endpoint │                    │ Parameterized ESC/POS Stream │
   └────────────┬─────────────┘                    └──────────────┬───────────────┘
                │                                                 │
                │                                                 ▼
                │                                  TCP/IP Raw Socket (Port 9100)
                │                                                 │
                ▼                                                 ▼
   ┌──────────────────────────┐                    ┌──────────────────────────────┐
   │ Physical USB Printer     │                    │ Clinic LAN Thermal Printer   │
   │ (Attached to Device)     │                    │ (Ethernet / Router Switch)   │
   └──────────────────────────┘                    └──────────────────────────────┘
```

---

## 2. Tier 1: Direct USB Detection via WebUSB (Zero Commands)

### How It Works
Modern Chromium browsers (Google Chrome, Microsoft Edge, Opera, Chromium kiosk builds) support the **WebUSB API** (`navigator.usb`) and **Web Serial API** (`navigator.serial`). This allows the web application to communicate directly with USB thermal receipt printers from the browser without invoking shell commands or server device nodes.

### Setup Instructions
1. **Connect Printer:** Plug the thermal printer USB cable into the kiosk touchscreen PC, laptop, or Android tablet.
2. **Open Browser:** Launch Google Chrome or Microsoft Edge and navigate to Heart Check PHC (`https://.../kiosk` or `/superadmin/customization`).
3. **One-Time Pairing:**
   - In `/superadmin/customization`, navigate to the **Hardware Thermal Receipt Printer** card.
   - Tap **Pair USB Printer**.
   - A native browser modal appears displaying connected USB devices. Select your thermal printer (e.g. *POS-80*, *Epson TM-T82*, *Xprinter*, or *USB Printing Support*) and click **Connect**.
4. **Automatic Detection:**
   - Once authorized, the browser origin permanently stores hardware permissions.
   - When the kiosk reloads or when the printer is unplugged and reconnected, the web application **automatically detects** the peripheral via hardware event listeners (`navigator.usb.addEventListener('connect')`).
   - Zero terminal commands or scripts are ever needed on daily operation.

---

## 3. Tier 2: Network / Ethernet IP Printing (Port 9100)

### How It Works
Connecting the thermal printer directly to the hospital/clinic local area network (LAN) provides universal device compatibility. Any device on the clinic Wi-Fi (nurse tablets, registration desks, patient smartphones, and touchscreen kiosks) can print queue tickets without any physical USB cables connected to the user device.

### Setup Instructions
1. **Physical Cabling:** Connect the thermal printer's RJ-45 Ethernet port to the clinic router or network switch using a standard Cat5e/Cat6 cable.
2. **Identify Printer IP Address:**
   - Turn off the printer power switch.
   - Press and hold the **FEED** button while switching power **ON**.
   - Release the button after 2 seconds. The printer outputs a self-test diagnostic slip showing its IP address (e.g., `192.168.1.200` or DHCP address).
3. **Configure Heart Check PHC:**
   - **Option A (Environment Variable):** In your `.env.local` file, specify:
     ```bash
     PRINTER_IP=192.168.1.200
     ```
   - **Option B (SuperAdmin Panel):** Open `/superadmin/customization`, enter the IP address in the **Network Printer IP Address** field, and tap **Save Local IP**.
4. **Test Network Socket:**
   - Tap **Test Network Socket (Port 9100)** to dispatch a test receipt.
   - The backend connects directly over TCP socket port 9100 with a strict 4-second timeout and delivers the ESC/POS ticket stream.

---

## 4. Permanent Linux udev Rule (Eliminating `sudo chmod` Forever)

If you are running the kiosk or server directly on Linux (e.g. Ubuntu, Debian, Raspberry Pi OS) and accessing `/dev/usb/lp*`, Linux by default assigns device nodes to `root:lp` with restrictive permissions (`0660`), causing `EACCES (Permission Denied)` unless elevated commands are executed.

To make Linux automatically grant access to ANY plugged-in thermal printer permanently with **zero terminal commands** on subsequent boots, install this standard udev rule once:

### Installation (One-Time Setup)
1. Create a udev rule file:
   ```bash
   sudo nano /etc/udev/rules.d/99-thermal-printer.rules
   ```
2. Paste the following configuration:
   ```udev
   # Universal permissions for USB Thermal Receipt Printers (Class 7)
   SUBSYSTEM=="usb", ATTRS{bInterfaceClass}=="07", MODE="0666", GROUP="lp"
   KERNEL=="lp[0-9]*", SUBSYSTEM=="usbmisc", MODE="0666", GROUP="lp"
   ```
3. Reload udev rules:
   ```bash
   sudo udevadm control --reload-rules && sudo udevadm trigger
   ```

After completing this one-time configuration, whenever a thermal receipt printer is plugged into any USB port, Linux automatically assigns `0666` permissions. No user or script ever needs to execute `chmod` again.

### 4.1 Linux Kernel `usblp` vs WebUSB `claimInterface`
On Linux, when a USB thermal printer (USB Class 7) is connected, the Linux kernel module `usblp` automatically binds to Interface 0 and exposes `/dev/usb/lp*`.
- When Chrome attempts to claim the same interface via `device.claimInterface(0)`, the Linux kernel returns `EBUSY`, which Chrome reports as `NetworkError: Unable to claim interface`.
- **Automatic System Fallback:** The Heart Check PHC application detects this condition automatically. When `claimInterface` is claimed by the host kernel, the system seamlessly routes the ESC/POS print job through the local `/dev/usb/lp*` device node, ensuring immediate printing without error.
- On Windows and Android, the `usblp` kernel driver does not exist; WebUSB claims the interface directly with zero conflicts.

---

## 5. Non-Linux Operating Systems (Windows, Android Kiosks & Tablets)

The `chmod` command and `/dev/usb/lp*` device nodes are exclusive to Linux. If your touchscreen kiosk or tablet runs **Windows** or **Android**, you **never** need to run terminal commands:

### A. Windows Touchscreens & Kiosks
- **No Command Prompt Needed:** Windows does not have `chmod` or permission blocks on user-space USB devices.
- **WebUSB Detection:** 
  1. Plug the printer into any USB port. Windows automatically configures the hardware via Plug-and-Play.
  2. In Google Chrome or Microsoft Edge, navigate to `/superadmin/customization` and click **Pair USB Printer**.
  3. Select your printer and click **Connect**.
  4. Chrome saves this permission permanently. Whenever the printer is disconnected and plugged back in, the web app detects it automatically.
- **Native Silent Printing Alternative:** If you have installed standard manufacturer Windows drivers (e.g., Epson APD or POS-80 driver), you can also launch Chrome in silent kiosk mode with the flag:
  ```cmd
  chrome.exe --kiosk --kiosk-printing "https://your-domain.phc/kiosk"
  ```
  This prints tickets silently without displaying any print preview dialogs.

### B. Android Kiosks & Tablets (Samsung Galaxy Tab, Sunmi, Elo Touch)
- **Zero Terminal Commands:** Android has no command line interface for users.
- **USB Plug-and-Play Detection:**
  1. Connect the printer to the Android tablet using a standard USB-C / OTG adapter cable.
  2. Android displays a native operating system permission prompt:
     *"Allow Chrome to access [USB Device]?"* with a checkbox *"Always open Chrome when this device is connected"*.
  3. Tap **Always Allow** and select **OK**.
  4. The web application immediately gains persistent hardware access. Auto-detection functions on every check-in without prompting again.
- **Wireless Network Mode (Recommended for Android Tablets):**
  - Connect the printer to your clinic router using an Ethernet cable.
  - The Android tablet communicates wirelessly over the clinic Wi-Fi. When the patient confirms check-in, the server transmits the ESC/POS stream directly to Port 9100.
  - No physical cables are needed on the patient touchscreen tablet.

### C. Apple iPad & iOS Devices
- Apple Safari on iOS restricts the WebUSB API. 
- For iPad-based kiosks or mobile nurse workstations, use **Tier 2 (Network / Ethernet Socket Port 9100)**: tickets dispatch wirelessly over the clinic network to the shared printer with zero setup on the iPad.

---

## 6. Kiosk Automatic Failover Flow

During patient check-in at `/kiosk/pages/queue-print`:
1. The kiosk client requests ticket registration from `/api/print-ticket`.
2. The server verifies patient registration in Supabase (`is_historical = false`), computes Estimated Wait Time (EWT), and triggers SMS confirmation.
3. **Execution Hierarchy:**
   - If a Network IP printer is configured (`PRINTER_IP`), the server dispatches via raw TCP socket (Port 9100).
   - If a local `/dev/usb/lp*` device node is present on the server, the server writes directly to the device node.
   - If neither server-side method is connected, the server returns the base64 ESC/POS payload (`escposBase64`).
   - The client kiosk checks its browser WebUSB connection. If paired, it immediately streams the ESC/POS ticket over USB.
   - If no hardware printer is connected or if paper is exhausted, the kiosk smoothly presents the on-screen digital ticket and SMS confirmation without freezing or crashing.

---

## 7. Thermal Print Darkness & Density Optimization

When thermal prints appear faint or washed out, the cause is typically brief heating pulse duration or degraded paper coating. The system implements software-level thermal density optimization across all print templates:

1. **Heating Control (`ESC 7 \x07 \x14 \x02`):**
   - Instructs the printer controller to increase the dot burn time to 200 microseconds (`\x14`), enabling the heat-sensitive paper dye to fully react and produce solid black characters.
2. **Double-Strike Mode (`ESC G \x01`):**
   - Activates dual-pulse thermal burn per dot, significantly enhancing text thickness and contrast across non-bold fields.
3. **Hardware Checks:**
   - **Thermal Head Cleaning:** Clean the ceramic heating strip using a cotton swab moistened with isopropyl alcohol.
   - **Thermal Paper Quality:** Perform the fingernail scratch test; good paper produces an instant jet-black mark.
   - **Cradle & Roller Latch:** Ensure both sides of the printer lid click firmly shut to maintain constant platen pressure.

---

## 8. Developer & Security Checklist

- [x] Zero emojis in documentation, code, and comments.
- [x] Input sanitization strips illegal ESC/POS control sequences (`sanitizeText`).
- [x] Defensive patient verification before print generation (SEC-029).
- [x] Hardware mutex lock (`isPrinterBusy`) serializes concurrent writes.
- [x] Network socket timeout strictly capped at 4,000ms.
- [x] Host IP validation rejects malformed strings and prevents SSRF.
- [x] Diagnostic endpoint `/api/superadmin/test-printer` guarded by `requireSuperadmin`.
- [x] High-density thermal heating parameters configured across ESC/POS templates.
