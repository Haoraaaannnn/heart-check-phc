/** @fileoverview Physician account linking, scoped nurse edits, and concurrent rotation regression contracts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads real production logic with synthetic authentication and persistence boundaries. */
function load(file, mocks = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date, Error, console,
    require(name) { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const contracts = load('lib/doctors/contracts.ts');
const accountSync = load('lib/doctors/syncAccounts.ts');
const access = load('lib/doctors/access.ts', { './contracts': contracts });
const doctorId = '00000000-0000-4000-8000-000000000001';
const otherDoctorId = '00000000-0000-4000-8000-000000000002';

/** Builds a guarded in-memory physician store with no patient information or external service calls. */
function store({ role = 'nurse', rejectWrites = false, accounts = [], doctors, claims = [{ user_id: 1, cubicle_id: 1 }] } = {}) {
  const writes = [];
  const tables = { users: [{ id: 1, auth_id: 'staff', username: 'staff', role }, ...accounts],
    doctors: doctors ?? [{ id: doctorId, full_name: 'Edited physician', active: false, auth_id: 'existing', specialty: 'Edited specialty' },
      { id: otherDoctorId, full_name: 'Other physician', active: true, auth_id: null, specialty: null }],
    cubicle: [{ id: 1, cubicleNum: 'Pedia-1', category: 'Consultation', room: 1, subcategory: 'Pedia', doctorId },
      { id: 2, cubicleNum: 'Adult-1', category: 'Consultation', room: 2, subcategory: 'Adult', doctorId: otherDoctorId }],
    user_cubicles: claims, user_services: [], user_rooms: [] };
  const db = { from(table) {
    let filters = []; let operation = 'read'; let payload;
    const query = {
      select() { return this; }, order() { return this; }, limit() { return this; },
      eq(key, value) { filters.push(row => row[key] === value); return this; },
      is(key, value) { filters.push(row => (row[key] ?? null) === value); return this; },
      in(key, values) { filters.push(row => values.includes(row[key])); return this; },
      insert(value) { operation = 'insert'; payload = value; return this; },
      update(value) { operation = 'update'; payload = value; return this; },
      delete() { operation = 'delete'; return this; },
      async maybeSingle() { const result = execute(); return { ...result, data: result.data?.[0] ?? null }; },
      then(resolve, reject) { return Promise.resolve(execute()).then(resolve, reject); },
    };
    function execute() {
      const matched = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
      if (operation === 'read') return { data: matched.map(row => ({ ...row })), error: null };
      writes.push({ table, operation, payload });
      if (rejectWrites) return { data: null, error: { code: '42501' } };
      if (operation === 'insert') {
        const inserted = (Array.isArray(payload) ? payload : [payload]).map((value, index) => ({
          id: `00000000-0000-4000-8000-${String(100 + tables[table].length + index).padStart(12, '0')}`, specialty: null, ...value }));
        tables[table].push(...inserted); return { data: inserted, error: null };
      }
      if (operation === 'update') matched.forEach(row => Object.assign(row, payload));
      if (operation === 'delete') tables[table] = tables[table].filter(row => !matched.includes(row));
      return { data: matched.map(row => ({ ...row })), error: null };
    }
    return query;
  } };
  return { db, tables, writes };
}

test('Doctor account linking is repeatable and preserves edited names, specialties and inactive state', async () => {
  const fixture = store({ accounts: [{ auth_id: 'existing', username: 'changed_username', role: 'doctor' },
    { auth_id: 'new-doctor', username: 'new_doctor', role: 'doctor' }, { auth_id: 'not-doctor', username: 'staff_user', role: 'staff' }] });
  await accountSync.syncDoctorAccounts({ db: fixture.db });
  await accountSync.syncDoctorAccounts({ db: fixture.db });
  const original = fixture.tables.doctors.find(row => row.auth_id === 'existing');
  assert.equal(original.full_name, 'Edited physician'); assert.equal(original.active, false);
  assert.equal(original.specialty, 'Edited specialty');
  assert.equal(fixture.tables.doctors.filter(row => row.auth_id === 'new-doctor').length, 1);
  assert.equal(fixture.tables.doctors.find(row => row.auth_id === 'new-doctor').full_name, 'new_doctor');
  assert.equal(fixture.tables.doctors.some(row => row.auth_id === 'not-doctor'), false);
});

test('Login-time linking only creates the authenticated doctor profile and reports failed persistence', async () => {
  const accounts = [{ auth_id: 'new-doctor', username: 'new_doctor', role: 'doctor' }, { auth_id: 'another', username: 'another', role: 'doctor' }];
  const fixture = store({ accounts });
  await accountSync.syncDoctorAccounts({ db: fixture.db, authId: 'new-doctor' });
  assert.equal(fixture.tables.doctors.some(row => row.auth_id === 'new-doctor'), true);
  assert.equal(fixture.tables.doctors.some(row => row.auth_id === 'another'), false);
  await assert.rejects(accountSync.syncDoctorAccounts({ db: store({ accounts, rejectWrites: true }).db }), /could not be added/);
});

/** Creates the real shared directory endpoint with an authenticated synthetic staff identity. */
function directoryRoute(settings = {}) {
  const fixture = store(settings);
  const api = load('app/api/doctors/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': { requireUser: async () => settings.anonymous
      ? { authorized: false, response: new Response(null, { status: 401 }) }
      : { authorized: true, user: { id: 'staff' } } },
    '@/lib/supabase/admin': { createAdminClient: () => fixture.db },
    '@/lib/doctors/syncAccounts': accountSync, '@/lib/doctors/contracts': contracts,
    '@/lib/doctors/access': access,
  });
  return { ...fixture, api };
}
const request = body => ({ json: async () => body });

test('Shared directory returns doctor accounts and exposes only the nurse station editing controls', async () => {
  const fixture = directoryRoute({ accounts: [{ auth_id: 'new-doctor', username: 'new_doctor', role: 'doctor' }] });
  const response = await fixture.api.GET({}); const directory = await response.json();
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok(directory.doctors.some(row => row.full_name === 'new_doctor'));
  assert.deepEqual(directory.editableCubicleIds, [1]); assert.deepEqual(directory.editableDoctorIds, [doctorId]);
  assert.equal(directory.canManageDirectory, false);
});

test('Nurse can edit a station physician and assign another physician in the same shared store', async () => {
  const fixture = directoryRoute();
  const edit = await fixture.api.POST(request({ action: 'update', id: doctorId, full_name: 'New display name', specialty: 'Cardiology', active: true,
    auth_id: 'forged', role: 'superadmin' }));
  assert.equal(edit.status, 200); assert.equal(fixture.tables.doctors[0].full_name, 'New display name');
  assert.equal(fixture.tables.doctors[0].auth_id, 'existing');
  const assign = await fixture.api.POST(request({ action: 'assign', cubicleId: 1, doctorId: otherDoctorId, expectedDoctorId: doctorId }));
  assert.equal(assign.status, 200); assert.equal(fixture.tables.cubicle[0].doctorId, otherDoctorId);
  const refreshed = await (await fixture.api.GET({})).json();
  assert.deepEqual(refreshed.editableDoctorIds, [otherDoctorId]);
});

test('Server rejects out-of-scope nurse edits, administrative deletion, and writes by other clinical roles', async () => {
  for (const body of [{ action: 'update', id: otherDoctorId, full_name: 'Unowned', specialty: null, active: true },
    { action: 'assign', cubicleId: 2, doctorId, expectedDoctorId: otherDoctorId }, { action: 'delete', id: doctorId },
    { action: 'create', full_name: 'New doctor', specialty: null, active: true }]) {
    const fixture = directoryRoute();
    assert.equal((await fixture.api.POST(request(body))).status, 403); assert.equal(fixture.writes.length, 0);
  }
  for (const role of ['staff', 'registration', 'doctor']) {
    const fixture = directoryRoute({ role });
    assert.equal((await fixture.api.POST(request({ action: 'active', id: doctorId, active: true }))).status, 403);
    assert.equal(fixture.writes.length, 0);
  }
  assert.equal((await directoryRoute({ anonymous: true }).api.GET({})).status, 401);
});

test('Stale assignments and rejected writes never claim success; account-linked physicians cannot be deleted', async () => {
  const fixture = directoryRoute();
  const stale = await fixture.api.POST(request({ action: 'assign', cubicleId: 1, doctorId, expectedDoctorId: null }));
  assert.equal(stale.status, 409); assert.equal(fixture.tables.cubicle[0].doctorId, doctorId);
  const rejected = directoryRoute({ rejectWrites: true });
  assert.equal((await rejected.api.POST(request({ action: 'active', id: doctorId, active: true }))).status, 409);
  assert.equal((await directoryRoute({ role: 'superadmin' }).api.POST(request({ action: 'delete', id: doctorId }))).status, 409);
});

/** Creates the real transport with a simulated acknowledged or rejected batch response. */
function transport(results) {
  return load('app/transfer/lib/rotateApi.ts', { '@/lib/supabase': { supabase: { auth: {
    getSession: async () => ({ data: { session: { access_token: 'synthetic' } } }),
  } } } }, { fetch: async () => ({ ok: true, json: async () => ({ results }) }) });
}

test('Rotation distinguishes stale concurrency from storage failure and invalid acknowledgements', async () => {
  const stale = transport([{ id: 1, applied: false, code: 'stale' }]);
  await assert.rejects(stale.callRotateApi([{ id: 1 }]), error => error instanceof stale.RotationConflictError);
  const rejected = transport([{ id: 1, applied: false, code: 'rejected' }]);
  await assert.rejects(rejected.callRotateApi([{ id: 1 }]), error => !(error instanceof rejected.RotationConflictError));
  await assert.rejects(transport([{ id: 99, applied: true }]).callRotateApi([{ id: 1 }]));
  await assert.rejects(transport([{ id: 1, applied: true }, { id: 1, applied: true }]).callRotateApi([{ id: 1 }, { id: 2 }]));
  await transport([{ id: 1, applied: true }]).callRotateApi([{ id: 1 }]);
});

const idlePolicy = load('lib/idleRotationPolicy.ts');
class StaleRotation extends Error {}
/** Runs the general timer once with controllable asynchronous persistence and refreshes. */
function rotationHook({ patients, conflict = false, delayed = false, rejected = false }) {
  const effects = []; const writes = []; const logs = []; let tick; let refreshes = 0; let completeRead;
  const read = delayed ? new Promise(resolve => { completeRead = resolve; }) : Promise.resolve();
  const db = { from: table => ({ select() { return this; }, eq() { return this; }, not() { return this; }, neq() { return this; },
    gte() { return this; }, order() { return this; }, limit() { return this; },
    maybeSingle: async () => ({ data: { queue_position: 5 } }),
    then: (resolve, reject) => read.then(() => ({ data: [], error: null })).then(resolve, reject),
  }) };
  const api = load('app/transfer/hooks/useAutoRotate.ts', {
    react: { useRef: current => ({ current }), useEffect: effect => effects.push(effect) },
    '@/lib/supabase': { supabase: db }, '@/lib/idleRotationPolicy': idlePolicy,
    '@/app/transfer/lib/rotateApi': { RotationConflictError: StaleRotation, callRotateApi: async updates => {
      writes.push(...updates); if (conflict) throw new StaleRotation('Stale');
      if (rejected) throw new Error('Storage unavailable');
    } },
  }, { console: { log() {}, error: (...items) => logs.push(items) }, setInterval: callback => { tick = callback; return 1; }, clearInterval() {} });
  api.useAutoRotate({ onProgressPatients: patients, assignedPatients: {}, fetchData: async () => { refreshes++; },
    busyRef: { current: false }, rotateTimeoutMs: 1, maxRotations: 5, pendingIdsRef: { current: new Set() } });
  effects.forEach(effect => effect());
  return { run: () => tick(), writes, logs, refreshed: () => refreshes, completeRead };
}
const expiredTicket = { id: 1, patientNum: 'TEST-1', service: 'Consultation', status: 'On Progress', counter: 1,
  reg_end: null, rotation_count: 1, progress_started_at: '2020-01-01T00:00:00Z' };

test('General queue timer never competes with registration timer for unfinished counter patients', async () => {
  const fixture = rotationHook({ patients: [expiredTicket] });
  await fixture.run(); assert.equal(fixture.writes.length, 0);
  const registered = rotationHook({ patients: [{ ...expiredTicket, reg_end: '2020-01-01T00:01:00Z' }] });
  await registered.run(); assert.equal(registered.writes.length, 1);
});

test('Concurrent rotations refresh the snapshot and slow timer reads cannot overlap', async () => {
  const fixture = rotationHook({ patients: [{ ...expiredTicket, reg_end: '2020-01-01T00:01:00Z' }], conflict: true, delayed: true });
  const first = fixture.run(); await fixture.run();
  fixture.completeRead(); await first;
  assert.equal(fixture.writes.length, 1); assert.equal(fixture.refreshed(), 1); assert.equal(fixture.logs.length, 0);
});

test('Real storage failures still report an error while refreshing the patient snapshot', async () => {
  const fixture = rotationHook({ patients: [{ ...expiredTicket, reg_end: '2020-01-01T00:01:00Z' }], rejected: true });
  await fixture.run(); assert.equal(fixture.refreshed(), 1); assert.equal(fixture.logs.length, 1);
  assert.match(fixture.logs[0].join(' '), /Storage unavailable/);
});

test('Registration timer refreshes stale counter rotations and locks before its first asynchronous read', async () => {
  const effects = []; const writes = []; const logs = []; let tick; let finishRead; let refreshed = 0;
  const read = new Promise(resolve => { finishRead = resolve; });
  const api = load('app/transfer/hooks/useRegistrationRotate.ts', {
    react: { useRef: current => ({ current }), useEffect: effect => effects.push(effect) },
    '@/lib/counters': { fetchActiveCounters: () => read }, '@/lib/idleRotationPolicy': idlePolicy,
    '@/app/transfer/lib/rotateApi': { RotationConflictError: StaleRotation, callRotateApi: async updates => {
      writes.push(...updates); throw new StaleRotation('Stale');
    } },
  }, { console: { log() {}, error: (...items) => logs.push(items) }, setInterval: callback => { tick = callback; return 1; }, clearInterval() {} });
  api.useRegistrationRotate({ registrationPatients: [{ ...expiredTicket, counter_top_started_at: '2020-01-01T00:00:00Z' }],
    onRotated: async () => { refreshed++; }, busyRef: { current: false }, rotateTimeoutMs: 1, maxRotations: 5 });
  effects.forEach(effect => effect());
  const first = tick(); await tick(); finishRead([1]); await first;
  assert.equal(writes.length, 1); assert.equal(refreshed, 1); assert.equal(logs.length, 0);
  assert.equal(writes[0].expected.rotation_count, 1); assert.equal(writes[0].expected.counter_paused_at, null);
});

test('Doctor login links the verified account before success and preserves login when directory refresh fails', async () => {
  for (const rejectDirectory of [false, true]) {
    const events = [];
    const query = { select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; },
      maybeSingle: async () => ({ data: { role: 'doctor' } }), upsert: async () => ({ error: null }) };
    const admin = { from: () => query };
    const api = load('app/api/auth/login/route.ts', {
      'next/server': { NextResponse: { json: (body, options) => { events.push('response'); return Response.json(body, options); } } },
      '@supabase/supabase-js': { createClient: () => admin },
      'next/headers': { cookies: async () => ({ getAll: () => [], set() {} }) },
      '@supabase/ssr': { createServerClient: () => ({ auth: { signInWithPassword: async () => ({
        data: { session: {}, user: { id: 'doctor-auth' } }, error: null,
      }) } }) },
      '@/lib/doctors/syncAccounts': { syncDoctorAccounts: async options => {
        assert.equal(options.authId, 'doctor-auth'); assert.equal(options.db, admin); events.push('linked');
        if (rejectDirectory) throw new Error('Directory unavailable');
      } },
    }, { process: { env: {} }, URL, console: { error() {}, warn() {} } });
    const response = await api.POST(new Request('http://localhost/api/auth/login', { method: 'POST',
      body: JSON.stringify({ email: 'doctor@example.invalid', password: 'synthetic-only' }) }));
    assert.equal(response.status, 200); const result = await response.json();
    assert.equal(result.role, 'doctor'); assert.equal(typeof result.warning === 'string', rejectDirectory);
    assert.deepEqual(events, ['linked', 'response']);
  }
});

