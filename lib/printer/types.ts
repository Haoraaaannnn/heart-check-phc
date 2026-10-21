/**
 * @fileoverview Type definitions for thermal receipt printing across WebUSB, WebSerial, Network, and Linux device nodes.
 *
 * Provides strong typing for printer connection methods, telemetry status,
 * API payloads, and browser WebUSB/WebSerial interface contracts.
 *
 * @module lib/printer/types
 */

/**
 * Supported hardware printer connection channels.
 */
export type PrinterConnectionType =
  | 'webusb'
  | 'webserial'
  | 'network'
  | 'device'
  | 'simulated'
  | 'none';

/**
 * Diagnostic status of the thermal printer peripheral.
 */
export interface PrinterStatus {
  /** Whether a printer is actively paired, detected, or reachable. */
  connected: boolean;
  /** Active connection interface in use. */
  type: PrinterConnectionType;
  /** Human-readable identifier (e.g. "POS-80 USB Printer", "LAN 192.168.1.200"). */
  name: string;
  /** Optional technical details (e.g. interface number, baud rate, socket host). */
  details?: string;
  /** Whether the browser environment supports WebUSB or WebSerial. */
  isSupported?: boolean;
}

/**
 * Diagnostic outcome of a WebUSB / WebSerial test ticket dispatch.
 */
export interface WebUsbPrintResult {
  /** Whether the ticket was written successfully to the printer endpoint. */
  success: boolean;
  /** Human-readable status message or error rationale. */
  message: string;
  /**
   * Set to true if the USB device was detected and opened, but the host operating system
   * kernel driver (e.g. Linux `usblp`) holds an exclusive claim over the interface.
   */
  claimedByKernel?: boolean;
}

/**
 * Inbound payload sent to `/api/print-ticket`.
 */
export interface PrintTicketPayload {
  /** Registered patient queue ticket code (e.g. "C001", "1002"). */
  queueNumber: string;
  /** Human-readable clinical service label. */
  serviceName?: string;
  /** Destination examination cubicle or waiting area. */
  cubicle?: string;
  /** Optional explicit network printer IP override (e.g. "192.168.1.200"). */
  printerIp?: string;
}

/**
 * Outbound response data from `/api/print-ticket`.
 */
export interface PrintTicketResponseData {
  /** Ticket queue code. */
  queueNumber: string;
  /** Service name. */
  serviceName: string;
  /** Destination cubicle or counter. */
  cubicle: string;
  /** Computed Estimated Wait Time in minutes. */
  estimatedWaitMinutes: number;
  /** Formatted human-readable wait time range (e.g. "15 to 20 minutes"). */
  estimatedWaitLabel: string;
  /** Method used by the server to print, or indication that client WebUSB is needed. */
  printMethod: PrinterConnectionType;
  /** Base64-encoded raw ESC/POS binary stream for client-side WebUSB printing. */
  escposBase64?: string;
  /** ISO timestamp of print processing. */
  timestamp: string;
}

/**
 * Standard API response envelope from `/api/print-ticket`.
 */
export interface PrintTicketApiResponse {
  success: boolean;
  data?: PrintTicketResponseData;
  error?: string;
}

/**
 * Minimal WebUSB type definitions to guarantee cross-environment TypeScript compilation.
 */
export interface MinimalUSBEndpoint {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous';
}

export interface MinimalUSBAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  endpoints: MinimalUSBEndpoint[];
}

export interface MinimalUSBInterface {
  interfaceNumber: number;
  alternates: MinimalUSBAlternateInterface[];
}

export interface MinimalUSBConfiguration {
  configurationValue: number;
  interfaces: MinimalUSBInterface[];
}

export interface MinimalUSBDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  opened: boolean;
  configuration: MinimalUSBConfiguration | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<{ status: string; bytesWritten?: number }>;
}

export interface MinimalUSBManager {
  getDevices(): Promise<MinimalUSBDevice[]>;
  requestDevice(options: { filters: Array<Record<string, unknown>> }): Promise<MinimalUSBDevice>;
  addEventListener(type: string, listener: (event: { device: MinimalUSBDevice }) => void): void;
  removeEventListener(type: string, listener: (event: { device: MinimalUSBDevice }) => void): void;
}

/**
 * Minimal Web Serial type definitions for virtual COM thermal printers.
 */
export interface MinimalSerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: {
    getWriter(): {
      write(chunk: Uint8Array): Promise<void>;
      releaseLock(): void;
    };
  };
}

export interface MinimalSerialManager {
  getPorts(): Promise<MinimalSerialPort[]>;
  requestPort(options?: { filters?: Array<Record<string, unknown>> }): Promise<MinimalSerialPort>;
  addEventListener(type: string, listener: (event: { port: MinimalSerialPort }) => void): void;
  removeEventListener(type: string, listener: (event: { port: MinimalSerialPort }) => void): void;
}
