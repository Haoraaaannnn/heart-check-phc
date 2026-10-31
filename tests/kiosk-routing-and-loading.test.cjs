/** @fileoverview Configurable kiosk doctor choices and navigation completion without live patient writes. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads actual application source with isolated UI and database dependencies. */
function load(file, mocks = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, URL, URLSearchParams, AbortController, AbortSignal,
    console: { log() {}, error() {} }, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const rules = load('app/kiosk/lib/doctorSelection.ts');
const jsx = (type, props) => ({ type, props });
/** Walks source-rendered JSX without substituting its actual labels or event callbacks. */
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [node];
  return [node, ...nodes(node.props?.children)];
}
const station = { cubicleNum: 'Consultation R2 C5', category: 'Consultation', subcategory: 'Adult', doctorId: '10', doctorName: 'Maria Santos' };
const selector = { id: 1, cubicle_name: 'Cubicle R2 C5', cubicle_order: 1, cubicles: [{ cubicle: station }] };

test('Every service follows Superadmin picker settings, including OPD Screening and custom service names', () => {
  for (const label_en of ['OPD Screening', 'OPD Screenings', ' opd   screening ', 'Consultation', 'Renamed Specialty Clinic']) {
    assert.equal(rules.requiresDoctorSelection({ label_en, requires_cubicle: true }), true);
    assert.equal(rules.requiresDoctorSelection({ label_en, requires_cubicle: false }), false);
    assert.equal(rules.requiresDoctorSelection({ label_en, requires_cubicle: null }), false);
  }
  assert.equal(rules.requiresDoctorSelection({ label_en: 'Consultation', requires_cubicle: true }), true);
  assert.equal(rules.parseDoctorSelectionService({ label_en: 'Consultation', requires_cubicle: 'true' }), null);
});

test('Physician cards show only the doctor name and preserve internal station routing on selection', () => {
  const destinations = [];
  const api = load('app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCard.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, '@/app/kiosk/lib/doctorSelection': rules,
    '@/app/kiosk/hooks/useKioskNavigate': { useKioskNavigate: () => href => destinations.push(href) },
    '@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard': { CubicleCardStyle: {}, CubicleCardClasses: {}, CubicleCardIcons: {} },
  });
  const tree = api.default({ cubicle: selector, serviceId: '2', patientType: 'old', subcategory: 'Adult' });
  const labels = nodes(tree).filter(value => typeof value === 'string').join(' ');
  assert.equal(labels, 'Dr. Maria Santos'); assert.doesNotMatch(labels, /Cubicle|R2|C5/);
  tree.props.onClick();
  const url = new URL(destinations[0], 'https://kiosk.invalid');
  assert.equal(url.searchParams.get('preferredCubicleNums'), station.cubicleNum);
  assert.equal(url.searchParams.get('subcategory'), 'Adult');
  assert.equal(api.default({ cubicle: selector, subcategory: 'Pedia' }), null);
  const customStation = { ...station, category: 'Renamed Specialty Clinic', cubicleNum: 'Specialty R1 C1' };
  const custom = api.default({ cubicle: { ...selector, cubicles: [{ cubicle: customStation }] }, serviceId: '3', subcategory: 'Adult' });
  assert.equal(nodes(custom).filter(value => typeof value === 'string').join(' '), 'Dr. Maria Santos');
  custom.props.onClick();
  assert.equal(new URL(destinations.at(-1), 'https://kiosk.invalid').searchParams.get('preferredCubicleNums'), customStation.cubicleNum);
});

test('OPD confirmation uses the saved picker flag when it has no age-category step', () => {
  const destinations = [];
  const api = load('app/kiosk/pages/confirmation/components/ConfirmationActions.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, '@/app/kiosk/lib/doctorSelection': rules,
    '@/app/kiosk/hooks/useKioskNavigate': { useKioskNavigate: () => href => destinations.push(href) },
    '@/lib/logger': { getTimestamp: () => '' },
    '@/app/kiosk/pages/confirmation/constants/confirmationActionsTexts': { ConfirmationActionsTexts: {} },
    '@/app/kiosk/pages/confirmation/constants/confirmationActions': { ConfirmationActionsStyle: {}, ConfirmationActionsClasses: {} },
  });
  for (const enabled of [false, true]) {
    const tree = api.default({ service: { id: 1, label_en: 'OPD Screening', requires_cubicle: enabled, has_subcategories: false } });
    nodes(tree).find(node => node?.type === 'button').props.onClick();
    assert.match(destinations.at(-1), enabled ? /^\/kiosk\/pages\/kiosk-cubicle-selection/ : /^\/kiosk\/pages\/sms-input/);
  }
});

