/** @fileoverview Assignment and counter-return regression tests using isolated SDK doubles. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

/** Loads the actual source without database access or patient data. */
function load(file, mocks, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, console,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiledModule.exports;
}

/** Creates an acknowledged, rejected, or unmatched live update response. */
function mutations({ error = null, data, online = true } = {}) {
  const writes = []; const queued = [];
  const api = load('app/transfer/lib/transferMutations.ts', {
    './constants': { MAX_PATIENTS_PER_CUBICLE: 5 },
    '@/lib/offlineQueue': { enqueueMutation: async item => { queued.push(item); return { id: 'queued' }; } },
    '@/lib/supabase': { supabase: { from: table => {
      const write = { table, filters: [] }; writes.push(write);
      return { update(fields) { write.fields = fields; return this; },
        eq(...filter) { write.filters.push(filter); return this; }, in() { return this; }, select() { return this; },
        maybeSingle: async () => ({ data: data === undefined ? { id: 1, ...write.fields } : data, error }) };
    } } },
  }, { navigator: { onLine: online } });
  return { api, writes, queued };
}

const patient = { id: 1, patientNum: 'TEST-1', service: 'Consultation', subcategory: 'Pedia', counter: 2,
  reg_start: '2026-10-26T00:00:00Z', reg_end: '2026-10-26T00:01:00Z', cubicleNum: 'Pedia-1' };
const cubicles = [
  { cubicleNum: 'Adult-1', category: 'Consultation', subcategory: 'Adult', room: 5 },
  { cubicleNum: 'Pedia-1', category: 'Consultation', subcategory: 'Pedia', room: 2 },
  { cubicleNum: 'Pedia-2', category: 'Consultation', subcategory: 'Pedia', room: 3 },
];

test('Assign stays inside the visible room, patient group, preferences, and capacity', () => {
  const { api } = mutations();
  const candidates = (ticket, stations, assigned = {}) => api.assignmentCandidates({ patient: ticket, cubicles: stations, assigned }).map(c => c.cubicleNum);
  assert.deepEqual([...candidates(patient, cubicles)], ['Pedia-1', 'Pedia-2']);
  assert.deepEqual([...candidates(patient, cubicles.filter(c => c.room === 2))], ['Pedia-1']);
  assert.equal(candidates(patient, cubicles, { 'Pedia-1': Array(5).fill({}), 'Pedia-2': Array(5).fill({}) }).length, 0);
  assert.deepEqual([...candidates({ ...patient, preferredCubicleNums: ['Pedia-2'] }, cubicles)], ['Pedia-2']);
  assert.equal(candidates({ ...patient, preferredCubicleNums: ['Unavailable'] }, cubicles).length, 0);
});

test('Back restores the original counter intake fields and clears stale consultation/counter timers', () => {
  const { api } = mutations();
  const fields = api.returnToQueueFields(patient, 100000);
  assert.equal(fields.reg_end, null);
  assert.equal(fields.cubicleNum, null);
  assert.equal(fields.status, 'On Progress');
  assert.equal(fields.counter_top_started_at, null);
  assert.equal(fields.counter_paused_at, null);
  assert.equal(fields.called_at, null);
  assert.equal(fields.counter_rejoin_at, new Date(100000).toISOString());
  assert.equal(fields.cooldown_until, new Date(160000).toISOString());
  assert.equal({ ...patient, ...fields }.counter, 2);
  const direct = api.returnToQueueFields({ id: 2, service: 'ECG' }, 100000);
  assert.equal('reg_end' in direct, false);
});

test('Assignments require an acknowledged live row and never upsert a new or historical patient', async () => {
  const { api, writes } = mutations();
  await api.saveTransferAssignments([{ id: 1, cubicleNum: 'Pedia-1', status: 'Assigned' }]);
  assert.deepEqual(writes[0].filters, [['id', 1], ['is_historical', false]]);
  for (const response of [{ error: { message: 'Station on break' } }, { data: null }, { data: { id: 1, status: 'Waiting' } }]) {
    await assert.rejects(mutations(response).api.saveTransferAssignments([{ id: 1, status: 'Assigned' }]));
  }
});

test('Offline assignment uses durable individual updates with a live-patient filter during replay', async () => {
  const { api, queued, writes } = mutations({ online: false });
  assert.equal(await api.saveTransferAssignments([{ id: 1, status: 'Assigned' }]), false);
  assert.equal(writes.length, 0);
  assert.equal(queued[0].type, 'update');
  assert.equal(queued[0].matchValue, 1);
});

