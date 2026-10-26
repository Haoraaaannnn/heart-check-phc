/** @fileoverview Isolated simulation checks for clinical progression, rejected saves, privacy, and printing. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

/** Executes the actual application source with fake data and no network or hardware I/O. */
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, Request, Response, Headers, URL, Buffer,
    console: { log() {}, warn() {}, error() {} }, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiledModule.exports;
}

/** Implements minimal row matching so concurrency and historical filters affect observable writes. */
function clinicalApi({ role = 'nurse', cubicleIds = [10], services = [], historical = false, conflict = false, authenticated = true } = {}) {
  const patient = { id: 1, status: 'Assigned', cubicleNum: 'Consultation R2 C1', service: 'Consultation', is_historical: historical };
  const writes = [];
  const tables = { users: [{ id: 5, role }], patients: [patient],
    user_cubicles: cubicleIds.map(cubicle_id => ({ cubicle_id })), user_services: services.map(service => ({ service })),
    user_rooms: [], doctors: [], cubicle: [{ id: 10, cubicleNum: patient.cubicleNum, category: 'Consultation' }] };
  const db = { from: table => {
    const filters = []; let fields;
    const result = single => {
      let rows = tables[table] ?? [];
      rows = rows.filter(row => filters.every(([key, value]) => key === 'auth_id' || key === 'user_id' || row[key] === value));
      if (fields) {
        if (conflict) rows = [];
        for (const row of rows) { writes.push({ fields, filters }); Object.assign(row, fields); }
      }
      return { data: single ? rows[0] ?? null : rows, error: null };
    };
    return { select() { return this; }, eq(key, value) { filters.push([key, value]); return this; },
      update(value) { fields = value; return this; }, maybeSingle: async () => result(true),
      then(resolve) { return Promise.resolve(result(false)).then(resolve); } };
  } };
  const api = load('app/api/nurse/patients/transition.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': { requireUser: async () => authenticated ? { authorized: true, user: { id: 'staff' } }
      : { authorized: false, response: Response.json({}, { status: 401 }) } },
  });
  return { patient, writes, send: (updates, expectedStatus) => api.handleNurseTransition(new Request('http://localhost/api/nurse/patients',
    { method: 'PATCH', body: JSON.stringify({ patientId: 1, updates, expectedStatus }) }), db) };
}

test('A synthetic patient completes Assigned -> With Doctor -> Carryout -> Done without stage skipping', async () => {
  const harness = clinicalApi();
  for (const status of ['With Doctor', 'Carryout', 'Done']) {
    assert.equal((await harness.send({ status }, harness.patient.status)).status, 200);
    assert.equal(harness.patient.status, status);
  }
  assert.ok(harness.patient.consult_start && harness.patient.consult_end && harness.patient.carryout_end);
  assert.equal((await harness.send({ status: 'With Doctor' }, 'Done')).status, 409);
  assert.ok(harness.writes.every(write => write.filters.some(([key, value]) => key === 'is_historical' && value === false)));
});

test('Nurse back actions clear only the matching stage timestamps', async () => {
  const harness = clinicalApi();
  await harness.send({ status: 'With Doctor' }, 'Assigned');
  assert.equal((await harness.send({ status: 'Assigned', consult_start: null }, 'With Doctor')).status, 200);
  assert.equal(harness.patient.consult_start, null);
  await harness.send({ status: 'With Doctor' }, 'Assigned');
  await harness.send({ status: 'Carryout' }, 'With Doctor');
  assert.equal((await harness.send({ status: 'With Doctor', consult_end: null, carryout_start: null, carryout_end: null }, 'Carryout')).status, 200);
  assert.equal(harness.patient.consult_end, null);
  assert.equal(harness.patient.carryout_start, null);
});

test('Clinical endpoints reject anonymous users, registration roles, out-of-scope cubicles, and historical patients', async () => {
  for (const [options, status] of [[{ authenticated: false }, 401], [{ role: 'registration' }, 403],
    [{ cubicleIds: [99], services: ['Consultation'] }, 403], [{ cubicleIds: [] }, 403], [{ historical: true }, 409]]) {
    const harness = clinicalApi(options);
    assert.equal((await harness.send({ status: 'With Doctor' }, 'Assigned')).status, status);
    assert.equal(harness.writes.length, 0);
  }
});

test('Mass assignment, invalid timestamps, skipped stages, stale requests and concurrent changes cannot overwrite a patient', async () => {
  for (const [updates, expectedStatus, options, status] of [
    [{ status: 'With Doctor', phoneNum: 'forged' }, 'Assigned', {}, 400],
    [{ status: 'With Doctor', consult_start: 'not-a-date' }, 'Assigned', {}, 400],
    [{ status: 'Done' }, 'Assigned', {}, 409],
    [{ status: 'With Doctor' }, 'Carryout', {}, 409],
    [{ status: 'With Doctor' }, 'Assigned', { conflict: true }, 409],
  ]) {
    const harness = clinicalApi(options);
    assert.equal((await harness.send(updates, expectedStatus)).status, status);
    assert.equal(harness.writes.length, 0);
  }
});

