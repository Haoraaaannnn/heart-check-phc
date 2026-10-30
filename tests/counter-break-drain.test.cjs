/** @fileoverview Breaks preserve existing counter patients on monitors while blocking new assignments. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads production code with isolated UI and database dependencies, never a live queue. */
function load(file, mocks = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date, AbortController, console,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const rules = load('app/monitor/lib/registrationVisibility.ts');
const counters = [1, 2, 3, 4, 5].map(counter_number => ({ counter_number, active: counter_number !== 4,
  occupied: counter_number !== 5, on_break: counter_number !== 2, label: null, services: ['Consultation'] }));
const patient = { id: 1, patientNum: 'TEST-1', counter: 1, status: 'On Progress', service: 'Consultation', reg_end: null,
  cubicleNum: null, is_historical: false, created_at: new Date().toISOString(), progress_started_at: new Date().toISOString() };

test('A break counter stays visible only while it has a live unfinished intake ticket', () => {
  assert.deepEqual([...rules.visibleRegistrationCounters({ counters, patients: [patient] })], [1, 2]);
  for (const patients of [[], [{ ...patient, status: 'Done' }], [{ ...patient, status: 'Removed' }],
    [{ ...patient, status: 'Idle' }], [{ ...patient, reg_end: new Date().toISOString() }], [{ ...patient, is_historical: true }],
    [{ ...patient, counter: 2 }], [{ ...patient, cubicleNum: 'Consultation R2 C1' }]]) {
    assert.deepEqual([...rules.visibleRegistrationCounters({ counters, patients })], [2]);
  }
  const counterRules = load('lib/counters.ts', { '@/lib/supabase': { supabase: {} } });
  assert.deepEqual([...counterRules.filterEligibleCounters(counters, 'Consultation').map(counter => counter.counter_number)], [2]);
});

test('The standard registration monitor removes a break counter as soon as its final patient leaves', () => {
  let cursor = 0; const jsx = (type, props) => ({ type, props });
  const api = load('app/monitor/components/RegistrationLayout.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, react: { useState: initial => [cursor++ === 0 ? counters : typeof initial === 'function' ? initial() : initial, () => {}],
      useRef: value => ({ current: value }), useEffect() {}, useMemo: callback => callback() },
    '@/lib/counters': {}, '@/lib/supabase': { supabase: {} }, '@/app/monitor/lib/registrationVisibility': rules,
    '@/utils/formatTicketSpeech': {}, '@/app/monitor/hooks/useMonitorCalls': { useMonitorCalls() {} }, '@/app/monitor/lib/playMonitorSpeech': {},
    '@/app/monitor/constants/monitorStyles': { MONITOR_STYLES: { registrationLayout: {} } },
    '@/app/monitor/constants/monitorTexts': { MONITOR_TEXTS: { registrationLayout: {} } },
  });
  /** Finds the monitor's actual column grid without reproducing its visibility calculation. */
  function columnCount(patients) {
    cursor = 0; const tree = api.RegistrationLayout({ patients });
    return tree.props.children.props.children.props.style.gridTemplateColumns;
  }
  assert.equal(columnCount([patient]), 'repeat(2, minmax(0, 1fr))');
  assert.equal(columnCount([]), 'repeat(1, minmax(0, 1fr))');
});

test('The custom monitor retains break patients but does not count their counter as open', async () => {
  const states = []; let cursor = 0; let patients = [patient];
  const db = { from(table) { const query = { select() { return this; }, in() { return this; }, not() { return this; },
    is() { return this; }, eq() { return this; }, gte() { return this; }, lt() { return this; }, order() { return this; },
    then(resolve) { return Promise.resolve({ data: table === 'patients' ? patients : [{ label_en: 'Consultation', requires_registration: true }], error: null }).then(resolve); } }; return query; } };
  const api = load('app/monitor/hooks/useCustomMonitorData.ts', {
    react: { useState(initial) { const index = cursor++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = value; }]; }, useRef: value => ({ current: value }), useEffect() {}, useCallback: fn => fn, useMemo: fn => fn() },
    '@/lib/supabase': { supabase: db }, '@/utils/formatTicketSpeech': {}, './useMonitorCalls': { useMonitorCalls() {} },
    '../lib/playMonitorSpeech': {}, '../lib/sortCubiclePatients': { sortCubiclePatients: values => values },
    '@/lib/counters': { fetchOccupiedCounters: async () => counters }, '@/app/monitor/lib/registrationVisibility': rules,
  });
  const render = () => { cursor = 0; return api.useCustomMonitorData(['Registration'], false); };
  let hook = render(); await hook.refresh(); hook = render();
  assert.deepEqual([...hook.stations.map(station => station.stationNumber)], [1, 2]);
  assert.equal(hook.serviceQueues[0].openStationCount, 1);
  assert.equal(hook.serviceQueues[0].primaryServing.ticket, patient.patientNum);
  patients = []; await hook.refresh(); hook = render();
  assert.deepEqual([...hook.stations.map(station => station.stationNumber)], [2]);
});

test('Queue refresh keeps patients already assigned to a staffed break counter and sends new tickets elsewhere', async () => {
  const states = []; let cursor = 0; const writes = [];
  const newPatient = { ...patient, id: 2, counter: null };
  const db = { from(table) { let fields; const query = { select() { return this; }, neq() { return this; },
    gte() { return this; }, lt() { return this; }, order() { return this; }, eq() { return this; }, in() { return this; }, is() { return this; },
    update(value) { fields = value; writes.push(value); return this; },
    then(resolve) { return Promise.resolve({ data: fields ? [] : table === 'patients' ? [{ ...patient }, { ...newPatient }] : [{ label_en: 'Consultation' }], error: null }).then(resolve); } }; return query; } };
  const counterRules = load('lib/counters.ts', { '@/lib/supabase': { supabase: {} } });
  const api = load('app/transfer/hooks/usePatientData.ts', {
    react: { useState(initial) { const index = cursor++; states[index] = initial; return [initial, value => { states[index] = value; }]; },
      useRef: value => ({ current: value }), useEffect() {}, useCallback: fn => fn },
    '@/lib/supabase': { supabase: db }, '@/lib/counters': { fetchOccupiedCounters: async () => counters,
      filterEligibleCounters: counterRules.filterEligibleCounters },
  });
  await api.usePatientData().fetchData();
  assert.equal(states[0].find(row => row.id === 1).counter, 1);
  assert.equal(states[0].find(row => row.id === 2).counter, 2);
  assert.ok(writes.every(fields => fields.counter !== 1));
});
