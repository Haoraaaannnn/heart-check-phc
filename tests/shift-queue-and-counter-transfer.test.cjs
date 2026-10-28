/** @fileoverview Isolated shift-boundary, cancellation and acknowledged handoff contracts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads production rules and routes without real patient or database access. */
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date, Error, console,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}

const rules = load('lib/queueRotationPolicy.ts');
const morning = '2026-10-27T16:00:00.000Z';
const afternoon = '2026-10-28T05:00:00.000Z';

test('Manila shift boundary changes exactly at 1 PM and midnight', () => {
  assert.equal(rules.rotationShiftStart(Date.parse('2026-10-28T04:59:59.999Z')), morning);
  assert.equal(rules.rotationShiftStart(Date.parse(afternoon)), afternoon);
  assert.equal(rules.rotationShiftStart(Date.parse('2026-10-28T15:59:59.999Z')), afternoon);
  assert.equal(rules.rotationShiftStart(Date.parse('2026-10-28T16:00:00.000Z')), '2026-10-28T16:00:00.000Z');
});

test('First five rotations remain active and only the sixth cancels', () => {
  for (let count = 0; count <= 5; count++) {
    const next = rules.nextShiftRotation({ rotationCount: count, shiftStartedAt: morning, nowMs: Date.parse('2026-10-28T04:00:00Z') });
    assert.equal(next.rotationCount, count + 1);
    assert.equal(next.cancelled, count === 5);
  }
});

test('Morning carryover and fresh afternoon tickets have independent counts', () => {
  const nowMs = Date.parse(afternoon);
  const carried = rules.nextShiftRotation({ rotationCount: 5, shiftStartedAt: morning, nowMs });
  assert.equal(carried.rotationCount, 1); assert.equal(carried.cancelled, false);
  const newer = rules.nextShiftRotation({ rotationCount: 0, shiftStartedAt: afternoon, nowMs });
  assert.equal(newer.rotationCount, 1); assert.equal(newer.cancelled, false);
  assert.equal(rules.nextShiftRotation({ rotationCount: 4, shiftStartedAt: afternoon, nowMs }).rotationCount, 5);
});

/** Builds a guarded handoff endpoint with a controlled database outcome. */
function transferRoute({ authorized = true, result = true, error = null } = {}) {
  const calls = [];
  const api = load('app/api/counter-transfer/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/supabase/authGuard': { requireUser: async () => authorized
      ? { authorized: true, user: { id: 'actual-caller' } } : { authorized: false, response: new Response(null, { status: 401 }) } },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: { rpc: async (name, params) => { calls.push({ name, params }); return { data: result, error }; } } },
  });
  return { api, calls };
}

test('Anonymous and malformed handoffs never reach the database', async () => {
  const anonymous = transferRoute({ authorized: false });
  assert.equal((await anonymous.api.POST({})).status, 401); assert.equal(anonymous.calls.length, 0);
  for (const body of [null, {}, { patientId: 1, sourceCounter: 1, targetCounter: '2' }, { patientId: -1, sourceCounter: 1, targetCounter: 2 }]) {
    const { api, calls } = transferRoute();
    assert.equal((await api.POST({ json: async () => body })).status, 400); assert.equal(calls.length, 0);
  }
});

test('Handoffs use the authenticated caller and require a durable database acknowledgement', async () => {
  const body = { patientId: 1, sourceCounter: 1, targetCounter: 2, caller_auth_id: 'forged-caller' };
  const { api, calls } = transferRoute();
  const response = await api.POST({ json: async () => body });
  assert.equal(response.status, 200); assert.equal(calls[0].params.caller_auth_id, 'actual-caller');
  assert.equal(calls[0].params.source_counter, 1); assert.equal(calls[0].params.destination_counter, 2);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  for (const options of [{ result: false }, { result: null, error: { message: 'private diagnostic' } }]) {
    const rejection = await transferRoute(options).api.POST({ json: async () => body });
    assert.equal(rejection.status, 409); assert.ok(!(await rejection.text()).includes('private diagnostic'));
  }
});

/** Runs the actual selection hook with one selected synthetic ticket. */
function selection(moveCounterPatient) {
  let stateIndex = 0; let patients = [{ id: 1, counter: 1 }]; let error = ''; let updates = 0;
  const api = load('app/transfer/hooks/useTransferSelection.ts', {
    react: { useState: () => stateIndex++ === 0
      ? [{ patient: patients[0], sourceType: 'counter', sourceId: 1 }, () => {}]
      : ['', value => { error = value; }], useEffect() {}, useCallback: fn => fn },
    '@/app/transfer/lib/moveCounterPatient': { moveCounterPatient },
    '@/app/transfer/lib/constants': { MAX_PATIENTS_PER_CUBICLE: 5 },
  });
  const hook = api.useTransferSelection({ assignedPatients: {}, setOnProgressPatients() {}, setAssignedPatients() {}, setPendingUpdates() {},
    setRegistrationPatients: update => { updates++; patients = update(patients); } });
  return { hook, current: () => ({ patients, error, updates }) };
}

test('Counter selection updates the screen only after success and preserves tickets on failure', async () => {
  let acknowledge;
  const pending = new Promise(resolve => { acknowledge = resolve; });
  const successful = selection(async () => pending);
  const completion = successful.hook.moveSelectedToCounter(2);
  assert.equal(successful.current().updates, 0);
  acknowledge(); assert.equal(await completion, true);
  assert.equal(successful.current().patients[0].counter, 2);
  assert.equal(successful.current().patients[0].counter_top_started_at, null);
  const rejected = selection(async () => { throw new Error('Counter unavailable'); });
  assert.equal(await rejected.hook.moveSelectedToCounter(2), false);
  assert.equal(rejected.current().updates, 0); assert.equal(rejected.current().patients[0].counter, 1);
  assert.equal(rejected.current().error, 'Counter unavailable');
});