test('Replaying an already acknowledged action succeeds without resetting clinical timestamps', async () => {
  const harness = clinicalApi();
  const updates = { status: 'With Doctor', consult_start: '2026-10-26T01:00:00.000Z' };
  await harness.send(updates, 'Assigned');
  assert.equal((await harness.send(updates, 'Assigned')).status, 200);
  assert.equal(harness.writes.length, 1);
  assert.equal(harness.patient.consult_start, updates.consult_start);
});

/** Loads the real nurse save transport with controlled connectivity and disk availability. */
function nurseSave({ status = 200, online = true, storage = true, networkError = false } = {}) {
  const queued = []; const removed = [];
  const api = load('app/nurse/lib/persistNurseTransition.ts', {
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'test-only', user: { id: 'owner' } } } }) } } },
    '@/lib/offlineQueue': { enqueueMutation: async item => { if (!storage) throw Error('Storage blocked'); queued.push(item); return { id: 'queued' }; }, removeMutation: async id => removed.push(id) },
    '@/lib/requestFetch': { withRequestDeadline: promise => promise, fetchWithDeadline: async () => {
      if (networkError) throw Error('Offline'); return Response.json({ error: 'Rejected stage update' }, { status });
    } },
  }, { navigator: { onLine: online } });
  return { queued, removed, save: () => api.persistNurseTransition({ patientId: 1, updates: { status: 'With Doctor' }, expectedStatus: 'Assigned' }) };
}

test('Server-denied nurse actions roll back instead of falling through to direct database writes', async () => {
  for (const status of [400, 401, 403, 409]) {
    const harness = nurseSave({ status });
    assert.equal((await harness.save()).ok, false);
    assert.deepEqual(harness.removed, ['queued']);
  }
});

test('Offline or interrupted saves only report success after durable storage and retain the original actor and stage', async () => {
  for (const options of [{ online: false }, { networkError: true }]) {
    const durable = nurseSave(options);
    assert.equal((await durable.save()).ok, true);
    assert.equal(durable.queued[0].endpoint, '/api/nurse/patients');
    assert.equal(durable.queued[0].ownerAuthId, 'owner');
    assert.equal(durable.queued[0].expectedStatus, 'Assigned');
    assert.equal((await nurseSave({ ...options, storage: false }).save()).ok, false);
  }
});

test('Phone encryption is randomized, authenticated, masked, and refuses a missing server secret', () => {
  const mocks = { crypto: { default: crypto } };
  const api = load('lib/crypto/phoneEncryption.ts', mocks, { process: { env: { PHONE_ENCRYPTION_SECRET: 'simulation-only-secret' } } });
  const first = api.encryptPhoneNumber('09170000000'); const second = api.encryptPhoneNumber('09170000000');
  assert.notEqual(first, second);
  assert.equal(api.decryptPhoneNumber(first), '09170000000');
  assert.equal(api.maskPhoneNumber(first).includes('0000000'), false);
  const tampered = first.split(':');
  tampered[4] = (tampered[4][0] === '0' ? '1' : '0') + tampered[4].slice(1);
  assert.equal(api.decryptPhoneNumber(tampered.join(':')), null);
  assert.throws(() => load('lib/crypto/phoneEncryption.ts', mocks, { process: { env: {} } }).encryptPhoneNumber('09170000000'), /not configured/);
});

test('Manila day filters include patients after local midnight even while the server date is still yesterday', () => {
  const api = load('utils/manilaDayRange.ts');
  const range = api.manilaDayRange(Date.parse('2026-10-25T16:30:00Z'));
  assert.equal(range.start, '2026-10-25T16:00:00.000Z');
  assert.equal(range.end, '2026-10-26T16:00:00.000Z');
});

