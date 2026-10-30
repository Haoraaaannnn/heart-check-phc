/** @fileoverview One-click counter routing and fourth-rotation removal contracts with synthetic tickets. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads production logic with isolated database, React, and transport boundaries. */
function load(file, mocks, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date, console,
    require(name) { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const stations = [{ cubicleNum: 'Pedia-1', category: 'Consultation', subcategory: 'Pedia' },
  { cubicleNum: 'Adult-1', category: 'Consultation', subcategory: 'Adult' },
  { cubicleNum: 'Pedia-2', category: 'Consultation', subcategory: 'Pedia' }];
const ticket = { id: 1, patientNum: 'TEST-1', status: 'On Progress', service: 'Consultation',
  subcategory: 'Pedia', counter: 2, reg_end: null, is_historical: false, rotation_count: 4 };
const mutations = load('app/transfer/lib/transferMutations.ts', {
  '@/lib/supabase': {}, '@/lib/offlineQueue': {}, './constants': { MAX_PATIENTS_PER_CUBICLE: 5 },
});

/** Provides a checked single-row counter update, without contacting Supabase. */
function releaseFixture({ online = true, rejected = false, row = ticket, acknowledged = true, normalizedTimestamp = false } = {}) {
  const writes = []; const queued = [];
  const api = load('app/transfer/lib/releaseCounterPatient.ts', {
    './transferMutations': mutations,
    '@/lib/offlineQueue': { enqueueMutation: async value => queued.push(value) },
    '@/lib/supabase': { supabase: { from: () => {
      const write = { filters: [] }; writes.push(write);
      return { update(fields) { write.fields = fields; return this; },
        eq(...filter) { write.filters.push(filter); return this; },
        is(...filter) { write.filters.push(filter); return this; }, select() { return this; },
        async maybeSingle() {
          const matches = write.filters.every(([key, value]) => row[key] === value);
          const data = matches && !rejected ? { ...row, ...(acknowledged ? write.fields : {}) } : null;
          if (data && normalizedTimestamp) data.reg_end = data.reg_end.replace('.000Z', '+00:00');
          return { data,
            error: rejected ? { message: 'Rejected' } : null };
        } };
    } } },
  }, { navigator: { onLine: online } });
  return { api, writes, queued };
}
const options = { patient: ticket, cubicles: stations, assigned: {}, nowMs: Date.parse('2026-10-30T03:00:00Z') };

test('One counter Queue action completes intake and assigns the least occupied matching cubicle', async () => {
  const fixture = releaseFixture();
  const result = await fixture.api.releaseCounterPatient({ ...options, assigned: { 'Pedia-1': [{ id: 10 }] } });
  assert.equal(result.online, true); assert.equal(result.patient.status, 'Assigned');
  assert.equal(result.patient.cubicleNum, 'Pedia-2'); assert.equal(result.patient.reg_end, result.patient.called_at);
  assert.equal(result.patient.counter_paused_at, null); assert.equal(result.patient.cooldown_until, null);
  assert.equal(fixture.writes.length, 1); assert.equal(fixture.queued.length, 0);
  assert.ok(fixture.writes[0].filters.some(([key, value]) => key === 'is_historical' && value === false));
  assert.ok(fixture.writes[0].filters.some(([key, value]) => key === 'reg_end' && value === null));
});

test('Database timestamp formatting cannot falsely reject an acknowledged counter assignment', async () => {
  const fixture = releaseFixture({ normalizedTimestamp: true });
  const result = await fixture.api.releaseCounterPatient(options);
  assert.equal(result.online, true); assert.equal(result.patient.status, 'Assigned');
});

test('Full or unavailable preferred cubicles keep intake complete and ticket waiting without guessing another lane', async () => {
  const fixture = releaseFixture();
  const result = await fixture.api.releaseCounterPatient({ ...options,
    assigned: { 'Pedia-1': Array(5).fill({}), 'Pedia-2': Array(5).fill({}) } });
  assert.equal(result.patient.status, 'On Progress'); assert.equal(result.patient.cubicleNum, null);
  assert.equal(typeof result.patient.reg_end, 'string'); assert.equal(result.patient.called_at, null);
  const preferred = await fixture.api.releaseCounterPatient({ ...options,
    patient: { ...ticket, preferredCubicleNums: ['Closed-station'] } });
  assert.equal(preferred.patient.status, 'On Progress');
});

test('Rejected, stale, historical, or unacknowledged releases cannot report successful assignment or queue a retry', async () => {
  for (const settings of [{ rejected: true }, { row: { ...ticket, status: 'Assigned' } },
    { row: { ...ticket, counter: 3 } }, { row: { ...ticket, is_historical: true } }, { acknowledged: false }]) {
    const fixture = releaseFixture(settings);
    await assert.rejects(fixture.api.releaseCounterPatient(options), /not accepted/);
    assert.equal(fixture.queued.length, 0);
  }
});

test('Offline counter release is durably queued once with the complete destination', async () => {
  const fixture = releaseFixture({ online: false });
  const result = await fixture.api.releaseCounterPatient(options);
  assert.equal(result.online, false); assert.equal(result.patient.status, 'Assigned');
  assert.equal(fixture.writes.length, 0); assert.equal(fixture.queued.length, 1);
  assert.equal(fixture.queued[0].type, 'update'); assert.equal(fixture.queued[0].payload.cubicleNum, 'Pedia-1');
});

const removalCalls = [];
const removal = load('app/transfer/lib/removeRotatedPatient.ts', {
  './rotateApi': { callRotateApi: async updates => removalCalls.push(updates) },
});
test('Removal unlocks at four rotations only for active waiting stages and retains reporting data', async () => {
  for (const count of [0, 1, 2, 3]) {
    assert.equal(removal.canRemoveRotatedPatient({ ...ticket, rotation_count: count }), false);
    await assert.rejects(removal.removeRotatedPatient({ ...ticket, rotation_count: count }));
  }
  for (const status of ['With Doctor', 'Carryout', 'Done', 'Removed', 'Idle']) {
    assert.equal(removal.canRemoveRotatedPatient({ ...ticket, status }), false);
  }
  await removal.removeRotatedPatient(ticket);
  const update = removalCalls.at(-1)[0];
  assert.equal(update.status, 'Removed'); assert.equal(update.expected.rotation_count, 4);
  assert.equal(update.counter, null); assert.equal(update.cubicleNum, null);
  assert.equal(typeof update.removed_at, 'string'); assert.equal('phoneNum' in update, false);
});

/** Creates the real server route with role checks and guarded database matching. */
function removalRoute({ authorized = true, role = 'staff', row = ticket } = {}) {
  const writes = [];
  const admin = { from(table) {
    const filters = []; let fields;
    return { select() { return this; }, update(value) { fields = value; writes.push(value); return this; },
      eq(key, value) { filters.push(item => item[key] === value); return this; },
      is(key, value) { filters.push(item => (item[key] ?? null) === value); return this; },
      in(key, values) { filters.push(item => values.includes(item[key])); return this; },
      async maybeSingle() { return { data: table === 'users' ? { role } : null, error: null }; },
      then(resolve, reject) { return Promise.resolve({ data: fields && filters.every(filter => filter(row)) ? [{ id: row.id }] : [], error: null }).then(resolve, reject); },
    };
  } };
  const api = load('app/api/rotate/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@supabase/supabase-js': { createClient: () => admin },
    '@/lib/supabase/authGuard': { requireUser: async () => authorized ? { authorized: true, user: { id: 'synthetic-user' } }
      : { authorized: false, response: new Response(null, { status: 401 }) } },
  }, { process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key' } } });
  return { api, writes };
}

test('Server enforces fourth-rotation eligibility, role, historical protection, and stale-count rejection', async () => {
  const update = removalCalls.at(-1)?.[0] ?? { id: 1, status: 'Removed', removed_at: new Date().toISOString(),
    expected: { status: 'On Progress', rotation_count: 4, counter: 2, cubicleNum: null } };
  const request = value => ({ json: async () => ({ updates: [value] }) });
  const accepted = await removalRoute().api.POST(request(update));
  assert.equal((await accepted.json()).results[0].applied, true);
  const tooEarly = removalRoute();
  const rejected = await tooEarly.api.POST(request({ ...update, expected: { ...update.expected, rotation_count: 3 } }));
  assert.equal((await rejected.json()).results[0].applied, false); assert.equal(tooEarly.writes.length, 0);
  for (const row of [{ ...ticket, rotation_count: 3 }, { ...ticket, status: 'With Doctor' }, { ...ticket, is_historical: true }]) {
    assert.equal((await (await removalRoute({ row }).api.POST(request(update))).json()).results[0].applied, false);
  }
  for (const [settings, status] of [[{ authorized: false }, 401], [{ role: 'patient' }, 403]]) {
    const fixture = removalRoute(settings);
    assert.equal((await fixture.api.POST(request(update))).status, status); assert.equal(fixture.writes.length, 0);
  }
});

test('Removal controls appear for eligible tickets including those behind the front of a lane', () => {
  const jsx = (type, props) => ({ type, props });
  const api = load('app/transfer/components/RotatedTicketsPanel.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { useState: initial => [initial, () => {}], useRef: current => ({ current }) },
    '../lib/removeRotatedPatient': removal,
  });
  const patients = [{ ...ticket, id: 2, rotation_count: 3 }, ticket, { ...ticket, id: 3, rotation_count: 5 }];
  const tree = api.RotatedTicketsPanel({ patients, onRemove() {} });
  assert.equal(tree.props.children[1].length, 2);
  assert.equal(api.RotatedTicketsPanel({ patients: patients.slice(0, 1), onRemove() {} }), null);
});
