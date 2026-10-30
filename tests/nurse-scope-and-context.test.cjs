/** @fileoverview Owned-station defaults, explicit global viewing, doctor/location labels and stable sync layout contracts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });

/** Loads production code without touching real authentication, SMS or patient records. */
function load(file, mocks = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Error, Date, URL, console,
    require(name) { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const rules = load('app/nurse/lib/stationView.ts');
const owned = [{ id: 1, cubicleNum: 'Consultation R2 C5', category: 'Consultation', room: 2, doctorId: 'doctor-1', doctorName: 'Physician One' },
  { id: 2, cubicleNum: 'Consultation R2 C6', category: 'Consultation', room: 2, doctorId: null, doctorName: null }];
const outside = { id: 3, cubicleNum: 'Consultation R5 C2', category: 'Consultation', room: 5, doctorId: 'doctor-2', doctorName: 'Physician Two' };
const patients = [
  { id: 1, patientNum: 'TEST-1', cubicleNum: owned[0].cubicleNum, service: 'Consultation' },
  { id: 2, patientNum: 'TEST-2', cubicleNum: outside.cubicleNum, service: 'Consultation' },
  { id: 3, patientNum: 'TEST-3', cubicleNum: owned[1].cubicleNum, service: 'Consultation' },
];

test('All My Cubicles includes every owned cubicle and never expands a service filter to another room', () => {
  const options = { patients, ownedStations: owned, showAllScreening: false, selectedCategory: null, selectedCubicleNum: null };
  assert.deepEqual([...rules.filterNurseStationPatients(options).map(row => row.id)], [1, 3]);
  assert.deepEqual([...rules.filterNurseStationPatients({ ...options, selectedCategory: 'Consultation' }).map(row => row.id)], [1, 3]);
  assert.equal(rules.filterNurseStationPatients({ ...options, selectedCubicleNum: outside.cubicleNum }).length, 0);
  assert.equal(rules.filterNurseStationPatients({ ...options, ownedStations: [] }).length, 0);
  assert.equal(rules.filterNurseStationPatients({ ...options, showAllScreening: true }).length, 0);
  const screeningOwned = owned.map(station => ({ ...station, category: 'OPD Screening' }));
  const screeningPatients = [...patients.map(patient => ({ ...patient, service: 'OPD Screening' })),
    { id: 10, patientNum: 'TEST-10', cubicleNum: outside.cubicleNum, service: 'Consultation' }];
  assert.deepEqual([...rules.filterNurseStationPatients({ ...options, patients: screeningPatients,
    ownedStations: screeningOwned, showAllScreening: true }).map(row => row.id)], [1, 2, 3]);
});

test('Station metadata validates physician names and marks other stations view-only', () => {
  const stations = rules.parseNurseStations([...owned, outside]);
  const contexts = rules.nurseStationContexts({ stations, ownedStations: owned });
  assert.equal(contexts[owned[0].cubicleNum].doctorName, 'Physician One');
  assert.equal(contexts[owned[0].cubicleNum].room, 2); assert.equal(contexts[owned[0].cubicleNum].readOnly, false);
  assert.equal(contexts[outside.cubicleNum].readOnly, true);
  assert.throws(() => rules.parseNurseStations([{ ...outside, doctorName: 123 }]));
});

/** Exercises the real patient GET route against an in-memory, filtered database. */
function route({ role = 'admin', anonymous = false, claims = [1, 2], doctorFailure = false, screening = false } = {}) {
  const reads = [];
  const rows = {
    users: [{ id: 7, role, auth_id: 'auth-owner' }], user_cubicles: claims.map(cubicle_id => ({ cubicle_id, user_id: 7 })),
    services: [{ label_en: 'Consultation', requires_nurse: true, requires_registration: true }],
    cubicle: [...owned, outside], doctors: [{ id: 'doctor-1', full_name: 'Physician One', auth_id: 'doctor-auth' },
      { id: 'doctor-2', full_name: 'Physician Two', auth_id: 'another-auth' }],
    patients: patients.map(patient => ({ ...patient, status: 'Assigned', created_at: new Date().toISOString(), reg_end: new Date().toISOString(),
      is_historical: false, phoneNum: 'synthetic-private-contact', full_name: 'Synthetic private patient name' })),
  };
  rows.patients.push({ ...rows.patients[1], id: 4, status: 'Done' }, { ...rows.patients[0], id: 5, status: 'Done' },
    { ...rows.patients[1], id: 6, is_historical: true });
  if (screening) {
    rows.services[0].label_en = 'OPD Screening';
    rows.cubicle = rows.cubicle.map(station => ({ ...station, category: 'OPD Screening' }));
    rows.patients = rows.patients.map(patient => ({ ...patient, service: 'OPD Screening' }));
    rows.cubicle.push({ id: 4, cubicleNum: 'ECG R1 C1', category: 'ECG', room: 1, doctorId: null });
    rows.patients.push({ ...rows.patients[0], id: 7, patientNum: 'TEST-7', service: 'ECG', cubicleNum: 'ECG R1 C1' });
  }
  const db = { from(table) {
    let fields = '*'; const filters = [];
    const query = { select(value) { fields = value; return this; }, order() { return this; },
      eq(key, value) { filters.push(row => row[key] === value); return this; },
      in(key, values) { filters.push(row => values.includes(row[key])); return this; },
      not(key, _operator, value) { filters.push(row => row[key] !== value && row[key] !== undefined); return this; },
      gte(key, value) { filters.push(row => row[key] >= value); return this; },
      lt(key, value) { filters.push(row => row[key] < value); return this; },
      overlaps(key, values) { filters.push(row => Array.isArray(row[key]) && row[key].some(item => values.includes(item))); return this; },
      async maybeSingle() { const result = response(); return { ...result, data: result.data?.[0] ?? null }; },
      then(resolve, reject) { return Promise.resolve(response()).then(resolve, reject); } };
    function response() {
      reads.push({ table, fields });
      if (doctorFailure && table === 'doctors') return { data: null, error: { code: '42501' } };
      const data = (rows[table] ?? []).filter(row => filters.every(filter => filter(row))).map(row => fields === '*' ? { ...row }
        : Object.fromEntries(fields.split(',').map(field => [field.trim(), row[field.trim()]])));
      return { data, error: null };
    }
    return query;
  } };
  const api = load('app/api/nurse/patients/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@supabase/supabase-js': { createClient: () => db },
    '@/lib/supabase/authGuard': { requireUser: async () => anonymous ? { authorized: false, response: new Response(null, { status: 401 }) }
      : { authorized: true, user: { id: 'auth-owner' } } },
    './transition': { handleNurseTransition() { throw new Error('GET must not mutate patient stages'); } },
    '@/utils/manilaDayRange': load('utils/manilaDayRange.ts'),
    '@/app/nurse/lib/stationView': rules,
  }, { process: { env: {} } });
  return { api, reads, rows, db };
}

test('Even supervisors receive only owned numbers by default, with accurate doctor metadata', async () => {
  const fixture = route(); const response = await fixture.api.GET(new Request('http://localhost/api/nurse/patients'));
  const data = await response.json(); assert.equal(response.status, 200);
  assert.deepEqual(data.patients.map(row => row.id), [1, 3]); assert.deepEqual(data.finishedPatients.map(row => row.id), [5]);
  assert.deepEqual(data.cubicles.map(row => row.id), [1, 2]); assert.equal(data.cubicles[0].doctorName, 'Physician One');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('Shared OPD Screening viewing includes only that service without exposing patient names or contacts', async () => {
  const fixture = route({ role: 'nurse', screening: true });
  const response = await fixture.api.GET(new Request('http://localhost/api/nurse/patients?scope=opd-screening'));
  const data = await response.json(); assert.equal(response.status, 200);
  assert.deepEqual(data.patients.map(row => row.id), [1, 2, 3]);
  assert.equal(data.viewCubicles.length, 3); assert.equal(data.cubicles.length, 2);
  assert.ok([...data.patients, ...data.finishedPatients].every(row => !('phoneNum' in row) && !('full_name' in row)));
  assert.equal(data.viewCubicles[2].doctorName, 'Physician Two');
  assert.ok(data.viewCubicles.every(station => station.category === 'OPD Screening'));
  assert.ok(data.patients.every(patient => patient.service === 'OPD Screening'));
});

test('The global queue endpoint is removed and non-screening doctors cannot request shared service access', async () => {
  const request = url => new Request('http://localhost/api/nurse/patients' + url);
  for (const role of ['doctor', 'admin', 'superadmin']) {
    const fixture = route({ role });
    assert.equal((await fixture.api.GET(request('?scope=all'))).status, 400);
    assert.equal((await fixture.api.GET(request('?scope=opd-screening'))).status, 403);
    const normal = await (await fixture.api.GET(request(''))).json();
    assert.deepEqual(normal.patients.map(row => row.id), [1, 3]);
  }
});

test('No ownership means no default tickets; anonymous requests and failed physician reads are rejected', async () => {
  const empty = await (await route({ claims: [] }).api.GET(new Request('http://localhost/api/nurse/patients'))).json();
  assert.equal(empty.patients.length, 0); assert.equal(empty.cubicles.length, 0);
  assert.equal((await route({ anonymous: true }).api.GET(new Request('http://localhost/api/nurse/patients?scope=opd-screening'))).status, 401);
  assert.equal((await route({ role: 'patient' }).api.GET(new Request('http://localhost/api/nurse/patients?scope=opd-screening'))).status, 403);
  assert.equal((await route({ doctorFailure: true }).api.GET(new Request('http://localhost/api/nurse/patients'))).status, 503);
});

/** Finds elements and visible text in synthetic JSX. */
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return node && typeof node === 'object' ? text(node.props?.children) : '';
}
const nurseTexts = { doctorOnDuty: 'Attending Physician:', noDoctorAssigned: 'No Doctor Assigned', roomPrefix: 'Room', syncingBadge: 'Syncing...',
  viewingMyNumbers: 'Viewing my cubicles', showAllScreening: 'Show all numbers', stationScope: 'Queue scope', viewOnlyTicket: 'View only' };

test('Doctor and location appear on both the station summary and each ticket', () => {
  const mocks = { 'react/jsx-runtime': { jsx, jsxs: jsx }, '@/app/nurse/constants/nurseTexts': { nurseTexts } };
  const bar = load('app/nurse/components/StationScopeBar.tsx', mocks);
  const details = load('app/nurse/components/PatientCardDetails.tsx', { ...mocks,
    '@/app/nurse/components/ElapsedTimer': { ElapsedTimer: 'timer' }, '@/app/nurse/components/NurseDragHandle': { NurseDragHandle: 'grip' } });
  const summary = bar.StationScopeBar({ stations: owned, showAllScreening: false, onToggle() {} });
  assert.match(text(summary), /Consultation R2 C5.*Room 2.*Physician One/);
  const ticket = details.PatientCardDetails({ patient: patients[0], warnAfterSeconds: 600, stationContext: { doctorName: 'Physician One', room: 2, readOnly: false } });
  assert.match(text(ticket), /Room 2.*Physician One/);
});

test('The shared-patient option is hidden outside OPD Screening', () => {
  const api = load('app/nurse/components/StationScopeBar.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, '@/app/nurse/constants/nurseTexts': { nurseTexts },
  });
  const normal = api.StationScopeBar({ stations: owned, showAllScreening: false, onToggle() {} });
  assert.equal(find(normal, node => node.type === 'button').length, 0);
  const screening = api.StationScopeBar({ stations: owned.map(station => ({ ...station, category: 'OPD Screening' })),
    showAllScreening: false, canViewAllScreening: true, onToggle() {} });
  assert.equal(find(screening, node => node.type === 'button').length, 1);
});

test('Sync status reserves identical header space when idle and syncing', () => {
  const api = load('app/nurse/components/NurseHeader.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, react: { useState: initial => [initial, () => {}], useEffect() {}, useMemo: callback => callback() },
    'next-themes': { useTheme: () => ({ resolvedTheme: 'dark', setTheme() {} }) }, '@/lib/theme/themeTransition': {},
    '@/app/dashboard/components/NotificationDropdown': { default: 'notifications' },
    '@/app/nurse/constants/nurseTexts': { nurseTexts }, '@/app/nurse/constants/nurse': { NurseStyle: { headerBar: {} } },
  });
  const props = { assignedCubicles: owned, assignedServices: [], finishedCount: 0, notifications: [] };
  const idle = api.NurseHeader({ ...props, isSyncing: false }); const busy = api.NurseHeader({ ...props, isSyncing: true });
  const sync = tree => find(tree, node => node.props?.['aria-hidden'] !== undefined && node.props?.className?.includes('bg-blue-50'))[0];
  assert.ok(sync(idle)); assert.ok(sync(busy));
  assert.equal(sync(idle).props.className.replace('invisible', 'visible'), sync(busy).props.className);
  assert.equal(sync(idle).props['aria-hidden'], true); assert.equal(sync(busy).props['aria-hidden'], false);
});

