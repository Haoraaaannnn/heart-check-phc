/**
 * @fileoverview Default HTTPS Development Server Runner for Heart Check PHC.
 *
 * Automatically verifies local offline SSL certificates, ensures the port 443
 * Caddy reverse proxy is running, and boots Next.js development server with
 * institutional terminal logging and clean shutdown handling.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { ensureLocalCertificates } from './ensure-certs.mjs';
import { ensureHttpsGateway, printStartupBanner, isPortListening } from './gateway-utils.mjs';

const INTERNAL_PORT = 3000;

async function main() {
  // Step 1: Ensure offline local certificates exist
  ensureLocalCertificates();

  // Step 2: Ensure port 443 HTTPS Gateway is active
  const gatewayStatus = await ensureHttpsGateway();
  if (!gatewayStatus.ok) {
    process.stdout.write(`\n[WARNING] ${gatewayStatus.message}\n`);
    process.stdout.write(`To enable port 443 without root on Linux: sudo setcap 'cap_net_bind_service=+ep' $(which caddy)\n\n`);
  }

  // Step 3: Check if port 3000 is already in use
  const is3000Busy = await isPortListening(INTERNAL_PORT);
  if (is3000Busy) {
    process.stderr.write(`[ERROR] Port ${INTERNAL_PORT} is already in use by another process.\n`);
    process.exit(1);
  }

  // Step 4: Print institutional HTTPS endpoints banner
  const is443Listening = await isPortListening(443);
  printStartupBanner('Development', INTERNAL_PORT, is443Listening);

  // Step 5: Launch Next.js dev server
  const nextBin = path.resolve(process.cwd(), 'node_modules/.bin/next');
  const child = spawn(nextBin, ['dev', '--webpack', '-H', '127.0.0.1', '-p', String(INTERNAL_PORT)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(INTERNAL_PORT),
      HOSTNAME: '127.0.0.1'
    }
  });

  const handleTermination = (signal) => {
    if (child && !child.killed) {
      child.kill(signal);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => handleTermination('SIGINT'));
  process.on('SIGTERM', () => handleTermination('SIGTERM'));

  child.on('exit', (code, signal) => {
    if (signal) {
      process.exit(1);
    }
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  process.stderr.write(`[FATAL] Failed to start development gateway: ${err.message}\n`);
  process.exit(1);
});
