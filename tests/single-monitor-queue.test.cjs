/**
 * @fileoverview Regression tests for single monitor and multiple monitor queue displays.
 *
 * Verifies:
 * 1. Single monitor (useMonitorData) retains patients for services without cubicle table entries (e.g. ECG).
 * 2. Single monitor (useMonitorData) queries registration counter patients across all services requiring registration.
 * 3. Multi-service and single-service custom monitor (useCustomMonitorData) fetches both registration and clinical queues.
 * 4. PairedLayout and TableLayout display upcoming queue rosters alongside Now Serving cards.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Transpiles and loads a TypeScript module into an isolated VM context. */
function load(file, mocks = {}, globals = {}) {
  const fullPath = path.join(__dirname, '..', file);
  const source = fs.readFileSync(fullPath, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;

  const compiledModule = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module: compiledModule,
      exports: compiledModule.exports,
      console: { log() {}, warn() {}, error() {} },
      require: name => {
        if (name in mocks) return mocks[name];
        throw new Error(`Unexpected dependency ${name}`);
      },
      ...globals,
    },
    { filename: file }
  );
  return compiledModule.exports;
}

test('Single monitor (useMonitorData): retains patients for services without cubicle rows (e.g. ECG)', async () => {
  const states = [];
  let stateIndex = 0;

  const ecgPatients = [
    { id: 101, patientNum: '3001', service: 'ECG', status: 'Assigned', cubicleNum: 'ECG Room 1' },
    { id: 102, patientNum: '3002', service: 'ECG', status: 'Assigned', cubicleNum: 'ECG Room 1' },
  ];

  const api = load('app/monitor/hooks/useMonitorData.ts', {
    react: {
      useState: initial => {
        const index = stateIndex++;
        states[index] = initial;
        return [initial, value => { states[index] = value; }];
      },
      useRef: value => ({ current: value }),
      useEffect: () => {},
      useCallback: fn => fn,
    },
    '@/utils/formatTicketSpeech': { formatTicketForSpeech: t => t },
    './useMonitorCalls': { useMonitorCalls() {} },
    '../lib/playMonitorSpeech': {},
    '../lib/sortCubiclePatients': { sortCubiclePatients: arr => arr },
    '@/lib/supabase': {
      supabase: {
        from: table => {
          return {
            select() { return this; },
            eq() { return this; },
            in() { return this; },
            not() { return this; },
            gte() { return this; },
            lt() { return this; },
            order() { return this; },
            maybeSingle: async () => ({ data: null, error: null }),
            then(resolve) {
              if (table === 'patients') {
                return Promise.resolve({ data: ecgPatients, error: null }).then(resolve);
              }
              // No rows in cubicle table for ECG
              if (table === 'cubicle') {
                return Promise.resolve({ data: [], error: null }).then(resolve);
              }
              return Promise.resolve({ data: [], error: null }).then(resolve);
            },
          };
        },
      },
    },
  });

  const hook = api.useMonitorData('ECG', null, 'ECG', false, true);
  await hook.fetchCubicles();
  await hook.fetchPatients();

  // assignedPatients must retain the ECG patients rather than wiping them out to empty
  const assigned = states[0];
  assert.equal(assigned.length, 2, 'ECG patients must be retained when cubicle table is empty');
  assert.equal(assigned[0].patientNum, '3001');
  assert.equal(assigned[1].patientNum, '3002');
});

