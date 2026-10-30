/** @fileoverview Username ownership indicators and assignment-based current-user identity contracts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads real modules with isolated SDK, authentication and React boundaries. */
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Error, console,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return compiled.exports;
}

test('Owner labels use saved usernames and user IDs; a matching username alone never marks ownership', async () => {
  const rows = {
    user_counters: [
      { counter: 1, user_id: 7, users: { username: 'maria' } },
      { counter: 2, user_id: 8, users: { username: 'maria' } },
      { counter: 1, user_id: 7, users: { username: 'maria' } },
      { counter: 3, user_id: 9, users: null },
    ],
    user_cubicles: [{ cubicle_id: 10, user_id: 7, users: [{ username: 'maria' }] },
      { cubicle_id: 10, user_id: 9, users: { username: 'juan' } }],
  };
  const api = load('lib/supabase/stationOwnership.ts', {
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: { from: table => ({ select: async () => ({ data: rows[table], error: null }) }) } },
  });
  const owners = await api.loadStationOwnership(7);
  assert.equal(owners['counter:1'].length, 1); assert.equal(owners['counter:1'][0].isCurrentUser, true);
  assert.equal(owners['counter:2'][0].isCurrentUser, false); assert.equal(owners['counter:2'][0].username, 'maria');
  assert.equal(owners['counter:3'], undefined); assert.equal(owners['cubicle:10'].length, 2);
  assert.deepEqual(Object.keys(owners['cubicle:10'][0]).sort(), ['isCurrentUser', 'username']);
  assert.ok(!JSON.stringify(owners).includes('auth_id'));
});

test('Unavailable ownership metadata is an explicit failure rather than an invented owner', async () => {
  const api = load('lib/supabase/stationOwnership.ts', {
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: { from: () => ({ select: async () => ({ data: null, error: { code: '42501' } }) }) } },
  });
  await assert.rejects(api.loadStationOwnership(7), /Unable to load station ownership/);
});

const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx };
const badge = load('components/reusables/StationOwnerBadge.tsx', { 'react/jsx-runtime': runtime });

/** Collects visible strings from the synthetic React tree. */
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  return typeof node.type === 'function' ? text(node.type(node.props)) : text(node.props?.children);
}

test('Labels distinguish your account, other accounts, loading and genuinely unassigned stations', () => {
  assert.match(text(badge.StationOwnerBadge({ owners: [{ username: 'maria', isCurrentUser: true }] })), /Owner: maria \(You\)/);
  assert.equal(text(badge.StationOwnerBadge({ owners: [{ username: 'juan', isCurrentUser: false }] })), 'Owner: juan');
  assert.equal(text(badge.StationOwnerBadge({ owners: [] })), 'Unassigned');
  assert.equal(text(badge.StationOwnerBadge({})), 'Checking owner...');
});

test('Nurse page names your stations even while another station is selected', () => {
  const stations = [
    { kind: 'cubicle', id: 10, label: 'Cubicle 1', owners: [{ username: 'maria', isCurrentUser: true }] },
    { kind: 'cubicle', id: 20, label: 'Cubicle 2', owners: [{ username: 'juan', isCurrentUser: false }] },
  ];
  const api = load('app/nurse/components/NurseBreakControls.tsx', {
    'react/jsx-runtime': runtime, react: { useState: value => [value, () => {}] },
    '@/hooks/useStationBreaks': { useStationBreaks: () => ({ stations, error: '', busy: null }) },
    '@/components/reusables/StationBreakButton': { StationBreakButton: () => null },
    '@/components/reusables/StationOwnerBadge': badge,
  });
  const visible = text(api.NurseBreakControls({ selectedCubicleNum: 'Cubicle 2' }));
  assert.match(visible, /Your stations \(maria\): Cubicle 1/); assert.match(visible, /Owner: juan/);
});

test('Counter cards display their assigned usernames and mark only your own counter', () => {
  const stations = [
    { kind: 'counter', id: 1, active: true, onBreak: false, owners: [{ username: 'juan', isCurrentUser: false }] },
    { kind: 'counter', id: 2, active: true, onBreak: false, owners: [{ username: 'maria', isCurrentUser: true }] },
  ];
  const api = load('app/transfer/components/RegistrationCounterSection.tsx', {
    '@/components/patients/PatientHistoryButton': { PatientHistoryButton: () => null },
    'react/jsx-runtime': runtime, react: { useState: value => [value, () => {}], useRef: current => ({ current }), useMemo: fn => fn() },
    './CounterTimerControl': { CounterTimerControl: () => null },
    '@/constants/texts/transferTexts': { transferTexts: {} },
    '@/app/transfer/constants/transfer': { TransferStyle: {} },
    '@/constants/designs/transferStyles': { registrationCounterStyles: {} },
    '@/app/transfer/components/DragHandle': { DragHandle: () => null },
    '@/hooks/useStationBreaks': { useStationBreaks: () => ({ stations, error: '', busy: null }) },
    '@/components/reusables/StationBreakButton': { StationBreakButton: () => null },
    '@/components/reusables/StationOwnerBadge': badge,
  });
  const visible = text(api.RegistrationCounterSection({ patients: [], allowedCounters: [1, 2] }));
  assert.match(visible, /Owner: juan/); assert.match(visible, /Owner: maria \(You\)/);
  assert.ok(!visible.includes('juan (You)'));
});

