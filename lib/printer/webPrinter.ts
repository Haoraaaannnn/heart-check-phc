/**
 * @fileoverview Client-side WebUSB and Web Serial Driver for Thermal Receipt Printers.
 *
 * Enables direct browser-to-printer communication via modern Chromium Web APIs
 * (WebUSB / Web Serial), eliminating the need for local server execution,
 * host shell commands, or operating system permissions (such as sudo chmod /dev/usb/lp*).
 *
 * Key Capabilities:
 * - Persistent Auto-Detection: Automatically detects previously paired printers upon page load.
 * - Hardware Hot-Plug Events: Listens for USB cable attachment and detachment in real time.
 * - Universal Thermal Support: Streams ESC/POS binary buffers directly to bulk OUT USB endpoints
 *   or virtual COM ports.
 * - Zero Terminal Commands: Operates entirely within the browser sandbox with user consent.
 *
 * @module lib/printer/webPrinter
 */

import {
  MinimalUSBDevice,
  MinimalUSBManager,
  MinimalSerialPort,
  MinimalSerialManager,
  PrinterConnectionType,
  PrinterStatus,
  WebUsbPrintResult,
} from './types';
import { getTimestamp } from '@/lib/logger';

/** Cached reference to the active or paired WebUSB device. */
let activeUsbDevice: MinimalUSBDevice | null = null;

/** Cached reference to the active or paired WebSerial port. */
let activeSerialPort: MinimalSerialPort | null = null;

/**
 * Checks whether the current browser supports the WebUSB API.
 *
 * @returns True if running in a Chromium browser with WebUSB enabled over HTTPS or localhost.
 */
export function isWebUsbSupported(): boolean {
  return typeof window !== 'undefined' && 'usb' in navigator && Boolean((navigator as unknown as { usb: MinimalUSBManager }).usb);
}

/**
 * Checks whether the current browser supports the Web Serial API.
 *
 * @returns True if running in a browser with Web Serial enabled.
 */
export function isWebSerialSupported(): boolean {
  return typeof window !== 'undefined' && 'serial' in navigator && Boolean((navigator as unknown as { serial: MinimalSerialManager }).serial);
}

/**
 * Gets the browser's native USB manager if available.
 */
function getUsbManager(): MinimalUSBManager | null {
  if (!isWebUsbSupported()) return null;
  return (navigator as unknown as { usb: MinimalUSBManager }).usb;
}

/**
 * Gets the browser's native Serial manager if available.
 */
function getSerialManager(): MinimalSerialManager | null {
  if (!isWebSerialSupported()) return null;
  return (navigator as unknown as { serial: MinimalSerialManager }).serial;
}

/**
 * Probes the browser for already authorized/paired USB thermal printers.
 *
 * @returns Promise resolving to an array of paired USB devices.
 */
export async function getPairedUsbPrinters(): Promise<MinimalUSBDevice[]> {
  const manager = getUsbManager();
  if (!manager) return [];

  try {
    const devices = await manager.getDevices();
    if (devices.length > 0 && !activeUsbDevice) {
      activeUsbDevice = devices[0];
    }
    return devices;
  } catch (err) {
    console.warn(`${getTimestamp()} [WEBUSB PROBE ERROR]`, err);
    return [];
  }
}

/**
 * Probes the browser for already authorized/paired Serial ports.
 *
 * @returns Promise resolving to an array of paired Serial ports.
 */
export async function getPairedSerialPrinters(): Promise<MinimalSerialPort[]> {
  const manager = getSerialManager();
  if (!manager) return [];

  try {
    const ports = await manager.getPorts();
    if (ports.length > 0 && !activeSerialPort) {
      activeSerialPort = ports[0];
    }
    return ports;
  } catch (err) {
    console.warn(`${getTimestamp()} [WEBSERIAL PROBE ERROR]`, err);
    return [];
  }
}

/**
 * Prompts the user with the browser's native USB pairing modal.
 * Must be triggered by a direct user gesture (button tap or click).
 *
 * @returns Promise resolving to the newly authorized USB device, or null if cancelled.
 */