test('Server guard respects the saved OPD picker flag and retains triage options when bypassing it', async () => {
  let rosterReads = 0;
  let enabled = false;
  const query = { select() { return this; }, eq() { return this; }, abortSignal() { return this; },
    maybeSingle() { return Promise.resolve({ data: { label_en: 'OPD Screening', requires_cubicle: enabled }, error: null }); } };
  const api = load('app/kiosk/pages/kiosk-cubicle-selection/page.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, '@/lib/supabase/server': { createClient: async () => ({ from: () => query }) },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: {} }, 'next/navigation': { redirect: href => { throw new Error(`redirect:${href}`); } },
    './components/CubicleCardsGrid': {}, './components/CubicleHeader': {}, './constants/cubicleLayout': { CubicleLayoutClasses: {}, CubicleLayoutStyle: {} },
    '@/app/kiosk/lib/doctorSelection': rules, '@/app/kiosk/lib/loadDoctorOptions': { loadDoctorOptions: () => { rosterReads++; return []; } },
  });
  await assert.rejects(api.default({ searchParams: Promise.resolve({ serviceId: '1', type: 'new', subcategory: 'Adult' }) }),
    /redirect:\/kiosk\/pages\/sms-input\?serviceId=1&type=new&subcategory=Adult/);
  assert.equal(rosterReads, 0);
  enabled = true;
  await api.default({ searchParams: Promise.resolve({ serviceId: '1', type: 'new', subcategory: 'Adult' }) });
  assert.equal(rosterReads, 1);
});

test('Doctor options read station lists concurrently and resolve names in one server-only query', async () => {
  const started = []; const waiting = []; const directoryReads = [];
  const source = { from(table) {
    return { select() { return this; }, order() { return this; }, eq() { return this; },
      abortSignal(signal) { started.push(table); assert.equal(signal.aborted, false); return new Promise(resolve => waiting.push({ table, resolve })); } };
  } };
  const directory = { from(table) { assert.equal(table, 'doctors'); return {
    select(fields) { assert.equal(fields, 'id,full_name'); return this; }, in(key, ids) { directoryReads.push(ids); return this; },
    eq(key, value) { assert.equal(key, 'active'); assert.equal(value, true); return this; },
    abortSignal: async () => ({ data: [{ id: 10, full_name: 'Maria Santos', auth_id: 'must-not-leak' }], error: null }),
  }; } };
  const api = load('app/kiosk/lib/loadDoctorOptions.ts');
  const pending = api.loadDoctorOptions({ db: source, directory, service: 'Consultation', subcategory: 'Adult', signal: new AbortController().signal });
  assert.deepEqual(started, ['cubicle_selector', 'cubicle']);
  waiting.find(item => item.table === 'cubicle_selector').resolve({ data: [selector], error: null });
  waiting.find(item => item.table === 'cubicle').resolve({ data: [station], error: null });
  const result = await pending;
  assert.equal(directoryReads.length, 1); assert.equal(result[0].doctorName, 'Maria Santos');
  assert.doesNotMatch(JSON.stringify(result), /must-not-leak|auth_id/);
  const failed = { from: () => ({ select() { return this; }, order() { return this; }, eq() { return this; },
    abortSignal: async () => ({ data: null, error: { message: 'private diagnostic' } }) }) };
  await assert.rejects(api.loadDoctorOptions({ db: failed, directory, service: 'Consultation', signal: new AbortController().signal }),
    error => /Unable to load/.test(error.message) && !error.message.includes('private diagnostic'));
});

test('Navigation completion includes query changes and same-route taps do not start a stuck overlay', () => {
  let search = 'type=new'; let hides = 0; let shows = 0; const ref = {}; let listener;
  const indicator = load('app/kiosk/components/KioskRouteChangeIndicator.tsx', {
    react: { useRef(initial) { if (!('current' in ref)) ref.current = initial; return ref; }, useEffect: callback => callback() },
    'next/navigation': { usePathname: () => '/kiosk/pages/kiosk-services', useSearchParams: () => new URLSearchParams(search) },
    '@/app/kiosk/context/KioskLoadingContext': { useKioskLoading: () => ({ showLoading: () => shows++, hideLoading: () => hides++ }) },
  }, { document: { addEventListener: (_name, handler) => { listener = handler; }, removeEventListener() {} } });
  indicator.default(); assert.equal(hides, 0);
  search = 'type=old'; indicator.default(); assert.equal(hides, 1); assert.equal(typeof listener, 'function');
  const pushes = [];
  const navigation = load('app/kiosk/hooks/useKioskNavigate.ts', {
    'next/navigation': { useRouter: () => ({ push: href => pushes.push(href) }) }, 'react-dom': { flushSync: callback => callback() },
    '@/app/kiosk/context/KioskLoadingContext': { useKioskLoading: () => ({ showLoading: () => shows++ }) },
    '@/app/kiosk/components/KioskRouteChangeIndicator': indicator,
  }, { window: { location: new URL('https://kiosk.invalid/kiosk/pages/kiosk-services?type=new') } });
  const navigate = navigation.useKioskNavigate(); navigate('/kiosk/pages/kiosk-services?type=new');
  assert.equal(shows, 0); assert.equal(pushes.length, 0);
  navigate('/kiosk/pages/kiosk-services?type=old'); assert.equal(shows, 1); assert.equal(pushes.length, 1);
});

