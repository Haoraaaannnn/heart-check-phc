/** @fileoverview Idle rotation, rendering, and acknowledged recovery/removal regression contracts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads actual production logic with fake React and network boundaries. */
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date, Error, console,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const policy = load('lib/idleRotationPolicy.ts');
const dayRange = load('utils/manilaDayRange.ts');

test('Configured cumulative rotation limit enters Idle and never auto-cancels or resets by shift', () => {
  for (const maxRotations of [1, 3, 5, 8]) {
    for (let rotationCount = 0; rotationCount < maxRotations; rotationCount++) {
      const result = policy.nextIdleRotation({ rotationCount, maxRotations });
      assert.equal(result.rotationCount, rotationCount + 1);
      assert.equal(result.idle, rotationCount + 1 >= maxRotations);
    }
  }
  const fields = policy.idlePatientFields('2026-10-30T06:00:00Z');
  assert.equal(fields.status, 'Idle'); assert.equal(fields.removed_at, null);
  assert.equal(fields.idle_at, '2026-10-30T06:00:00Z');
  for (const key of ['counter', 'cubicleNum', 'counter_paused_at', 'counter_top_started_at', 'cooldown_until']) assert.equal(fields[key], null);
});

/** Creates a fake durable store and runs the actual idle hook against it. */
function idleHook({ rejected = false, historical = false, status = 'Idle' } = {}) {
  const states = []; const writes = []; const reads = []; let stateIndex = 0;
  const patient = { id: 1, patientNum: 'TEST-1', service: 'ECG', status, is_historical: historical,
    rotation_count: 5, created_at: new Date().toISOString(), counter_paused_at: '2026-10-30T00:00:00Z' };
  const supabase = { from: () => {
    const filters = []; let fields; let columns = '*';
    const query = {
      select(value) { columns = value; return this; }, update(value) { fields = value; return this; },
      eq(...value) { filters.push(value); return this; }, gte(...value) { reads.push(['gte', ...value]); return this; },
      lt(...value) { reads.push(['lt', ...value]); return this; }, not() { return this; }, order() { return this; }, limit() { return this; },
      async maybeSingle() {
        if (!fields) return { data: { queue_position: 7 }, error: null };
        writes.push({ fields, filters });
        if (rejected) return { data: null, error: { code: '42501' } };
        if (!filters.every(([key, value]) => patient[key] === value)) return { data: null, error: null };
        Object.assign(patient, fields); return { data: { id: patient.id }, error: null };
      },
      then(resolve, reject) {
        const rows = filters.every(([key, value]) => patient[key] === value) ? [{ ...patient }] : [];
        return Promise.resolve({ data: columns === '*' ? rows : [], error: null }).then(resolve, reject);
      },
    };
    return query;
  } };
  const api = load('app/transfer/hooks/useIdlePatients.ts', {
    react: { useState: initial => { const index = stateIndex++; states[index] = initial;
      return [initial, value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
      useRef: value => ({ current: value }), useCallback: callback => callback },
    '@/lib/supabase': { supabase }, '@/utils/manilaDayRange': dayRange,
  });
  return { hook: api.useIdlePatients(), states, patient, writes, reads };
}

test('Reactivation appends the ticket to the queue and clears rotation, intake and paused timer state', async () => {
  const fixture = idleHook(); await fixture.hook.fetchIdlePatients(true);
  assert.equal(fixture.states[0].length, 1);
  const result = await fixture.hook.activatePatient(fixture.patient);
  assert.equal(result.ok, true); assert.equal(fixture.patient.status, 'Waiting');
  assert.equal(fixture.patient.queue_position, 8); assert.equal(fixture.patient.rotation_count, 0);
  assert.equal(fixture.patient.reg_end, null); assert.equal(fixture.patient.counter_paused_at, null);
  assert.equal(fixture.patient.idle_at, null); assert.equal(fixture.states[0].length, 0);
  assert.ok(fixture.writes[0].filters.some(([key, value]) => key === 'is_historical' && value === false));
  assert.ok(fixture.writes[0].filters.some(([key, value]) => key === 'status' && value === 'Idle'));
});

test('Removal is acknowledged soft removal, keeping the reporting record', async () => {
  const fixture = idleHook(); await fixture.hook.fetchIdlePatients(true);
  const result = await fixture.hook.removePatient(fixture.patient);
  assert.equal(result.ok, true); assert.equal(fixture.patient.id, 1);
  assert.equal(fixture.patient.status, 'Removed'); assert.equal(typeof fixture.patient.removed_at, 'string');
  assert.equal(fixture.states[0].length, 0);
});

test('Rejected writes keep idle tickets visible with feedback; historical and stale records cannot be changed', async () => {
  for (const activate of [true, false]) {
    const fixture = idleHook({ rejected: true }); await fixture.hook.fetchIdlePatients(true);
    const result = await (activate ? fixture.hook.activatePatient(fixture.patient) : fixture.hook.removePatient(fixture.patient));
    assert.equal(result.ok, false); assert.equal(fixture.states[0].length, 1);
    assert.equal(fixture.patient.status, 'Idle'); assert.match(fixture.states[1], /not updated/);
  }
  for (const options of [{ historical: true }, { status: 'Done' }]) {
    const fixture = idleHook(options);
    assert.equal((await fixture.hook.activatePatient(fixture.patient)).ok, false);
    assert.equal((await fixture.hook.removePatient(fixture.patient)).ok, false);
    assert.equal(fixture.patient.status, options.status ?? 'Idle');
  }
});

/** Finds an element in the actual rendered component's JSX tree. */
function findElement(node, type) {
  if (Array.isArray(node)) return node.flatMap(child => findElement(child, type));
  if (!node || typeof node !== 'object') return [];
  return [...(node.type === type ? [node] : []), ...findElement(node.props?.children, type)];
}

test('Idle tab renders its count and passes reactivation/removal actions to the idle panel', () => {
  const idlePanel = () => null; const badge = () => null; const calls = [];
  const jsx = (type, props) => ({ type, props });
  const api = load('app/transfer/components/QueuePanel.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, react: { useState: () => ['idle', () => {}] },
    '@/app/transfer/components/OnProgressSection': { OnProgressSection: () => null },
    '@/app/transfer/components/IdleNumbersPanel': { IdleNumbersPanel: idlePanel },
    '@/components/reusables/NotificationBadge': { NotificationBadge: badge },
    '@/constants/texts/transferTexts': { transferTexts: { idleTabTitle: 'Idle Numbers' } },
    '@/constants/designs/transferStyles': { queuePanelStyles: {} },
  });
  const patient = { id: 1, patientNum: 'TEST-1' };
  const view = api.QueuePanel({ onProgressPatients: [], idlePatients: [patient],
    onActivateIdle: value => calls.push(['activate', value.id]), onRemoveIdle: value => calls.push(['remove', value.id]) });
  const panel = findElement(view, idlePanel)[0]; assert.equal(panel.props.patients.length, 1);
  assert.ok(findElement(view, badge).some(element => element.props.count === 1));
  panel.props.onActivate(patient); panel.props.onRemove(patient);
  assert.deepEqual(calls, [['activate', 1], ['remove', 1]]);
});
