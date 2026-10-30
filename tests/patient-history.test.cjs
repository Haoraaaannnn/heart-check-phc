/** @fileoverview Isolated timeline privacy, authorization, pagination and identity contracts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads production TypeScript with explicit dependency doubles and no real database connection. */
function load(file, mocks = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(output, { module: compiled, exports: compiled.exports, URL, Response, AbortController, URLSearchParams,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const contracts = load('lib/patientHistory.ts');
const scope = load('app/api/patient-history/scope.ts', { '@/lib/patientHistory': contracts });

/** Returns an operational event deliberately containing extra fields to test the output allowlist. */
function event(id = 1) {
  return { id, patient_id: 1, ticket: '5001', occurred_at: '2026-10-31T03:00:00Z', actor_username: 'justin',
    actor_role: 'doctor', actor_kind: 'staff', event_type: 'movement', actor_auth_id: 'private-auth',
    from_state: { status: 'Assigned', cubicleNum: 'Consultation R2 C5', phoneNum: 'private-phone', full_name: 'private-name' },
    to_state: { status: 'With Doctor', cubicleNum: 'Consultation R2 C5' } };
}

/** Runs the real route and real scope logic against filtered, ordered in-memory records. */
function route({ role = 'doctor', authenticated = true, owned = true, doctorLinked = false, historical = false,
  events = [event()], dbError = null, assignmentError = false, cubicle = 'Consultation R2 C5', services = [] } = {}) {
  const reads = [];
  const tables = { users: [{ id: 7, auth_id: 'verified-auth', role }],
    patients: [{ id: 1, service: 'Consultation', cubicleNum: cubicle, counter: 2, is_historical: historical }],
    user_cubicles: owned ? [{ user_id: 7, cubicle_id: 20 }] : [],
    doctors: doctorLinked ? [{ id: 10, auth_id: 'verified-auth' }] : [],
    cubicle: [{ id: 20, cubicleNum: 'Consultation R2 C5', doctorId: 10 }],
    user_services: services.map(service => ({ user_id: 7, service })), user_counters: [], patient_movement_history: events };
  const db = { from(table) {
    reads.push(table); let rows = [...(tables[table] ?? [])]; let rowLimit = Infinity;
    const error = table === 'patient_movement_history' ? dbError : assignmentError && table === 'user_cubicles' ? { message: 'private' } : null;
    return { select() { return this; },
      eq(key, value) { rows = rows.filter(row => String(row[key]) === String(value)); return this; },
      lt(key, value) { rows = rows.filter(row => BigInt(row[key]) < BigInt(value)); return this; },
      order(key, options) { rows.sort((first, second) => (first[key] > second[key] ? 1 : -1) * (options.ascending ? 1 : -1)); return this; },
      limit(count) { rowLimit = count; return this; },
      async maybeSingle() { return { data: rows[0] ?? null, error }; },
      then(resolve, reject) { return Promise.resolve({ data: rows.slice(0, rowLimit), error }).then(resolve, reject); },
    };
  } };
  const api = load('app/api/patient-history/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': { requireUser: async () => authenticated ? { authorized: true, user: { id: 'verified-auth' } }
      : { authorized: false, response: Response.json({}, { status: 401 }) } },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: db }, '@/lib/patientHistory': contracts, './scope': scope,
  });
  return { reads, get: (params = 'patientId=1') => api.GET({ url: `http://localhost/api/patient-history?${params}` }) };
}

test('Owned ticket timeline exposes usernames, timestamps, source and destination without patient PII or authentication IDs', async () => {
  const response = await route().get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const body = await response.json(); const step = body.events[0];
  assert.equal(step.actor_username, 'justin'); assert.equal(step.from_state.status, 'Assigned');
  assert.equal(step.to_state.status, 'With Doctor'); assert.equal(step.occurred_at, '2026-10-31T03:00:00Z');
  assert.equal(contracts.historyLocation(step.to_state), 'Consultation R2 C5');
  assert.doesNotMatch(JSON.stringify(body), /private-|actor_auth_id|phoneNum|full_name/);
});

test('History cannot be used to browse another doctor’s patients, including through shared-service permissions', async () => {
  for (const options of [{ authenticated: false }, { role: 'patient' }, { owned: false, services: ['Consultation'] },
    { owned: false, historical: true }, { owned: false, assignmentError: true }]) {
    const harness = route(options); const response = await harness.get();
    assert.equal(response.status, options.authenticated === false ? 401 : options.assignmentError ? 503 : 403);
    assert.equal(harness.reads.includes('patient_movement_history'), false);
  }
  assert.equal((await route({ owned: false, doctorLinked: true }).get()).status, 200);
  assert.equal((await route({ role: 'superadmin', owned: false, historical: true }).get()).status, 200);
});

test('History pages remain ordered and exclusive without losing older steps', async () => {
  const harness = route({ events: Array.from({ length: 103 }, (_, index) => event(index + 1)) });
  const first = await (await harness.get()).json();
  assert.equal(first.events.length, 50); assert.equal(first.events[0].id, '103'); assert.equal(first.nextCursor, '54');
  const second = await (await harness.get(`patientId=1&before=${first.nextCursor}`)).json();
  assert.equal(second.events.length, 50); assert.equal(second.nextCursor, '4');
  const last = await (await harness.get(`patientId=1&before=${second.nextCursor}`)).json();
  const ids = [...first.events, ...second.events, ...last.events].map(step => step.id);
  assert.equal(new Set(ids).size, 103); assert.equal(last.events.length, 3); assert.equal(last.nextCursor, null);
});

test('Missing history setup, broken contracts and invalid IDs produce explicit failures', async () => {
  for (const params of ['patientId=0', 'patientId=1&before=no', 'patientId=1,2', 'patientId=9223372036854775808']) {
    const harness = route(); assert.equal((await harness.get(params)).status, 400); assert.equal(harness.reads.length, 0);
  }
  const response = await route({ dbError: { code: '42P01', message: 'private diagnostic' } }).get();
  assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /private diagnostic/);
  assert.equal((await route({ events: [{ ...event(), occurred_at: 'bad-date' }] }).get()).status, 503);
});

