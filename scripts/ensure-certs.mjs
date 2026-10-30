/**
 * @fileoverview Offline Self-Signed Certificate Provisioner for Heart Check PHC.
 *
 * Generates local TLS certificates with SAN (Subject Alternative Names) for
 * localhost, loopback, and active LAN IP addresses without requiring internet
 * access or external package downloads.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const CERT_DIR = path.resolve(process.cwd(), 'certificates');
const KEY_PATH = path.join(CERT_DIR, 'localhost-key.pem');
const CERT_PATH = path.join(CERT_DIR, 'localhost.pem');

/**
 * Discovers non-internal IPv4 network addresses on the host machine.
 * @returns {string[]} Array of IPv4 addresses.
 */
export function getLocalIpAddresses() {
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
 * Ensures valid local SSL certificates exist.
 * If missing, generates a high-entropy self-signed certificate using OpenSSL.
 *
 * @returns {{ certPath: string, keyPath: string }} Object containing certificate paths.
 */
export function ensureLocalCertificates() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    return { certPath: CERT_PATH, keyPath: KEY_PATH };
  }

  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true, mode: 0o700 });
  }

  const localIps = getLocalIpAddresses();
  const sanList = ['DNS:localhost', 'IP:127.0.0.1'];
  for (const ip of localIps) {
    sanList.push(`IP:${ip}`);
  }

  const opensslConfig = `
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = PH
ST = NCR
L = Quezon City
O = Philippine Heart Center
OU = Outpatient Department
CN = localhost

[v3_req]
subjectAltName = ${sanList.join(', ')}
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
`;

  const configPath = path.join(CERT_DIR, 'openssl.cnf');
  fs.writeFileSync(configPath, opensslConfig.trim(), { encoding: 'utf8', mode: 0o600 });

  try {
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_PATH}" -out "${CERT_PATH}" -days 365 -nodes -config "${configPath}"`,
      { stdio: 'pipe' }
    );
    fs.chmodSync(KEY_PATH, 0o600);
    fs.chmodSync(CERT_PATH, 0o644);
  } finally {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }

  return { certPath: CERT_PATH, keyPath: KEY_PATH };
}

// Allow direct CLI execution: node scripts/ensure-certs.mjs
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const result = ensureLocalCertificates();
  process.stdout.write(`Local certificates verified at: ${result.certPath}\n`);
}