/** Runs the actual service capability hook with delayed, cancellable metadata responses. */
function flagsLoader() {
  const slots = []; const requests = []; let index = 0; let previous; let pendingEffect; let cleanup;
  const api = load('app/kiosk/hooks/useKioskServiceFlags.ts', {
    react: {
      useState(initial) {
        const slot = index++; if (!(slot in slots)) slots[slot] = initial;
        return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
      },
      useEffect(callback, deps) {
        if (!previous || deps.some((value, position) => value !== previous[position])) {
          cleanup?.(); pendingEffect = callback; previous = deps;
        }
      },
    },
    '@/app/kiosk/lib/doctorSelection': rules,
    '@/lib/supabase/client': { createClient: () => ({ from: () => {
      const request = {};
      return { select(fields) { assert.equal(fields, 'label_en,requires_cubicle'); return this; },
        eq(_key, id) { request.id = id; return this; }, abortSignal(signal) { request.signal = signal; return this; },
        maybeSingle() { return new Promise(resolve => { request.resolve = resolve; requests.push(request); }); } };
    } }) },
  });
  return { requests, render(id) {
    index = 0; const state = api.useKioskServiceFlags(id);
    if (pendingEffect) { const effect = pendingEffect; pendingEffect = null; cleanup = effect(); }
    return state;
  } };
}

test('Fast category taps cannot use stale routing metadata and old requests cannot overwrite a new service', async () => {
  const harness = flagsLoader();
  let state = harness.render('1'); assert.equal(state.loading, true); assert.equal(state.service, null);
  state = harness.render('2'); assert.equal(state.service, null); assert.equal(harness.requests[0].signal.aborted, true);
  harness.requests[1].resolve({ data: { label_en: 'OPD Screening', requires_cubicle: true }, error: null });
  await new Promise(resolve => setImmediate(resolve));
  harness.requests[0].resolve({ data: { label_en: 'Consultation', requires_cubicle: true }, error: null });
  await new Promise(resolve => setImmediate(resolve));
  state = harness.render('2'); assert.equal(state.loading, false); assert.equal(state.service.label_en, 'OPD Screening');
  assert.equal(rules.requiresDoctorSelection(state.service), true);
});

test('Failed service metadata reads have a working retry and never silently guess a destination', async () => {
  const harness = flagsLoader(); harness.render('1');
  harness.requests[0].resolve({ data: null, error: { message: 'private diagnostic' } });
  await new Promise(resolve => setImmediate(resolve));
  let state = harness.render('1'); assert.equal(state.service, null); assert.match(state.error, /try again/);
  assert.doesNotMatch(state.error, /private diagnostic/);
  state.retry(); state = harness.render('1'); assert.equal(state.loading, true); assert.equal(state.error, null);
  harness.requests[1].resolve({ data: { label_en: 'Consultation', requires_cubicle: true }, error: null });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(harness.render('1').service.label_en, 'Consultation');
});

test('A kiosk page read failure releases the overlay and offers a safe page retry', () => {
  let hides = 0; let retries = 0;
  const api = load('app/kiosk/error.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, react: { useEffect: callback => callback() },
    '@/app/kiosk/context/KioskLoadingContext': { useKioskLoading: () => ({ hideLoading: () => hides++ }) },
  });
  const tree = api.default({ error: new Error('private diagnostic'), reset: () => retries++ });
  assert.equal(hides, 1);
  const rendered = nodes(tree); assert.doesNotMatch(rendered.filter(node => typeof node === 'string').join(' '), /private diagnostic/);
  rendered.find(node => node?.type === 'button').props.onClick(); assert.equal(retries, 1);
});