test('Legacy, system and automatic events never invent a staff username', () => {
  assert.equal(contracts.historyActor({ ...event(), actor_kind: 'baseline' }), 'Recording started');
  assert.match(contracts.historyActor({ ...event(), actor_kind: 'automation' }), /Automatic queue action.*justin/);
  assert.equal(contracts.historyActor({ ...event(), actor_username: null, actor_kind: 'kiosk' }), 'Kiosk check-in');
  assert.equal(contracts.historyActor({ ...event(), actor_username: null, actor_kind: 'unattributed' }), 'Operator not recorded');
  assert.equal(contracts.historyId(Number.MAX_SAFE_INTEGER + 1), null);
  assert.equal(contracts.historyLocation({ counter: 2, reg_end: '2026-10-31T00:00:00Z' }), 'Transfer queue');
  const step = event();
  step.from_state.consult_start = '2026-10-31T03:00:00Z'; step.to_state.consult_start = null;
  const timing = contracts.historyTimingChanges(step);
  assert.equal(timing.length, 1); assert.equal(timing[0].label, 'Consultation started'); assert.equal(timing[0].to, null);
  assert.equal(contracts.parseHistoryEvents([{ ...event(), to_state: { consult_start: 'broken-time' } }]), null);
});

test('Database history contract stays append-only, private and transactionally attached to every patient mutation', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../docs/migrations/patient_movement_history.sql'), 'utf8');
  assert.match(sql, /AFTER INSERT OR UPDATE OR DELETE ON public\.patients/);
  assert.match(sql, /AFTER INSERT ON public\.monitor_calls/);
  assert.match(sql, /BEFORE UPDATE OR DELETE OR TRUNCATE/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON public\.patient_movement_history FROM PUBLIC, anon, authenticated, service_role/);
  assert.match(sql, /IF claims->>'role' = 'service_role' THEN[\s\S]*?headers->>'x-hc-actor-id'[\s\S]*?ELSE\s+actor_id := auth\.uid\(\)/);
  const allowlist = sql.match(/WHERE key = ANY\(ARRAY\[([\s\S]*?)\]\)/)[1];
  assert.doesNotMatch(allowlist, /phone|name|email|token/i);
  assert.match(sql, /record_data->'is_historical' IS DISTINCT FROM 'false'::jsonb/);
  assert.match(sql, /before_state IS NOT DISTINCT FROM after_state/);
});

