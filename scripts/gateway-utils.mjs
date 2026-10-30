/**
 * @fileoverview HTTPS Reverse Proxy and Port Detection Utilities.
 *
 * Provides non-blocking TCP socket verification, Caddy lifecycle management,
 * and institutional network address resolution for Heart Check PHC.
 */

import net from 'node:net';
import os from 'node:os';
import { execSync, spawn } from 'node:child_process';
import path from 'node:path';

/**
 * Probes whether a specific TCP port is currently accepting connections.
 *
 * @param {number} port The port number to test.
 * @param {string} [host='127.0.0.1'] Host address.
 * @param {number} [timeoutMs=400] Socket connection timeout in milliseconds.
 * @returns {Promise<boolean>} True if the port is actively listening.
 */
export function isPortListening(port, host = '127.0.0.1', timeoutMs = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    const cleanup = () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      cleanup();
      resolve(true);
    });

    socket.once('timeout', () => {
      cleanup();
      resolve(false);
    });

    socket.once('error', () => {
      cleanup();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Retrieves all active non-internal IPv4 LAN addresses.
 * @returns {string[]} List of discovered LAN IP addresses.
 */
export function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}

/**
 * Checks if the caddy binary is accessible on the system PATH.
 * @returns {boolean} True if caddy binary exists.
 */
export function hasCaddyInstalled() {
  try {
    execSync('which caddy', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures that the institutional HTTPS gateway on port 443 is operational.
 *
 * @returns {Promise<{ ok: boolean, message: string }>} Status outcome.
 */
export async function ensureHttpsGateway() {
  const is443Listening = await isPortListening(443);
  if (is443Listening) {
    return { ok: true, message: 'HTTPS Gateway is active on port 443.' };
  }

  if (!hasCaddyInstalled()) {
    return {
      ok: false,
      message: 'Caddy reverse proxy is not installed on PATH. Falling back to direct service mode.'
    };
  }

  const caddyfilePath = path.resolve(process.cwd(), 'Caddyfile');

  // If admin port 2019 is already occupied, attempt to reload the running instance
  const is2019Busy = await isPortListening(2019);
  if (is2019Busy) {
    try {
      execSync(`caddy reload --config "${caddyfilePath}"`, { stdio: 'ignore' });
      const verifiedAfterReload = await isPortListening(443, '127.0.0.1', 1000);
      if (verifiedAfterReload) {
        return { ok: true, message: 'Caddy HTTPS Gateway successfully reloaded on port 443.' };
      }
    } catch {
      // Reload failed; attempt to stop the stale instance before launching clean
      try {
        execSync('caddy stop', { stdio: 'ignore' });
      } catch {
        // Retain and proceed with start attempt
      }
    }
  }

  try {
    execSync(`caddy start --config "${caddyfilePath}"`, { stdio: 'ignore' });
    const verified = await isPortListening(443, '127.0.0.1', 1500);
    if (verified) {
      return { ok: true, message: 'Caddy HTTPS Gateway successfully launched on port 443.' };
    }
    return { ok: false, message: 'Caddy started but port 443 is not accepting connections.' };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      message: `Failed to initialize Caddy reverse proxy: ${errMsg}`
    };
  }
}

/**
 * Renders an institutional terminal startup banner.
 *
 * @param {string} mode Mode label ('DEVELOPMENT' or 'PRODUCTION').
 * @param {number} internalPort Port on which Next.js is running.
 * @param {boolean} gatewayActive Whether port 443 HTTPS reverse proxy is live.
 */
export function printStartupBanner(mode, internalPort, gatewayActive) {
  const lanIps = getLanAddresses();
  const separator = '='.repeat(70);

  process.stdout.write(`\n${separator}\n`);
  process.stdout.write(`  HEART CHECK PHC - ${mode.toUpperCase()} HTTPS GATEWAY\n`);
  process.stdout.write(`${separator}\n`);

  if (gatewayActive) {
    process.stdout.write(`  [HTTPS] Local URL:     https://localhost\n`);
    for (const ip of lanIps) {
      process.stdout.write(`  [HTTPS] Hospital LAN:  https://${ip}\n`);
    }
    process.stdout.write(`  [LOOPBACK] Next.js:    http://127.0.0.1:${internalPort}\n`);
  } else {
    process.stdout.write(`  [NOTICE] Port 443 proxy inactive. Accessing direct host port.\n`);
    process.stdout.write(`  [HTTP] Local URL:      http://localhost:${internalPort}\n`);
    for (const ip of lanIps) {
      process.stdout.write(`  [HTTP] Hospital LAN:   http://${ip}:${internalPort}\n`);
    }
  }

  process.stdout.write(`${separator}\n\n`);
}