export async function pairUsbPrinter(): Promise<MinimalUSBDevice | null> {
  const manager = getUsbManager();
  if (!manager) {
    throw new Error('WebUSB is not supported in this browser. Please use Chrome, Edge, or a Chromium browser.');
  }

  try {
    // We request without restrictive filters so any brand (Epson, Xprinter, POS-58, POS-80) can be paired
    const device = await manager.requestDevice({ filters: [] });
    activeUsbDevice = device;
    console.log(
      `${getTimestamp()} [WEBUSB PAIRED] Authorized device:`,
      device.productName || `Vendor 0x${device.vendorId.toString(16)}`
    );
    return device;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('No device selected') || message.includes('cancelled')) {
      console.log(`${getTimestamp()} [WEBUSB CANCELLED] User cancelled pairing modal.`);
      return null;
    }
    console.error(`${getTimestamp()} [WEBUSB PAIR ERROR]`, message);
    throw err;
  }
}

/**
 * Prompts the user with the browser's native Serial port pairing modal.
 * Must be triggered by a direct user gesture.
 *
 * @returns Promise resolving to the newly authorized Serial port, or null if cancelled.
 */
export async function pairSerialPrinter(): Promise<MinimalSerialPort | null> {
  const manager = getSerialManager();
  if (!manager) {
    throw new Error('Web Serial is not supported in this browser.');
  }

  try {
    const port = await manager.requestPort();
    activeSerialPort = port;
    console.log(`${getTimestamp()} [WEBSERIAL PAIRED] Authorized serial port`);
    return port;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('No port selected') || message.includes('cancelled')) {
      return null;
    }
    throw err;
  }
}

/**
 * Retrieves the current composite printer connectivity status.
 *
 * @returns Current status object reflecting paired and detected hardware.
 */
export async function getClientPrinterStatus(): Promise<PrinterStatus> {
  const isSupported = isWebUsbSupported() || isWebSerialSupported();

  if (!isSupported) {
    return {
      connected: false,
      type: 'none',
      name: 'WebUSB Unsupported',
      details: 'Browser does not support WebUSB/Serial. Use Chrome or Edge.',
      isSupported: false,
    };
  }

  // 1. Check for paired USB devices
  const usbDevices = await getPairedUsbPrinters();
  if (usbDevices.length > 0) {
    const dev = usbDevices[0];
    const name = dev.productName || `USB Thermal Printer (0x${dev.vendorId.toString(16)})`;
    return {
      connected: true,
      type: 'webusb',
      name,
      details: dev.manufacturerName || 'Direct USB Interface',
      isSupported: true,
    };
  }

  // 2. Check for paired Serial ports
  const serialPorts = await getPairedSerialPrinters();
  if (serialPorts.length > 0) {
    return {
      connected: true,
      type: 'webserial',
      name: 'Serial / COM Thermal Printer',
      details: 'Baud: 9600 / 115200',
      isSupported: true,
    };
  }

  return {
    connected: false,
    type: 'none',
    name: 'No Printer Paired',
    details: 'Tap to pair USB printer',
    isSupported: true,
  };
}

/**
 * Sends binary ESC/POS data to a WebUSB thermal printer.
 *
 * @param device - Target USB device.
 * @param data - Raw ESC/POS byte array.
 * @returns Promise resolving to true if write succeeded.
 */
export async function writeEscPosToUsbDevice(
  device: MinimalUSBDevice,
  data: Uint8Array
): Promise<boolean> {
  try {
    if (!device.opened) {
      await device.open();
    }

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Locate the first OUT bulk endpoint
    let targetEndpointNumber: number | null = null;
    let targetInterfaceNumber: number = 0;

    for (const iface of device.configuration.interfaces) {
      for (const alt of iface.alternates) {
        for (const ep of alt.endpoints) {
          if (ep.direction === 'out' && ep.type === 'bulk') {
            targetEndpointNumber = ep.endpointNumber;
            targetInterfaceNumber = iface.interfaceNumber;
            break;
          }
        }
        if (targetEndpointNumber !== null) break;
      }
      if (targetEndpointNumber !== null) break;
    }

    // If no bulk OUT found, fallback to endpoint 1 or 2
    if (targetEndpointNumber === null) {
      targetEndpointNumber = 1;
      targetInterfaceNumber = 0;
    }

    try {
      await device.claimInterface(targetInterfaceNumber);
    } catch (claimErr: unknown) {
      const claimMsg = claimErr instanceof Error ? claimErr.message : String(claimErr);
      if (claimMsg.includes('claimInterface') || claimMsg.includes('Unable to claim interface')) {
        console.warn(
          `${getTimestamp()} [WEBUSB INTERFACE BUSY] USB Interface ${targetInterfaceNumber} is claimed by host OS (Linux usblp driver).`
        );
        const kernelClaimError = new Error('WEBUSB_INTERFACE_CLAIMED_BY_KERNEL');
        kernelClaimError.cause = claimErr;
        throw kernelClaimError;
      }
      throw claimErr;
    }

    await device.transferOut(targetEndpointNumber, data);
    await device.releaseInterface(targetInterfaceNumber);

    console.log(
      `${getTimestamp()} [WEBUSB PRINT SUCCESS] Transferred ${data.byteLength} bytes to USB printer`
    );
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('WEBUSB_INTERFACE_CLAIMED_BY_KERNEL')) {
      console.warn(
        `${getTimestamp()} [WEBUSB NOTICE] Host operating system (Linux usblp) is managing USB interface. Passing to fallback handler.`
      );
    } else {
      console.error(`${getTimestamp()} [WEBUSB WRITE ERROR]`, err);
    }
    throw err;
  } finally {
    try {
      if (device.opened) {
        await device.close();
      }
    } catch {
      // Ignore close errors
    }
  }
}