/** Verifies destination selection independently of another counter's operational controls. */
test('Owned tickets can move to another staffed open counter without unlocking its queue controls', () => {
  const transfers = [];
  const stations = [1, 2, 3, 4].map(id => ({ kind: 'counter', id, active: id !== 4, onBreak: id === 3,
    owners: [{ username: `staff-${id}`, isCurrentUser: id === 1 }] }));
  const api = load('app/transfer/components/RegistrationCounterSection.tsx', {
    'react/jsx-runtime': runtime, react: { useState: value => [value, () => {}], useRef: current => ({ current }), useMemo: fn => fn() },
    '@/components/patients/PatientHistoryButton': { PatientHistoryButton: 'history' },
    './CounterTimerControl': { CounterTimerControl: 'timer' }, '@/constants/texts/transferTexts': { transferTexts: { sendToQueueBtn: 'Queue' } },
    '@/app/transfer/constants/transfer': { TransferStyle: {} }, '@/constants/designs/transferStyles': { registrationCounterStyles: {} },
    '@/app/transfer/components/DragHandle': { DragHandle: 'drag-handle' },
    '@/hooks/useStationBreaks': { useStationBreaks: () => ({ stations, error: '', busy: null }) },
    '@/components/reusables/StationBreakButton': { StationBreakButton: 'break-control' },
    '@/components/reusables/StationOwnerBadge': { StationOwnerBadge: 'owner' },
  });
  /** Collects real rendered ticket controls and destination callbacks without changing their behavior. */
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    return node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
  }
  const patients = [1, 2].map(id => ({ id, counter: id, patientNum: `TEST-${id}`, service: 'Consultation' }));
  const tree = nodes(api.RegistrationCounterSection({ patients, allCounters: [1, 2, 3, 4], allowedCounters: [1],
    selectedPatient: { patient: patients[0], sourceType: 'counter', sourceId: 1 },
    onTargetCounterClick: counter => transfers.push(counter), onRelease() {} }));
  const destinations = tree.filter(node => node.props?.['data-counter'] != null);
  assert.deepEqual(destinations.map(node => node.props['data-counter']), [1, 2]);
  destinations.find(node => node.props['data-counter'] === 2).props.onClick();
  destinations.find(node => node.props['data-counter'] === 1).props.onClick();
  assert.deepEqual(transfers, [2]);
  assert.equal(tree.filter(node => node.type === 'button' && node.props.children === 'Queue').length, 1);
  assert.equal(tree.find(node => node.type === 'timer' && node.props.patient.id === 2).props.readOnly, true);
});

/** Creates the actual authenticated station endpoint with controlled permissions. */
function stationRoute({ authorized = true, role = 'admin' } = {}) {
  let ownerReads = 0; const writes = [];
  const data = {
    users: [{ id: 7, role }], counters: [{ counter_number: 1, active: true, on_break: false }],
    cubicle: [{ id: 10, cubicleNum: 'Cubicle 1', category: 'Consultation', room: 1, doctorId: null, on_break: false },
      { id: 20, cubicleNum: 'Cubicle 2', category: 'Consultation', room: 2, doctorId: null, on_break: false }],
    user_counters: [], user_cubicles: [{ cubicle_id: 10 }], user_rooms: [], doctors: [],
  };
  const admin = { from: table => {
    const query = { select() { return this; }, eq() { return this; }, order() { return this; },
      update(fields) { writes.push({ table, fields }); return this; },
      maybeSingle: async () => ({ data: data[table][0], error: null }),
      then: (resolve, reject) => Promise.resolve({ data: data[table], error: null }).then(resolve, reject) };
    return query;
  } };
  const api = load('app/api/station-breaks/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/supabase/authGuard': { requireUser: async () => authorized ? { authorized: true, user: { id: 'test-auth' } }
      : { authorized: false, response: new Response(null, { status: 401 }) } },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: admin },
    '@/lib/supabase/stationOwnership': { loadStationOwnership: async () => { ownerReads++; return {
      'counter:1': [{ username: 'juan', isCurrentUser: false }], 'cubicle:10': [{ username: 'maria', isCurrentUser: true }],
    }; } },
  });
  return { api, ownerReads: () => ownerReads, writes };
}

test('Ownership labels remain authenticated and administrator permissions do not imply ownership', async () => {
  const anonymous = stationRoute({ authorized: false });
  assert.equal((await anonymous.api.GET({})).status, 401); assert.equal(anonymous.ownerReads(), 0);
  const forbidden = stationRoute({ role: 'patient' });
  assert.equal((await forbidden.api.GET({})).status, 403); assert.equal(forbidden.ownerReads(), 0);
  const admin = stationRoute(); const response = await admin.api.GET({});
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.stations.find(station => station.kind === 'counter').owners[0].isCurrentUser, false);
  assert.equal(body.stations.find(station => station.id === 10).owners[0].username, 'maria');
});

test('Adding owner labels does not grant break control for another nurse cubicle', async () => {
  const fixture = stationRoute({ role: 'nurse' });
  const response = await fixture.api.POST({ json: async () => ({ kind: 'cubicle', id: 20, onBreak: true,
    owners: [{ username: 'maria', isCurrentUser: true }] }) });
  assert.equal(response.status, 403); assert.equal(fixture.writes.length, 0); assert.equal(fixture.ownerReads(), 0);
});
