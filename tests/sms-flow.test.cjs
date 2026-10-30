/** @fileoverview Encrypted SMS check-in, first-dispatch throttling and privacy regression tests. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

/** Loads production code with isolated credentials and no real network access. */
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date, Error, Buffer, Response,
    console: { log() {}, warn() {}, error() {} }, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const encryption = load('lib/crypto/phoneEncryption.ts', { crypto: { default: crypto } }, { process: { env: { PHONE_ENCRYPTION_SECRET: 'isolated-test-secret' } } });
const phone = '09171234567';
const positionRules = load('lib/sms/queuePosition.ts');

/** Builds one kiosk insertion request with real encryption and a synthetic database result. */
function kiosk({ error = null, data = [{ patientNum: '67001' }], encryptionFailure = false } = {}) {
  const calls = []; let encryptionCalls = 0;
  const api = load('app/kiosk/pages/sms-input/utils/createKioskPatient.ts', {
    '@/lib/supabase': { supabase: { rpc: async (name, payload) => { calls.push({ name, payload }); return { data, error }; } } },
    '@/app/actions/phoneSecurity': { encryptPatientPhoneAction: async value => {
      encryptionCalls++; if (encryptionFailure) throw new Error('private encryption diagnostic');
      return encryption.encryptPhoneNumber(value);
    } },
  });
  return { api, calls, encryptionCalls: () => encryptionCalls };
}
const options = { service: 'Test Service', subcategory: null, preferredCubicles: null, prefix: '67', groupBySubcategory: false, phone };

test('Kiosk submits AES-256-GCM ciphertext once and preserves the multi-digit ticket prefix', async () => {
  const fixture = kiosk(); assert.equal(await fixture.api.createKioskPatient(options), '67001');
  assert.equal(fixture.calls.length, 1); assert.equal(fixture.calls[0].payload.p_prefix, '67');
  const stored = fixture.calls[0].payload.p_phone;
  assert.match(stored, /^enc:v1:/); assert.equal(encryption.decryptPhoneNumber(stored), phone);
  assert.ok(!JSON.stringify(fixture.calls).includes(phone));
});

test('Bigint storage errors never trigger a plaintext retry and skip-SMS stores null', async () => {
  const fixture = kiosk({ error: { code: '22P02', message: 'private database diagnostic' } });
  await assert.rejects(fixture.api.createKioskPatient(options), error => /Secure phone storage/.test(error.message) && !error.message.includes('private'));
  assert.equal(fixture.calls.length, 1); assert.notEqual(fixture.calls[0].payload.p_phone, phone);
  const skipped = kiosk(); await skipped.api.createKioskPatient({ ...options, phone: null });
  assert.equal(skipped.encryptionCalls(), 0); assert.equal(skipped.calls[0].payload.p_phone, null);
});

test('Encryption failures and malformed creation responses never report a successful ticket', async () => {
  const failed = kiosk({ encryptionFailure: true });
  await assert.rejects(failed.api.createKioskPatient(options), error => /Secure phone storage/.test(error.message) && !error.message.includes('private'));
  assert.equal(failed.calls.length, 0);
  for (const data of [null, [], [{}], [{ patientNum: '' }], [{ patientNum: 123 }]]) {
    await assert.rejects(kiosk({ data }).api.createKioskPatient(options), /Unable to create/);
  }
});

/** Builds queue-alert or confirmation actions with a fake gateway and captured redacted logs. */
function sms({ confirmation = false, authenticated = true, configured = true, rejected = false, position = null } = {}) {
  const sent = []; const logs = [];
  const api = load(confirmation ? 'app/actions/sendQueueConfirmationSMS.ts' : 'app/actions/sendSMS.ts', {
    '@/lib/crypto/phoneEncryption': encryption,
    '@/lib/sms/queuePosition': positionRules,
    '@/lib/sms/readQueuePosition': { readSmsQueuePosition: async () => ({ ok: true, position }) },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({
      data: { user: authenticated ? { id: 'test-staff' } : null }, error: null,
    }) } }) },
    '@/constants/ewtTexts': { formatEwtSmsLabel: () => '15 minutes' }, '@/lib/logger': { getTimestamp: () => 'test-time' },
  }, { process: { env: configured ? { UNISMS_API_KEY: 'fake-gateway-key' } : {} },
    console: Object.fromEntries(['log', 'warn', 'error'].map(method => [method, (...args) => logs.push(args.join(' '))])),
    fetch: async (_url, request) => { sent.push(JSON.parse(request.body)); return Response.json({}, { status: rejected ? 502 : 200 }); } });
  return { api, sent, logs };
}