/**
 * Sends binary ESC/POS data to a Web Serial thermal printer.
 *
 * @param port - Target serial port.
 * @param data - Raw ESC/POS byte array.
 * @returns Promise resolving to true if write succeeded.
 */
export async function writeEscPosToSerialPort(
  port: MinimalSerialPort,
  data: Uint8Array
): Promise<boolean> {
  const baudRates = [9600, 115200, 38400];
  let lastError: Error | null = null;

  for (const baudRate of baudRates) {
    try {
      await port.open({ baudRate });
      const writer = port.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      await port.close();

      console.log(
        `${getTimestamp()} [WEBSERIAL PRINT SUCCESS] Transferred ${data.byteLength} bytes at ${baudRate} baud`
      );
      return true;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      try {
        await port.close();
      } catch {
        // Ignore close error on retry
      }
    }
  }

  if (lastError) throw lastError;
  return false;
}

/**
 * Dispatches a base64-encoded ESC/POS ticket to any actively connected client-side printer.
 *
 * @param base64Payload - Base64 encoded ESC/POS ticket string.
 * @returns Structured result indicating whether client-side printing completed.
 */
export async function printViaConnectedWebPrinter(
  base64Payload: string
): Promise<{ success: boolean; method: PrinterConnectionType; message?: string }> {
  if (!base64Payload) {
    return { success: false, method: 'none', message: 'No payload provided' };
  }

  // Convert base64 to Uint8Array
  const binaryString = window.atob(base64Payload);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 1. Try active or discovered WebUSB device
  const usbDevices = await getPairedUsbPrinters();
  if (usbDevices.length > 0) {
    try {
      const success = await writeEscPosToUsbDevice(usbDevices[0], bytes);
      if (success) {
        return { success: true, method: 'webusb', message: 'Printed via WebUSB' };
      }
    } catch (usbErr: unknown) {
      const msg = usbErr instanceof Error ? usbErr.message : String(usbErr);
      console.warn(`${getTimestamp()} [WEBUSB PRINT RETRY NOTICE] ${msg}`);
    }
  }

  // 2. Try active or discovered Web Serial port
  const serialPorts = await getPairedSerialPrinters();
  if (serialPorts.length > 0) {
    try {
      const success = await writeEscPosToSerialPort(serialPorts[0], bytes);
      if (success) {
        return { success: true, method: 'webserial', message: 'Printed via Web Serial' };
      }
    } catch (serialErr: unknown) {
      const msg = serialErr instanceof Error ? serialErr.message : String(serialErr);
      console.warn(`${getTimestamp()} [WEBSERIAL PRINT RETRY NOTICE] ${msg}`);
    }
  }

  return {
    success: false,
    method: 'none',
    message: 'No client-side WebUSB/Serial thermal printer connected or authorized.',
  };
}

/**
 * Registers browser event listeners for USB hot-plugging (connect/disconnect).
 *
 * @param onConnect - Callback when a USB device is plugged in.
 * @param onDisconnect - Callback when a USB device is unplugged.
 * @returns Cleanup function to remove event listeners.
 */