test('A busy printer returns a retryable failure rather than claiming an unprinted ticket succeeded', async () => {
  let finishRead;
  const pendingRead = new Promise(resolve => { finishRead = resolve; });
  const query = { select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; }, maybeSingle: () => pendingRead };
  const db = { from: () => query };
  const api = load('app/api/print-ticket/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    'fs/promises': {}, fs: { existsSync: () => false }, '@/lib/logger': { getTimestamp: () => '' },
    '@/lib/supabase': { supabase: db }, '@/lib/supabase/admin': { createAdminClient: () => db },
    './ewtComputation': {}, './constants/printTexts': { PRINT_TEXTS: {} }, '@/app/actions/sendQueueConfirmationSMS': {},
    '@/lib/printer/networkPrinter': {}, '@/lib/printer/statusParser': {},
  }, { setTimeout() {}, process: { env: {} } });
  const request = () => new Request('http://localhost/api/print-ticket', { method: 'POST', body: JSON.stringify({ queueNumber: 'TEST-1' }) });
  const first = api.POST(request());
  for (let index = 0; index < 15; index++) await Promise.resolve();
  const second = await api.POST(request());
  assert.equal(second.status, 409);
  assert.equal((await second.json()).success, false);
  assert.equal(second.headers.get('retry-after'), '1');
  finishRead({ data: null, error: null }); await first;
});

test('Empty Pedia monitors never fall back to Adult patients or stations; closed stations stay hidden', async () => {
  for (const mode of ['adult-only', 'on-break']) {
    const states = []; let stateIndex = 0; const patientReads = [];
    const stations = mode === 'adult-only'
      ? [{ cubicleNum: 'Adult-1', category: 'Consultation', subcategory: 'Adult', on_break: false }]
      : [{ cubicleNum: 'Pedia-1', category: 'Consultation', subcategory: 'Pedia', on_break: true }];
    const patients = [{ id: 1, patientNum: 'TEST-A', cubicleNum: 'Adult-1', service: 'Consultation', subcategory: 'Adult', status: 'Assigned' },
      ...(mode === 'on-break' ? [{ id: 2, patientNum: 'TEST-P', cubicleNum: 'Pedia-1', service: 'Consultation', subcategory: 'Pedia', status: 'Assigned' }] : [])];
    const api = load('app/monitor/hooks/useMonitorData.ts', {
      react: { useState: initial => { const index = stateIndex++; states[index] = initial; return [initial, value => { states[index] = value; }]; }, useRef: value => ({ current: value }), useEffect() {} },
      '@/utils/formatTicketSpeech': {}, './useMonitorCalls': { useMonitorCalls() {} }, '../lib/playMonitorSpeech': {}, '../lib/sortCubiclePatients': {},
      '@/lib/supabase': { supabase: { from: table => {
        const filters = [];
        return { select() { return this; }, eq(...filter) { filters.push(filter); return this; }, in() { return this; }, not() { return this; },
          gte() { return this; }, lt() { return this; }, order() { return this; },
          then(resolve) {
            if (table === 'patients') patientReads.push(filters);
            const rows = table === 'patients' ? patients : stations;
            return Promise.resolve({ data: rows.filter(row => filters.every(([key, value]) => row[key] === value)), error: null }).then(resolve);
          } };
      } } },
    });
    const hook = api.useMonitorData('Consultation', 'Pedia', 'Consultation-Pedia');
    await hook.fetchCubicles(); await hook.fetchPatients();
    assert.equal(states[0].length, 0);
    assert.equal(states[1].length, 0);
    assert.ok(patientReads.every(filters => filters.some(([key, value]) => key === 'subcategory' && value === 'Pedia')));
  }
});

test('Deferred nurse actions replay through the scoped API only for the owning account', async () => {
  for (const owner of ['owner', 'different-account']) {
    const items = new Map(); const calls = [];
    const request = result => { const value = { result }; queueMicrotask(() => value.onsuccess?.()); return value; };
    const store = { add: item => { items.set(item.id, item); return request(item.id); },
      delete: id => { items.delete(id); return request(); }, count: () => request(items.size),
      index: () => ({ getAll: () => request([...items.values()]) }) };
    const db = { transaction: () => ({ objectStore: () => store }) };
    const indexedDB = { open: () => request(db) };
    const api = load('lib/offlineQueue.ts', {
      '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'test-only', user: { id: owner } } } }) },
        from() { throw Error('Clinical replay must not bypass the API'); } } },
      '@/lib/requestFetch': { fetchWithDeadline: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return Response.json({ success: true }); } },
    }, { window: { indexedDB }, indexedDB, navigator: { onLine: true } });
    await api.enqueueMutation({ table: 'patients', type: 'update', payload: { status: 'With Doctor' },
      matchKey: 'id', matchValue: 1, endpoint: '/api/nurse/patients', ownerAuthId: 'owner', expectedStatus: 'Assigned', clientTimestamp: new Date().toISOString() });
    const result = await api.flushMutationQueue();
    assert.equal(result.processed, owner === 'owner' ? 1 : 0);
    assert.equal(result.remaining, owner === 'owner' ? 0 : 1);
    assert.equal(calls.length, owner === 'owner' ? 1 : 0);
    if (calls.length) assert.equal(calls[0].body.expectedStatus, 'Assigned');
  }
});
