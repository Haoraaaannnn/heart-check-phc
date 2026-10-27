/** @fileoverview Isolated call-routing, public-feed privacy, and monitor-audio regression tests. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads the actual TypeScript module with controlled external dependencies and no network. */
function load(file, mocks, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`);
    return mocks[name];
  }, Response, URL, console, ...globals }, { filename: file });
  return compiledModule.exports;
}

/** Builds a filtered database double so the route's real query scopes are exercised. */
function database(seed, rpcResult = true) {
  const calls = [];
  return {
    calls,
    rpc: async (name, payload) => { calls.push({ name, payload }); return { data: rpcResult, error: null }; },
    from(table) {
      let rows = [...(seed[table] ?? [])];
      const query = {
        select() { return query; },
        eq(key, value) { rows = rows.filter(row => row[key] === value); return query; },
        gt(key, value) { rows = rows.filter(row => row[key] > value); return query; },
        gte(key, value) { rows = rows.filter(row => row[key] >= value); return query; },
        lt(key, value) { rows = rows.filter(row => row[key] < value); return query; },
        in(key, values) { rows = rows.filter(row => values.includes(row[key])); return query; },
        order(key, options = {}) { rows.sort((a, b) => (a[key] > b[key] ? 1 : -1) * (options.ascending === false ? -1 : 1)); return query; },
        limit(count) { rows = rows.slice(0, count); return query; },
        maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
        then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject); },
      };
      return query;
    },
  };
}

/** Returns a small active clinic fixture with an explicitly assigned cubicle. */
function fixtures() {
  return {
    users: [{ id: 10, auth_id: 'staff', role: 'nurse' }],
    patients: [{ id: 1, patientNum: '2011', service: 'Consultation', subcategory: 'Pedia', cubicleNum: 'Consultation R2 C1',
      counter: null, reg_end: new Date().toISOString(), status: 'Assigned', is_historical: false, created_at: new Date().toISOString() }],
    cubicle: [{ id: 7, cubicleNum: 'Consultation R2 C1', category: 'Consultation', subcategory: 'Pedia', room: 2, doctorId: null, on_break: false }],
    counters: [{ counter_number: 1, active: true, on_break: false }],
    user_cubicles: [{ user_id: 10, cubicle_id: 7 }], user_services: [], user_counters: [], doctors: [], user_rooms: [], monitor_calls: [],
  };
}

/** Loads the actual route with a verified or rejected authentication guard. */
function route(seed = fixtures(), rpcResult = true, authenticated = true) {
  const db = database(seed, rpcResult);
  const api = load('app/api/monitor-calls/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': { requireUser: async () => authenticated
      ? { authorized: true, user: { id: 'staff' } }
      : { authorized: false, response: Response.json({ error: 'Not authenticated' }, { status: 401 }) } },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: db },
    '@/utils/formatTicketSpeech': { formatTicketForSpeech: ticket => ticket.split('').join(' ') },
  });
  return { ...api, db };
}

/** Creates a JSON request without sending any real HTTP traffic. */
const post = body => new Request('http://localhost/api/monitor-calls', { method: 'POST', body: JSON.stringify(body) });

test('nurse calls route to the actual cubicle and ignore forged speech/destination fields', async () => {
  const api = route();
  const response = await api.POST(post({ patientId: 1, text: 'Private name', service: 'ECG', counter: 99 }));
  assert.equal(response.status, 202);
  const payload = api.db.calls[0].payload;
  assert.equal(payload.p_service, 'Consultation');
  assert.equal(payload.p_subcategory, 'Pedia');
  assert.equal(payload.p_cubicle, 'Consultation R2 C1');
  assert.equal(payload.p_counter, null);
  assert.match(payload.p_message, /2 0 1 1/);
  assert.doesNotMatch(payload.p_message, /Private name|ECG|99/);
});

test('registration calls route only to the registration monitor', async () => {
  const seed = fixtures();
  Object.assign(seed.patients[0], { cubicleNum: null, counter: 1, reg_end: null, status: 'On Progress' });
  seed.user_cubicles = []; seed.user_counters = [{ user_id: 10, counter: 1 }];
  const api = route(seed);
  assert.equal((await api.POST(post({ patientId: 1 }))).status, 202);
  assert.equal(api.db.calls[0].payload.p_service, 'Registration');
  assert.equal(api.db.calls[0].payload.p_subcategory, null);
  assert.equal(api.db.calls[0].payload.p_counter, 1);
});

test('queue calls stay scoped to their service and patient subdivision', async () => {
  const seed = fixtures();
  Object.assign(seed.patients[0], { cubicleNum: null, status: 'On Progress' });
  seed.user_services = [{ user_id: 10, service: 'Consultation' }];
  const api = route(seed);
  assert.equal((await api.POST(post({ patientId: 1 }))).status, 202);
  assert.equal(api.db.calls[0].payload.p_service, 'Consultation');
  assert.equal(api.db.calls[0].payload.p_cubicle, null);
});

test('unauthenticated, out-of-scope, and historical patient calls are rejected', async () => {
  assert.equal((await route(fixtures(), true, false).POST(post({ patientId: 1 }))).status, 401);
  const seed = fixtures(); seed.user_cubicles = [];
  assert.equal((await route(seed).POST(post({ patientId: 1 }))).status, 403);
  seed.patients[0].is_historical = true;
  assert.equal((await route(seed).POST(post({ patientId: 1 }))).status, 409);
});

test('breaks, finished patients, malformed IDs, and repeated clicks cannot enqueue calls', async () => {
  const seed = fixtures(); seed.cubicle[0].on_break = true;
  const api = route(seed);
  assert.equal((await api.POST(post({ patientId: 1 }))).status, 409);
  assert.equal(api.db.calls.length, 0);
  seed.cubicle[0].on_break = false; seed.patients[0].status = 'Done';
  assert.equal((await route(seed).POST(post({ patientId: 1 }))).status, 409);
  assert.equal((await route().POST(post({ patientId: '1' }))).status, 400);
  assert.equal((await route(fixtures(), false).POST(post({ patientId: 1 }))).status, 429);
});

test('public feed filters other monitors and strips internal patient and actor identifiers', async () => {
  const seed = fixtures();
  seed.monitor_calls = [
    { id: 4, patient_id: 1, actor_id: 'secret', service: 'Consultation', subcategory: 'Pedia', counter: null, cubicle: 'Consultation R2 C1', ticket: '2011', message: 'Number 2011', expires_at: new Date(Date.now() + 90000).toISOString() },
    { id: 5, patient_id: 1, service: 'ECG', subcategory: null, expires_at: new Date(Date.now() + 90000).toISOString() },
  ];
  const response = await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation&subcategory=Pedia&after=0'));
  const json = await response.json();
  assert.equal(json.calls.length, 1);
  assert.deepEqual(Object.keys(json.calls[0]).sort(), ['counter', 'cubicle', 'expiresAt', 'id', 'message', 'ticket']);
  assert.equal(json.cursor, 4);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await (await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation&subcategory=Adult&after=0'))).json()).calls.length, 0);
});

test('expired, moved, and on-break calls never play; new monitors do not replay old calls', async () => {
  const seed = fixtures();
  seed.monitor_calls = [{ id: 4, patient_id: 1, service: 'Consultation', subcategory: 'Pedia', counter: null, cubicle: 'Consultation R2 C1', ticket: '2011', message: 'Number 2011', expires_at: new Date(Date.now() + 90000).toISOString() }];
  const url = 'http://localhost/api/monitor-calls?service=Consultation&subcategory=Pedia';
  let json = await (await route(seed).GET(new Request(url))).json();
  assert.equal(json.calls.length, 0); assert.equal(json.cursor, 4);
  seed.cubicle[0].on_break = true;
  json = await (await route(seed).GET(new Request(`${url}&after=0`))).json();
  assert.equal(json.calls.length, 0); assert.equal(json.cursor, 4);
  seed.cubicle[0].on_break = false; seed.patients[0].cubicleNum = 'Other';
  assert.equal((await (await route(seed).GET(new Request(`${url}&after=0`))).json()).calls.length, 0);
  seed.monitor_calls[0].expires_at = new Date(Date.now() - 1000).toISOString();
  assert.equal((await (await route(seed).GET(new Request(`${url}&after=0`))).json()).calls.length, 0);
});

test('staff transport sends only the patient ID and never creates local audio', async () => {
  let request;
  const api = load('lib/requestMonitorCall.ts', {
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) } } },
  }, { Audio: class { constructor() { throw new Error('Staff audio must remain silent'); } },
    fetch: async (url, options) => { request = { url, ...options }; return Response.json({ success: true }, { status: 202 }); } });
  await api.requestMonitorCall(1);
  assert.equal(request.url, '/api/monitor-calls');
  assert.deepEqual(JSON.parse(request.body), { patientId: 1 });
});

test('monitor speech synthesizes once, repeats sequentially, and releases audio resources', async () => {
  let requests = 0; let plays = 0; let revoked = 0;
  const api = load('app/monitor/lib/playMonitorSpeech.ts', {}, {
    fetch: async () => { requests++; return new Response('test audio'); },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => revoked++ },
    Audio: class { play() { plays++; queueMicrotask(() => this.onended?.()); return Promise.resolve(); } pause() {} },
  });
  await api.playMonitorSpeech('Number 2011', 3, new AbortController().signal);
  assert.equal(requests, 1); assert.equal(plays, 3); assert.equal(revoked, 1);
});

test('monitor playback errors settle the queue and release the audio resource', async () => {
  let revoked = false;
  const api = load('app/monitor/lib/playMonitorSpeech.ts', {}, {
    fetch: async () => new Response('test audio'),
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => { revoked = true; } },
    Audio: class { play() { return Promise.reject(new Error('Autoplay blocked')); } pause() {} },
  });
  await assert.rejects(api.playMonitorSpeech('Number 2011', 3, new AbortController().signal), /Autoplay blocked/);
  assert.equal(revoked, true);
});

test('closing a monitor stops playback instead of leaving the announcement queue stuck', async () => {
  const controller = new AbortController();
  let revoked = false;
  const api = load('app/monitor/lib/playMonitorSpeech.ts', {}, {
    fetch: async () => new Response('test audio'),
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => { revoked = true; } },
    Audio: class { play() { queueMicrotask(() => controller.abort()); return Promise.resolve(); } pause() {} },
  });
  await assert.rejects(api.playMonitorSpeech('Number 2011', 3, controller.signal), /Monitor stopped/);
  assert.equal(revoked, true);
});

test('multi-service monitors receive calls across all requested services with station filtering', async () => {
  const seed = fixtures();
  seed.monitor_calls = [
    { id: 4, patient_id: 1, service: 'Consultation', subcategory: 'Pedia', counter: null, cubicle: 'Consultation R2 C1', ticket: '2011', message: 'Number 2011', expires_at: new Date(Date.now() + 90000).toISOString() },
    { id: 5, patient_id: 2, service: 'ECG', subcategory: null, counter: null, cubicle: 'ECG R1 C1', ticket: '3001', message: 'Number 3001', expires_at: new Date(Date.now() + 90000).toISOString() },
    { id: 6, patient_id: 3, service: 'Registration', subcategory: null, counter: 1, cubicle: null, ticket: '1001', message: 'Number 1001', expires_at: new Date(Date.now() + 90000).toISOString() },
    { id: 7, patient_id: 4, service: 'Warfarin', subcategory: null, counter: null, cubicle: 'Warfarin R1 C1', ticket: '4001', message: 'Number 4001', expires_at: new Date(Date.now() + 90000).toISOString() },
  ];
  seed.patients.push(
    { id: 2, patientNum: '3001', service: 'ECG', subcategory: null, cubicleNum: 'ECG R1 C1', counter: null, reg_end: new Date().toISOString(), status: 'Assigned', is_historical: false, created_at: new Date().toISOString() },
    { id: 3, patientNum: '1001', service: 'Registration', subcategory: null, cubicleNum: null, counter: 1, reg_end: null, status: 'On Progress', is_historical: false, created_at: new Date().toISOString() },
    { id: 4, patientNum: '4001', service: 'Warfarin', subcategory: null, cubicleNum: 'Warfarin R1 C1', counter: null, reg_end: new Date().toISOString(), status: 'Assigned', is_historical: false, created_at: new Date().toISOString() },
  );
  seed.cubicle.push(
    { id: 8, cubicleNum: 'ECG R1 C1', category: 'ECG', subcategory: null, room: 1, doctorId: null, on_break: false },
    { id: 9, cubicleNum: 'Warfarin R1 C1', category: 'Warfarin', subcategory: null, room: 1, doctorId: null, on_break: false },
  );

  const response = await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation,ECG,Registration&after=0'));
  const json = await response.json();
  assert.equal(json.calls.length, 3);
  const tickets = json.calls.map(c => c.ticket).sort();
  assert.deepEqual(tickets, ['1001', '2011', '3001']);
});

test('multi-service monitors exclude registration counter calls if registration is not selected', async () => {
  const seed = fixtures();
  seed.monitor_calls = [
    { id: 4, patient_id: 1, service: 'Consultation', subcategory: 'Pedia', counter: null, cubicle: 'Consultation R2 C1', ticket: '2011', message: 'Number 2011', expires_at: new Date(Date.now() + 90000).toISOString() },
    { id: 6, patient_id: 3, service: 'Registration', subcategory: null, counter: 1, cubicle: null, ticket: '1001', message: 'Number 1001', expires_at: new Date(Date.now() + 90000).toISOString() },
  ];
  seed.patients.push(
    { id: 3, patientNum: '1001', service: 'Registration', subcategory: null, cubicleNum: null, counter: 1, reg_end: null, status: 'On Progress', is_historical: false, created_at: new Date().toISOString() },
  );

  const response = await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation,ECG&after=0'));
  const json = await response.json();
  assert.equal(json.calls.length, 1);
  assert.equal(json.calls[0].ticket, '2011');
});

test('breaks in one service station do not suppress calls in other active services on the same monitor', async () => {
  const seed = fixtures();
  seed.monitor_calls = [
    { id: 4, patient_id: 1, service: 'Consultation', subcategory: 'Pedia', counter: null, cubicle: 'Consultation R2 C1', ticket: '2011', message: 'Number 2011', expires_at: new Date(Date.now() + 90000).toISOString() },
    { id: 5, patient_id: 2, service: 'ECG', subcategory: null, counter: null, cubicle: 'ECG R1 C1', ticket: '3001', message: 'Number 3001', expires_at: new Date(Date.now() + 90000).toISOString() },
  ];
  seed.patients.push(
    { id: 2, patientNum: '3001', service: 'ECG', subcategory: null, cubicleNum: 'ECG R1 C1', counter: null, reg_end: new Date().toISOString(), status: 'Assigned', is_historical: false, created_at: new Date().toISOString() },
  );
  seed.cubicle.push(
    { id: 8, cubicleNum: 'ECG R1 C1', category: 'ECG', subcategory: null, room: 1, doctorId: null, on_break: true }, // ECG cubicle is on break!
  );

  const response = await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation,ECG&after=0'));
  const json = await response.json();
  assert.equal(json.calls.length, 1);
  assert.equal(json.calls[0].ticket, '2011');
});

test('multi-service monitors isolate Pedia and Adult subcategories without cross-talk', async () => {
  const seed = fixtures();
  seed.monitor_calls = [
    { id: 10, patient_id: 1, service: 'Consultation', subcategory: 'Pedia', counter: null, cubicle: 'Consultation R2 C1', ticket: '2011', message: 'Number 2011', expires_at: new Date(Date.now() + 90000).toISOString() },
    { id: 11, patient_id: 20, service: 'Consultation', subcategory: 'Adult', counter: null, cubicle: 'Consultation R3 C1', ticket: '2099', message: 'Number 2099', expires_at: new Date(Date.now() + 90000).toISOString() },
  ];
  seed.patients.push(
    { id: 20, patientNum: '2099', service: 'Consultation', subcategory: 'Adult', cubicleNum: 'Consultation R3 C1', counter: null, reg_end: new Date().toISOString(), status: 'Assigned', is_historical: false, created_at: new Date().toISOString() },
  );
  seed.cubicle.push(
    { id: 30, cubicleNum: 'Consultation R3 C1', category: 'Consultation', subcategory: 'Adult', room: 3, doctorId: null, on_break: false },
  );

  // Poll specifying Consultation-Pedia only: must strictly exclude Consultation-Adult
  const pediaOnly = await (await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation-Pedia&after=0'))).json();
  assert.equal(pediaOnly.calls.length, 1);
  assert.equal(pediaOnly.calls[0].ticket, '2011', 'Consultation-Pedia must only receive Pedia ticket');

  // Poll specifying Consultation-Adult only: must strictly exclude Consultation-Pedia
  const adultOnly = await (await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation-Adult&after=0'))).json();
  assert.equal(adultOnly.calls.length, 1);
  assert.equal(adultOnly.calls[0].ticket, '2099', 'Consultation-Adult must only receive Adult ticket');

  // Poll specifying both Consultation-Pedia and Consultation-Adult
  const bothSubs = await (await route(seed).GET(new Request('http://localhost/api/monitor-calls?service=Consultation-Pedia,Consultation-Adult&after=0'))).json();
  assert.equal(bothSubs.calls.length, 2);
  const tickets = bothSubs.calls.map(c => c.ticket).sort();
  assert.deepEqual(tickets, ['2011', '2099']);
});

test('normalizeMonitorTargets splits services with subcategories into discrete Pedia and Adult targets', () => {
  const hookModule = load('app/monitor/hooks/useCustomMonitorData.ts', {
    'react': { useState: () => [], useRef: () => ({ current: null }), useEffect: () => {}, useCallback: fn => fn, useMemo: fn => fn() },
    '@/lib/supabase': { supabase: {} },
    '@/types/Types': {},
    '@/utils/formatTicketSpeech': { formatTicketForSpeech: t => t },
    './useMonitorCalls': { useMonitorCalls: () => {} },
    '../lib/playMonitorSpeech': { playMonitorSpeech: async () => {} },
    '../lib/sortCubiclePatients': { sortCubiclePatients: arr => arr },
    '@/lib/counters': { fetchActiveCounters: async () => [] },
  });

  // Coarse service name with subcategories splits automatically into Pedia and Adult
  const normalized1 = hookModule.normalizeMonitorTargets(['Consultation', 'Registration']);
  assert.equal(normalized1.length, 3);
  assert.equal(normalized1[0].key, 'Consultation-Pedia');
  assert.equal(normalized1[0].subcategory, 'Pedia');
  assert.equal(normalized1[1].key, 'Consultation-Adult');
  assert.equal(normalized1[1].subcategory, 'Adult');
  assert.equal(normalized1[2].key, 'Registration');
  assert.equal(normalized1[2].subcategory, null);

  // Explicit subcategory is preserved
  const normalized2 = hookModule.normalizeMonitorTargets(['Consultation - Pedia', 'ECG']);
  assert.equal(normalized2.length, 2);
  assert.equal(normalized2[0].key, 'Consultation-Pedia');
  assert.equal(normalized2[0].subcategory, 'Pedia');
  assert.equal(normalized2[1].key, 'ECG');
  assert.equal(normalized2[1].subcategory, null);
});