test('Back keeps the patient in the cubicle on rejection and only removes it after acknowledgement', async () => {
  for (const rejected of [false, true]) {
    let assigned = { 'Pedia-1': [patient] }; let queue = []; let pending;
    const pendingRef = { current: [] }; let fetches = 0;
    const fields = mutations().api.returnToQueueFields(patient, 100000);
    const api = load('app/transfer/hooks/useDragAndDrop.ts', {
      react: { useState: () => [null, value => { pending = value; }], useRef: value => ({ current: value }), useEffect() {}, useCallback: fn => fn },
      '@/app/transfer/lib/constants': { MAX_PATIENTS_PER_CUBICLE: 5 },
      '@/app/transfer/lib/transferMutations': { returnToQueueFields: () => fields, updateLiveTransferPatient: async options => {
        assert.equal(options.sourceCubicle, 'Pedia-1');
        if (rejected) throw Error('Rejected');
      } },
      '@/app/transfer/hooks/dragUtils': {}, '@/app/transfer/hooks/useTransferSelection': {},
    });
    const hook = api.useDragAndDrop(assigned, value => { queue = value(queue); }, value => { assigned = value(assigned); }, async () => { fetches++; }, pendingRef);
    if (rejected) {
      await assert.rejects(hook.handleMoveBackToProgress(patient, 'Pedia-1'));
      assert.equal(assigned['Pedia-1'].length, 1);
      assert.equal(queue.length, 0);
      assert.equal(pending, undefined);
    } else {
      await hook.handleMoveBackToProgress(patient, 'Pedia-1');
      assert.equal(assigned['Pedia-1'].length, 0);
      assert.equal(queue[0].reg_end, null);
      assert.equal(queue[0].counter, 2);
      assert.equal(pending.length, 0);
      assert.equal(fetches, 1);
    }
  }
});

test('Fast repeated Assign actions reserve capacity before React renders and do not duplicate tickets', () => {
  let queue = [patient, { ...patient, id: 2 }];
  let assigned = { target: Array.from({ length: 4 }, (_, id) => ({ id: id + 10 })) };
  const pendingRef = { current: [] };
  const api = load('app/transfer/hooks/useTransferSelection.ts', {
    react: { useState: () => [null, () => {}], useEffect() {}, useCallback: fn => fn },
    '@/lib/supabase': {}, '@/app/transfer/lib/constants': { MAX_PATIENTS_PER_CUBICLE: 5 },
    '@/lib/counters': { fetchOccupiedCounters: async () => [], filterEligibleCounters: () => [] },
  });
  const hook = api.useTransferSelection({ assignedPatients: assigned, pendingUpdatesRef: pendingRef,
    setOnProgressPatients: value => { queue = value(queue); },
    setAssignedPatients: value => { assigned = value(assigned); }, setPendingUpdates() {}, setRegistrationPatients() {} });
  assert.equal(hook.assignPatientToCubicle(patient, 'target'), true);
  assert.equal(hook.assignPatientToCubicle(patient, 'target'), false);
  assert.equal(hook.assignPatientToCubicle({ ...patient, id: 2 }, 'target'), false);
  assert.equal(assigned.target.length, 5);
  assert.equal(queue.length, 1);
});

test('Automatic assignment honors patient groups, does not schedule preferred patients twice, and rolls back rejected destinations', async () => {
  for (const rejected of [false, true]) {
    const ticket = { ...patient, preferredCubicleNums: ['Pedia-1'] };
    let queue = [ticket]; let assigned = {}; const writes = []; const effects = [];
    const api = load('app/transfer/hooks/useAutoAssign.ts', {
      react: { useRef: value => ({ current: value }), useEffect: fn => effects.push(fn), useCallback: fn => fn },
      '@/app/transfer/lib/constants': { MAX_PATIENTS_PER_CUBICLE: 5, AUTO_ASSIGN_SERVICES: ['Consultation'] },
      '@/app/transfer/lib/transferMutations': {
        assignmentCandidates: mutations().api.assignmentCandidates,
        updateLiveTransferPatient: async update => { writes.push(update); if (rejected) throw Error('Unavailable'); },
      },
    });
    api.useAutoAssign('Consultation', queue, assigned, cubicles, () => {},
      update => { queue = update(queue); }, update => { assigned = update(assigned); }, { current: false },
      [{ label_en: 'Consultation', auto_assign: true, requires_registration: false, has_subcategories: false }]);
    effects[0]();
    for (let index = 0; index < 15; index++) await Promise.resolve();
    assert.equal(writes.length, 1);
    assert.equal(writes[0].fields.cubicleNum, 'Pedia-1');
    assert.equal(queue.length, rejected ? 1 : 0);
    assert.equal(Object.values(assigned).flat().length, rejected ? 0 : 1);
  }
});
