/**
 * @fileoverview Default HTTPS Production Server Runner for Heart Check PHC.
 *
 * Automatically verifies production build artifacts, ensures the port 443
 * Caddy reverse proxy is running, and launches Next.js in production mode
 * on loopback interface with institutional HTTPS endpoints.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ensureLocalCertificates } from './ensure-certs.mjs';
import { ensureHttpsGateway, printStartupBanner, isPortListening } from './gateway-utils.mjs';

const INTERNAL_PORT = 3000;

async function main() {
  // Step 1: Verify production build exists
  const buildDir = path.resolve(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    process.stderr.write(
      `[ERROR] Production build directory (.next) not found. Please run 'npm run build' before starting the production server.\n`
    );
    process.exit(1);
  }

  // Step 2: Ensure offline local certificates exist
  ensureLocalCertificates();

  // Step 3: Ensure port 443 HTTPS Gateway is active
  const gatewayStatus = await ensureHttpsGateway();
  if (!gatewayStatus.ok) {
    process.stdout.write(`\n[WARNING] ${gatewayStatus.message}\n`);
    process.stdout.write(`To enable port 443 without root on Linux: sudo setcap 'cap_net_bind_service=+ep' $(which caddy)\n\n`);
  }

  // Step 4: Check if port 3000 is already in use
  const is3000Busy = await isPortListening(INTERNAL_PORT);
  if (is3000Busy) {
    process.stderr.write(`[ERROR] Port ${INTERNAL_PORT} is already in use by another process.\n`);
    process.exit(1);
  }

  // Step 5: Print institutional HTTPS endpoints banner
  const is443Listening = await isPortListening(443);
  printStartupBanner('Production', INTERNAL_PORT, is443Listening);

  // Step 6: Launch Next.js production server
  const nextBin = path.resolve(process.cwd(), 'node_modules/.bin/next');
  const child = spawn(nextBin, ['start', '-H', '127.0.0.1', '-p', String(INTERNAL_PORT)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(INTERNAL_PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production'
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
  process.stderr.write(`[FATAL] Failed to start production gateway: ${err.message}\n`);
  process.exit(1);
});