test('Nurse header exposes the shared Doctors editor action', () => {
  let opened = false; const jsx = (type, props) => ({ type, props });
  const api = load('app/nurse/components/NurseHeader.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { useState: initial => [initial, () => {}], useEffect() {}, useMemo: callback => callback() },
    'next-themes': { useTheme: () => ({ resolvedTheme: 'light', setTheme() {} }) },
    '@/lib/theme/themeTransition': {}, '@/app/dashboard/components/NotificationDropdown': { default: 'notifications' },
    '@/app/nurse/constants/nurseTexts': { nurseTexts: {} }, '@/app/nurse/constants/nurse': { NurseStyle: { headerBar: {} } },
  });
  const tree = api.NurseHeader({ assignedCubicles: [], finishedCount: 0, notifications: [],
    onOpenDoctors() { opened = true; } });
  function find(node) {
    if (Array.isArray(node)) return node.flatMap(find);
    if (!node || typeof node !== 'object') return [];
    const isDocBtn = node.type === 'button' && (
      node.props?.children === 'Doctors' ||
      JSON.stringify(node.props?.children || '').includes('Doctors')
    );
    return [...(isDocBtn ? [node] : []), ...find(node.props?.children)];
  }
  const buttons = find(tree); assert.equal(buttons.length, 1); buttons[0].props.onClick(); assert.equal(opened, true);
});
