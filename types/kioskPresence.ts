/**
 * @fileoverview Type definitions for Kiosk Terminal Presence and Hardware Status Telemetry.
 *
 * Models real-time kiosk terminal detection, active screen status, and connected
 * thermal receipt printer hardware state across physical terminals and SuperAdmin.
 *
 * @module types/kioskPresence
 */

/**
 * Connected thermal receipt printer hardware status on a physical kiosk terminal.
 */
export interface KioskHardwareStatus {
  /** Whether a thermal printer is paired and ready to receive print dispatches. */
  printerReady: boolean;
  /** Primary connection interface used by the terminal. */
  printerType: 'webusb' | 'network' | 'webserial' | 'server_node' | 'none';
  /** Human-readable status description (e.g. 'Network IP: 192.168.1.200', 'Direct WebUSB Connected'). */
  printerDetails: string;
  /** Optional paper status or device health condition. */
  paperStatus?: 'ok' | 'low' | 'unknown';
}

/**
 * Real-time presence payload broadcast by an active kiosk terminal instance.
 */
export interface KioskPresencePayload {
  /** Unique terminal session identifier (persisted in sessionStorage per tab/display). */
  kioskId: string;
  /** Human-readable display designation (e.g. 'Kiosk Terminal #1', 'Touchscreen A'). */
  kioskName: string;
  /** Current URL pathname on the kiosk terminal (e.g. '/kiosk/pages/kiosk-services'). */
  currentPath: string;
  /** Current human-friendly screen title (e.g. 'Service Selection', 'Touchscreen Welcome'). */
  currentScreenTitle: string;
  /** Operational activity state of the kiosk terminal. */
  status: 'online' | 'active' | 'idle' | 'printing';
  /** Real-time hardware health and thermal printer telemetry. */
  hardware: KioskHardwareStatus;
  /** ISO timestamp when the kiosk terminal window was first opened. */
  openedAt: string;
  /** ISO timestamp of the most recent keepalive heartbeat. */
  lastSeen: string;
  /** Display screen resolution of the terminal device (e.g. '1920x1080'). */
  screenResolution: string;
  /** Client user-agent string for device identification. */
  userAgent?: string;
}