/** Provides a small React hook runner to exercise real loading, failures and cleanup. */
function timelineLoader() {
  const slots = []; let index = 0; let pendingEffect; let cleanup; let previousRequest;
  const requests = [];
  const api = load('components/patients/usePatientHistory.ts', {
    react: {
      useState(initial) {
        const slot = index++;
        if (!(slot in slots)) slots[slot] = initial;
        return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
      },
      useEffect(effect, deps) {
        if (previousRequest !== deps[1]) { cleanup?.(); pendingEffect = effect; previousRequest = deps[1]; }
      },
    },
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'synthetic' } }, error: null }) } } },
    '@/lib/requestFetch': { withRequestDeadline: operation => operation, fetchWithDeadline: (url, init) => new Promise(resolve => requests.push({ url, init, resolve })) },
    '@/lib/patientHistory': contracts,
  });
  return { requests, close: () => cleanup?.(), render() {
    index = 0; const state = api.usePatientHistory('1');
    if (pendingEffect) { const effect = pendingEffect; pendingEffect = undefined; cleanup = effect(); }
    return state;
  } };
}

/** @returns Settles only local promise handlers; no network or production queue is used. */
async function flush() { await new Promise(resolve => setImmediate(resolve)); }

test('Timeline loading appends older steps, preserves loaded history after failure, and refreshes explicitly', async () => {
  const harness = timelineLoader();
  assert.equal(harness.render().loading, true); await flush();
  assert.equal(harness.requests[0].init.headers.Authorization, 'Bearer synthetic');
  harness.requests[0].resolve(Response.json({ events: [event(3)], nextCursor: '3' })); await flush();
  let state = harness.render(); assert.equal(state.events.length, 1); assert.equal(state.loading, false);
  state.loadPage(state.cursor); harness.render(); await flush();
  assert.match(harness.requests[1].url, /before=3/);
  harness.requests[1].resolve(Response.json({ error: 'History temporarily unavailable' }, { status: 503 })); await flush();
  state = harness.render(); assert.equal(state.events.length, 1); assert.equal(state.error, 'History temporarily unavailable');
  state.loadPage(state.cursor); harness.render(); await flush();
  harness.requests[2].resolve(Response.json({ events: [event(2), event(1)], nextCursor: null })); await flush();
  state = harness.render(); assert.equal(state.events.map(step => step.id).join(','), '3,2,1'); assert.equal(state.error, null);
  state.loadPage(null); harness.render(); await flush();
  harness.requests[3].resolve(Response.json({ events: [event(4)], nextCursor: null })); await flush();
  assert.equal(harness.render().events.map(step => step.id).join(','), '4');
});

test('Closing a history panel cancels its request and ignores its late response', async () => {
  const harness = timelineLoader(); harness.render(); await flush();
  harness.close(); assert.equal(harness.requests[0].init.signal.aborted, true);
  harness.requests[0].resolve(Response.json({ events: [event()], nextCursor: null })); await flush();
  assert.equal(harness.render().events.length, 0);
});

test('History opens as a native focus-contained dialog, with Manila timestamps and explicit source/destination labels', () => {
  const jsx = (type, props) => ({ type, props }); const calls = [];
  const api = load('components/patients/PatientHistoryPanel.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, react: { useEffect() {}, useRef: () => ({ current: null }) },
    'react-dom': { createPortal: content => content }, '@/lib/patientHistory': contracts,
    './usePatientHistory': { usePatientHistory: () => ({ events: [event()], cursor: '1', loading: false, error: null, loadPage: cursor => calls.push(cursor) }) },
  }, { document: { body: {} } });
  /** Walks the rendered source components, preserving their actual text and callbacks. */
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== 'object') return [node];
    if (typeof node.type === 'function') return nodes(node.type(node.props));
    return [node, ...nodes(node.props?.children)];
  }
  const rendered = nodes(api.PatientHistoryPanel({ patientId: '1', ticket: '5001', onClose() {} }));
  const text = rendered.filter(node => typeof node === 'string').join(' ');
  assert.equal(rendered[0].type, 'dialog');
  assert.match(text, /History ·.*5001/); assert.match(text, /From/); assert.match(text, /To/); assert.match(text, /justin/);
  const times = rendered.filter(node => node?.type === 'time');
  assert.match(times[0].props.children, /11:00:00/);
  const buttons = rendered.filter(node => node?.type === 'button');
  buttons.find(node => node.props.children === 'Load older steps').props.onClick();
  buttons.find(node => node.props.children === 'Refresh history').props.onClick();
  assert.deepEqual(calls, ['1', null]);
  const source = fs.readFileSync(path.join(__dirname, '../components/patients/PatientHistoryPanel.tsx'), 'utf8');
  assert.match(source, /element\?\.showModal\(\)/);
  assert.match(source, /timeZone: 'Asia\/Manila'/);
});