test('Numbers from other stations have no selection, drag handles or clinical action controls', () => {
  const calls = []; const api = load('app/nurse/components/NursePatientCard.tsx', {
    '@/components/patients/PatientHistoryButton': { PatientHistoryButton: 'history' },
    'react/jsx-runtime': { jsx, jsxs: jsx }, react: { useState: initial => [initial, () => {}] },
    '@/app/nurse/constants/nurseTexts': { nurseTexts }, '@/app/nurse/constants/nurse': { STAGE_CONFIGS: { assigned: { warnAfterSeconds: 600 } } },
    '@/app/nurse/components/PatientCardDetails': { PatientCardDetails: 'details' },
  });
  const tree = api.NursePatientCard({ patient: patients[1], stage: 'assigned', readOnly: true,
    onSelect: () => calls.push('select'), onPointerDown: () => calls.push('drag'), onCall: () => calls.push('call'), onMoveToWithDoctor: () => calls.push('move') });
  assert.equal(find(tree, node => node.type === 'button').length, 0);
  tree.props.onClick({}); tree.props.onPointerDown({}); tree.props.onKeyDown({});
  assert.equal(calls.length, 0); assert.equal(find(tree, node => node.type === 'details')[0].props.readOnly, true);
});

test('The data hook keeps view-switch callbacks stable, preserves doctor names, and scopes realtime events', async () => {
  const fixture = route({ screening: true }); const slots = []; let cursor = 0; let effects = []; const requests = [];
  fixture.rows.user_services = [{ user_id: 7, service: 'OPD Screening' }];
  fixture.db.auth = { getSession: async () => ({ data: { session: { access_token: 'synthetic', user: { id: 'auth-owner' } } }, error: null }) };
  const unchanged = (first, second) => first && first.length === second.length && first.every((value, index) => Object.is(value, second[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: initial, set: update => { slots[index].value = typeof update === 'function' ? update(slots[index].value) : update; } };
      return [slots[index].value, slots[index].set];
    },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useCallback(callback, deps) {
      const index = cursor++; if (!unchanged(slots[index]?.deps, deps)) slots[index] = { deps, callback };
      return slots[index].callback;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!unchanged(slots[index]?.deps, deps)) { slots[index] = { deps }; effects.push(callback); }
    },
  };
  const api = load('app/nurse/hooks/useNurseData.ts', {
    react, '@/lib/supabase': { supabase: fixture.db }, '@/app/nurse/lib/stationView': rules,
    '@/app/nurse/types/nurse': load('app/nurse/types/nurse.ts'),
  }, { fetch: async url => { requests.push(url); return fixture.api.GET(new Request('http://localhost' + url)); } });
  let firstRender = true;
  function render(showAllScreening) {
    cursor = 0; effects = [];
    const hook = api.useNurseData({ showAllScreening });
    // Run scope invalidation; explicit fetchData below performs initial discovery without an untracked background task.
    if (firstRender || effects.length === 1) effects[0]?.();
    firstRender = false;
    return hook;
  }
  let hook = render(false); const originalFetch = hook.fetchData;
  await hook.fetchData(); hook = render(false);
  assert.deepEqual([...hook.assignedPatients.map(row => row.id)], [1, 3]);
  assert.equal(hook.assignedCubicles[0].doctorName, 'Physician One');
  hook.applyRealtimeUpdate({ eventType: 'INSERT', new: { ...fixture.rows.patients[1], id: 20 } });
  hook = render(false); assert.equal(hook.assignedPatients.some(row => row.id === 20), false);
  hook = render(true); assert.equal(hook.fetchData, originalFetch);
  await hook.fetchData(); hook = render(true);
  assert.ok(requests.includes('/api/nurse/patients?scope=opd-screening'));
  assert.deepEqual([...hook.assignedPatients.map(row => row.id)], [1, 2, 3]);
  assert.equal(hook.stationDirectory.length, 3); assert.equal(hook.assignedCubicles.length, 2);
  hook.applyRealtimeUpdate({ eventType: 'UPDATE', new: { ...fixture.rows.patients[1], status: 'With Doctor' } });
  hook = render(true); assert.equal(hook.withDoctorPatients[0].id, 2);
  hook.applyRealtimeUpdate({ eventType: 'INSERT', new: { ...fixture.rows.patients.find(patient => patient.id === 7), id: 70 } });
  hook = render(true); assert.equal(hook.assignedPatients.some(patient => patient.id === 70), false);
  hook = render(false); assert.equal(hook.fetchData, originalFetch);
  await hook.fetchData(); hook = render(false);
  assert.deepEqual([...hook.assignedPatients.map(row => row.id)], [1, 3]);
  assert.equal(hook.withDoctorPatients.length, 0);
});