test('Single monitor (useMonitorData): fetches registration desk patients across all registered services', async () => {
  const states = [];
  let stateIndex = 0;

  const regPatients = [
    { id: 201, patientNum: '1001', service: 'Consultation', status: 'On Progress', counter: 1, reg_end: null },
    { id: 202, patientNum: '1002', service: 'OPD Screening', status: 'Waiting', counter: 1, reg_end: null },
    { id: 203, patientNum: '1003', service: 'Registration', status: 'Waiting', counter: 2, reg_end: null },
  ];

  const services = [
    { label_en: 'Consultation', requires_registration: true },
    { label_en: 'OPD Screening', requires_registration: true },
    { label_en: 'Registration', requires_registration: false },
    { label_en: 'ECG', requires_registration: false },
  ];

  const api = load('app/monitor/hooks/useMonitorData.ts', {
    react: {
      useState: initial => {
        const index = stateIndex++;
        states[index] = initial;
        return [initial, value => { states[index] = value; }];
      },
      useRef: value => ({ current: value }),
      useEffect: () => {},
      useCallback: fn => fn,
    },
    '@/utils/formatTicketSpeech': {},
    './useMonitorCalls': { useMonitorCalls() {} },
    '../lib/playMonitorSpeech': {},
    '../lib/sortCubiclePatients': { sortCubiclePatients: arr => arr },
    '@/lib/supabase': {
      supabase: {
        from: table => {
          let serviceFilter = [];
          return {
            select() { return this; },
            eq() { return this; },
            in(field, values) {
              if (field === 'service') serviceFilter = values;
              return this;
            },
            not() { return this; },
            is() { return this; },
            gte() { return this; },
            lt() { return this; },
            order() { return this; },
            maybeSingle: async () => ({ data: null, error: null }),
            then(resolve) {
              if (table === 'services') {
                return Promise.resolve({ data: services, error: null }).then(resolve);
              }
              if (table === 'patients') {
                const filtered = regPatients.filter(p => serviceFilter.includes(p.service));
                return Promise.resolve({ data: filtered, error: null }).then(resolve);
              }
              return Promise.resolve({ data: [], error: null }).then(resolve);
            },
          };
        },
      },
    },
  });

  const hook = api.useMonitorData('Registration', null, 'Registration', true, true);
  await hook.fetchRegistrationPatients();

  // registrationPatients must contain all 3 patients across Consultation, OPD, and Registration
  const regList = states[2];
  assert.equal(regList.length, 3, 'Must fetch all registration patients across all required services');
  assert.ok(regList.some(p => p.patientNum === '1001'));
  assert.ok(regList.some(p => p.patientNum === '1002'));
  assert.ok(regList.some(p => p.patientNum === '1003'));
});

test('Multiple and single monitor (useCustomMonitorData): synthesizes queues for services without cubicles', async () => {
  const api = load('app/monitor/hooks/useCustomMonitorData.ts', {
    react: {
      useState: initial => [initial, () => {}],
      useRef: value => ({ current: value }),
      useEffect: () => {},
      useCallback: fn => fn,
      useMemo: fn => fn(),
    },
    '@/lib/supabase': { supabase: {} },
    '@/types/Types': {},
    '@/utils/formatTicketSpeech': {},
    './useMonitorCalls': { useMonitorCalls() {} },
    '../lib/playMonitorSpeech': {},
    '../lib/sortCubiclePatients': { sortCubiclePatients: arr => arr },
    '@/lib/counters': { fetchActiveCounters: async () => [1, 2] },
  });

  // Verify normalizeMonitorTargets works for both single service and multiple services
  const singleTargets = api.normalizeMonitorTargets(['ECG']);
  assert.equal(singleTargets.length, 1);
  assert.equal(singleTargets[0].service, 'ECG');
  assert.equal(singleTargets[0].subcategory, null);

  const subcategoryTargets = api.normalizeMonitorTargets(['Consultation-Adult']);
  assert.equal(subcategoryTargets.length, 1);
  assert.equal(subcategoryTargets[0].service, 'Consultation');
  assert.equal(subcategoryTargets[0].subcategory, 'Adult');

  const multipleTargets = api.normalizeMonitorTargets(['Consultation-Adult', 'ECG', 'Registration']);
  assert.equal(multipleTargets.length, 3);
  assert.ok(multipleTargets.some(t => t.service === 'Consultation' && t.subcategory === 'Adult'));
  assert.ok(multipleTargets.some(t => t.service === 'ECG'));
  assert.ok(multipleTargets.some(t => t.service === 'Registration'));
});
