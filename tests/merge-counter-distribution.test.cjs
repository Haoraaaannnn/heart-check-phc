/** @fileoverview Missing merge dependency regression: authorized counter sorting without live queue writes. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads the production implementation with explicit database and authentication doubles. */
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date, Response,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return compiled.exports;
}
const ranges = load('utils/manilaDayRange.ts');

/** Emulates query filtering and acknowledged RPC writes while retaining scope and actor evidence. */
function fixture({ role = 'registration', rejected = false } = {}) {
  const calls = []; const reads = [];
  const now = new Date().toISOString();
  const patients = Array.from({ length: 6 }, (_, index) => ({ id: index + 1, counter: 1, service: 'Consultation',
    counter_top_started_at: index === 0 ? now : null, status: 'On Progress', reg_end: null, cubicleNum: null, is_historical: false, created_at: now }));
  patients.push({ ...patients[1], id: 7, is_historical: true }, { ...patients[1], id: 8, reg_end: now },
    { ...patients[1], id: 9, created_at: new Date(Date.now() - 86400000).toISOString() });
  const tables = { users: [{ id: 1, auth_id: 'verified-actor', role }], patients,
    counters: [1, 2, 3, 4, 5].map(counter_number => ({ counter_number, active: true, on_break: counter_number === 3 })),
    user_counters: [1, 2, 3, 4].map(counter => ({ user_id: counter, counter })),
    user_services: [1, 2, 3, 4].map(user_id => ({ user_id, service: user_id === 4 ? 'ECG' : 'Consultation' })) };
  const db = { from(table) {
    reads.push(table); let records = [...(tables[table] ?? [])];
    return { select() { return this; }, order() { return this; },
      eq(key, value) { records = records.filter(row => row[key] === value); return this; },
      is(key, value) { return this.eq(key, value); },
      not(key, _op, value) { records = records.filter(row => row[key] !== value); return this; },
      in(key, values) { records = records.filter(row => values.includes(row[key])); return this; },
      gte(key, value) { records = records.filter(row => row[key] >= value); return this; },
      lt(key, value) { records = records.filter(row => row[key] < value); return this; },
      maybeSingle: async () => ({ data: records[0] ?? null, error: null }),
      then(resolve, reject) { return Promise.resolve({ data: records, error: null }).then(resolve, reject); },
    };
  }, rpc(name, params) { return {
    setHeader(key, value) { calls.push({ name, params, headers: { [key]: value } }); return this; },
    then(resolve, reject) { return Promise.resolve({ data: !rejected, error: null }).then(resolve, reject); },
  }; } };
  const api = load('lib/supabase/queueDistribution.ts', { '@/lib/supabase/facilityHelpers': { supabaseAdmin: db }, '@/utils/manilaDayRange': ranges });
  return { api, calls, reads };
}

test('Restored sorting balances only live waiting tickets across staffed matching open counters', async () => {
  const harness = fixture();
  const result = await harness.api.equallyDistributeCounterQueues({ actorAuthId: 'verified-actor', targetServices: ['Consultation'] });
  assert.equal(result.ok, true); assert.equal(result.redistributedCount, 3);
  for (const call of harness.calls) {
    assert.equal(call.name, 'move_registration_ticket'); assert.equal(call.params.destination_counter, 2);
    assert.equal(call.params.caller_auth_id, 'verified-actor'); assert.equal(call.headers['x-hc-actor-id'], 'verified-actor');
    assert.ok(call.params.patient_id > 1 && call.params.patient_id < 7);
  }
});

test('Sorting verifies database roles and service assignments before reading the queue', async () => {
  for (const [role, service] of [['doctor', 'Consultation'], ['patient', 'Consultation'], ['registration', 'ECG']]) {
    const harness = fixture({ role });
    const result = await harness.api.equallyDistributeCounterQueues({ actorAuthId: 'verified-actor', targetServices: [service] });
    assert.equal(result.ok, false); assert.equal(result.status, 403); assert.equal(harness.calls.length, 0);
    assert.equal(harness.reads.includes('patients'), false);
  }
});

test('Rejected or concurrent handoffs cannot claim successful redistribution', async () => {
  const harness = fixture({ rejected: true });
  const result = await harness.api.equallyDistributeCounterQueues({ actorAuthId: 'verified-actor' });
  assert.equal(result.ok, false); assert.equal(result.status, 409); assert.equal(harness.calls.length, 1);
});