test('First staff queue alert is allowed, immediate duplicates are throttled, and other recipients remain eligible', async () => {
  const fixture = sms();
  assert.equal((await fixture.api.sendSMS({ phoneNum: phone, patientNum: 'TEST-1', cubicleNum: 'Counter 1', patientId: 1 })).success, true);
  assert.match((await fixture.api.sendSMS({ phoneNum: phone, patientNum: 'TEST-1', cubicleNum: 'Counter 1', patientId: 1 })).error, /Duplicate/);
  assert.equal((await fixture.api.sendSMS({ phoneNum: '09181234567', patientNum: 'TEST-2', cubicleNum: 'Counter 2', patientId: 2 })).success, true);
  assert.equal(fixture.sent.length, 2); assert.equal(fixture.sent[0].recipient, '+639171234567');
});

test('SMS rolling rate limit remains enforced and anonymous dispatches never contact the gateway', async () => {
  const fixture = sms();
  for (let index = 0; index < 20; index++) assert.equal((await fixture.api.sendSMS({ phoneNum: '09' + String(index).padStart(9, '0'), patientNum: 'TEST', cubicleNum: 'Counter 1', patientId: index + 1 })).success, true);
  assert.match((await fixture.api.sendSMS({ phoneNum: '09999999999', patientNum: 'TEST', cubicleNum: 'Counter 1', patientId: 21 })).error, /rate limit/);
  assert.equal(fixture.sent.length, 20);
  const anonymous = sms({ authenticated: false });
  assert.match((await anonymous.api.sendSMS({ phoneNum: phone, patientNum: 'TEST', cubicleNum: 'Counter 1', patientId: 1 })).error, /Unauthorized/);
  assert.equal(anonymous.sent.length, 0);
});

test('Confirmation handles 639 format correctly, rejects overlong numbers, and never logs the destination', async () => {
  const fixture = sms({ confirmation: true });
  assert.equal((await fixture.api.sendQueueConfirmationSMS({ phoneNum: '639171234567', patientNum: 'TEST', serviceName: 'Test Service', ewtMinutes: 15, patientId: 1 })).success, true);
  assert.equal(fixture.sent[0].recipient, '+639171234567');
  assert.equal((await fixture.api.sendQueueConfirmationSMS({ phoneNum: '639171234567', patientNum: 'TEST', serviceName: 'Test Service', ewtMinutes: 15, patientId: 1 })).success, false);
  assert.equal((await fixture.api.sendQueueConfirmationSMS({ phoneNum: '+63917123456799', patientNum: 'TEST', serviceName: 'Test Service', ewtMinutes: 15, patientId: 1 })).success, false);
  assert.equal(fixture.sent.length, 1);
  assert.ok(!fixture.logs.join('\n').includes('639171234567'));
});

test('Missing SMS configuration and gateway rejection are reported as failures rather than simulated success', async () => {
  const missing = sms({ confirmation: true, configured: false });
  assert.equal((await missing.api.sendQueueConfirmationSMS({ phoneNum: phone, patientNum: 'TEST', serviceName: 'Test Service', ewtMinutes: 15, patientId: 1 })).success, false);
  assert.equal(missing.sent.length, 0);
  const rejected = sms({ confirmation: true, rejected: true });
  assert.equal((await rejected.api.sendQueueConfirmationSMS({ phoneNum: phone, patientNum: 'TEST', serviceName: 'Test Service', ewtMinutes: 15, patientId: 1 })).success, false);
});

test('Existing alert and confirmation dispatches describe the actual queue position and station', async () => {
  const position = { position: 5, aheadCount: 4, destination: 'Counter 2' };
  const alert = sms({ position });
  assert.equal((await alert.api.sendSMS({ phoneNum: phone, patientNum: 'TEST', cubicleNum: 'Old Counter', patientId: 1 })).success, true);
  assert.match(alert.sent[0].content, /5th in line at Counter 2 \(4 ahead\)/);
  assert.ok(!alert.sent[0].content.includes('Old Counter')); assert.equal(alert.sent.length, 1);
  const confirmation = sms({ confirmation: true, position });
  assert.equal((await confirmation.api.sendQueueConfirmationSMS({ phoneNum: phone, patientNum: 'TEST', serviceName: 'Test Service', ewtMinutes: 15, patientId: 1 })).success, true);
  assert.match(confirmation.sent[0].content, /5th in line at Counter 2 \(4 ahead\)/);
  assert.match(confirmation.sent[0].content, /15 minutes/); assert.equal(confirmation.sent.length, 1);
});

test('Unassigned tickets retain the confirmation and wait estimate without inventing a position', async () => {
  const fixture = sms({ confirmation: true });
  assert.equal((await fixture.api.sendQueueConfirmationSMS({ phoneNum: phone, patientNum: 'TEST', serviceName: 'Test Service', ewtMinutes: 15, patientId: 1 })).success, true);
  assert.match(fixture.sent[0].content, /15 minutes/);
  assert.ok(!fixture.sent[0].content.includes('in line at')); assert.equal(fixture.sent.length, 1);
});