export function registerUsbPlugListeners(
  onConnect: (device: MinimalUSBDevice) => void,
  onDisconnect: (device: MinimalUSBDevice) => void
): () => void {
  const manager = getUsbManager();
  if (!manager) return () => {};

  const handleConnect = (event: { device: MinimalUSBDevice }) => {
    console.log(`${getTimestamp()} [WEBUSB ATTACHED] Detected hardware connection:`, event.device.productName);
    activeUsbDevice = event.device;
    onConnect(event.device);
  };

  const handleDisconnect = (event: { device: MinimalUSBDevice }) => {
    console.log(`${getTimestamp()} [WEBUSB DETACHED] Hardware disconnected`);
    if (activeUsbDevice === event.device) {
      activeUsbDevice = null;
    }
    onDisconnect(event.device);
  };

  manager.addEventListener('connect', handleConnect);
  manager.addEventListener('disconnect', handleDisconnect);

  return () => {
    try {
      manager.removeEventListener('connect', handleConnect);
      manager.removeEventListener('disconnect', handleDisconnect);
    } catch {
      // Ignore cleanup error
    }
  };
}

/**
 * Creates a formatted binary ESC/POS test receipt.
 *
 * @returns Raw ESC/POS byte array ready for transmission.
 */
export function createTestTicketEscPos(): Uint8Array {
  const ESC = '\x1b';
  const GS = '\x1d';
  const RESET = ESC + '@';
  // High-Density Thermal Parameters: ESC 7 <max_dots=7> <heat_time=20> <heat_interval=2>
  const HIGH_DENSITY = ESC + '7\x07\x14\x02';
  // Double-strike mode: pulses thermal elements twice per dot for rich, solid black text
  const DOUBLE_STRIKE_ON = ESC + 'G\x01';
  const DOUBLE_STRIKE_OFF = ESC + 'G\x00';
  const CENTER = ESC + 'a\x01';
  const LEFT = ESC + 'a\x00';
  const BOLD_ON = ESC + 'E\x01';
  const BOLD_OFF = ESC + 'E\x00';
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

  const text =
    RESET +
    HIGH_DENSITY +
    DOUBLE_STRIKE_ON +
    CENTER +
    BOLD_ON +
    'HEART CHECK PHC\n' +
    'PRINTER HARDWARE TEST\n' +
    BOLD_OFF +
    '================================\n' +
    LEFT +
    `Date: ${dateStr}\n` +
    `Time: ${timeStr} (PHT)\n` +
    'Interface: WebUSB / Serial\n' +
    'Device: Client Browser Detected\n' +
    '--------------------------------\n' +
    CENTER +
    BOLD_ON +
    'PRINTER READY\n' +
    BOLD_OFF +
    '--------------------------------\n' +
    'Automatic detection is active.\n' +
    'No terminal commands required.\n' +
    '================================\n' +
    DOUBLE_STRIKE_OFF +
    '\n\n\n\n\n' +
    CUT;

  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i);
  }
  return bytes;
}

/**
 * Dispatches a test receipt directly to the connected WebUSB or WebSerial printer.
 *
 * @returns Promise resolving to operation status.
 */
export async function printTestTicketWebUsb(): Promise<WebUsbPrintResult> {
  const testBytes = createTestTicketEscPos();

  const usbDevices = await getPairedUsbPrinters();
  if (usbDevices.length > 0) {
    try {
      await writeEscPosToUsbDevice(usbDevices[0], testBytes);
      return { success: true, message: 'Test ticket printed via WebUSB.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('WEBUSB_INTERFACE_CLAIMED_BY_KERNEL') ||
        msg.includes('claimInterface') ||
        msg.includes('Unable to claim interface')
      ) {
        return {
          success: false,
          claimedByKernel: true,
          message:
            'Linux kernel driver ("usblp") is currently managing this USB printer via /dev/usb/lp*. Falling back to host device node...',
        };
      }
      if (msg.includes('Access denied')) {
        return {
          success: false,
          claimedByKernel: false,
          message:
            'Linux USB Access Denied: Chrome was blocked by Linux kernel permissions for this USB device (0483:070b). Run the 1-time udev rule shown below in your terminal, or click "Test Server Node (/dev/usb/lp*)".',
        };
      }
      return { success: false, claimedByKernel: false, message: `WebUSB write failed: ${msg}` };
    }
  }

  const serialPorts = await getPairedSerialPrinters();
  if (serialPorts.length > 0) {
    try {
      await writeEscPosToSerialPort(serialPorts[0], testBytes);
      return { success: true, message: 'Test ticket printed via Web Serial.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, claimedByKernel: false, message: `Web Serial write failed: ${msg}` };
    }
  }

  return {
    success: false,
    claimedByKernel: false,
    message: 'No paired USB or Serial printer detected on this device. Please pair first.',
  };
}
