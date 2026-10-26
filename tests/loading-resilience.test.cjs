/** @fileoverview Bounded loading, concurrent read sharing, and workstation startup regressions. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads source modules using local SDK doubles without network or staff credentials. */
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, Request, Response, Headers, URL, AbortController, DOMException,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiledModule.exports;
}

/** Controls deadlines without making tests wait thirty real seconds. */
function transport(fetch) {
  const timers = new Map(); let nextId = 0;
  const api = load('lib/requestFetch.ts', {}, { fetch,
    setTimeout: (fn, delayMs) => { timers.set(++nextId, { fn, delayMs }); return nextId; },
    clearTimeout: id => timers.delete(id),
  });
  return { api, timers, expire() { for (const timer of [...timers.values()]) { assert.equal(timer.delayMs, 30000); timer.fn(); } } };
}

test('Identical concurrent reads share one request but each caller can independently read the body', async () => {
  let calls = 0;
  const { api } = transport(async () => Response.json({ call: ++calls }));
  const options = { headers: { Authorization: 'Bearer test-session' } };
  const [first, second] = await Promise.all([api.requestFetch('https://example.invalid/rest/v1/users', options), api.requestFetch('https://example.invalid/rest/v1/users', options)]);
  assert.equal(calls, 1);
  assert.deepEqual(await first.json(), { call: 1 });
  assert.deepEqual(await second.json(), { call: 1 });
  await api.requestFetch('https://example.invalid/rest/v1/users', options);
  assert.equal(calls, 2, 'Completed reads must not cache stale operational data');
});

test('Different sessions never share reads and mutations are neither shared nor automatically retried', async () => {
  let calls = 0;
  const { api } = transport(async () => { calls++; return Response.json({ ok: true }); });
  await Promise.all(['session-a', 'session-b'].map(token => api.requestFetch('https://example.invalid/users', { headers: { Authorization: token } })));
  assert.equal(calls, 2);
  await Promise.all([api.requestFetch('https://example.invalid/patients', { method: 'POST' }), api.requestFetch('https://example.invalid/patients', { method: 'POST' })]);
  assert.equal(calls, 4);
});

test('A stalled request aborts, releases its deadline, and permits a new attempt', async () => {
  let calls = 0;
  const harness = transport((_input, options) => {
    if (++calls > 1) return Promise.resolve(Response.json({ ok: true }));
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  });
  const first = harness.api.requestFetch('https://example.invalid/users');
  const failure = assert.rejects(first, /connection took too long/);
  harness.expire(); await failure;
  assert.equal(harness.timers.size, 0);
  assert.equal((await harness.api.requestFetch('https://example.invalid/users')).status, 200);
  assert.equal(calls, 2);
});

test('Caller cancellation is preserved and stalled SDK work also has a deadline', async () => {
  const harness = transport((_input, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason))));
  const controller = new AbortController();
  const cancelled = harness.api.fetchWithDeadline('https://example.invalid/users', { signal: controller.signal });
  const cancellation = assert.rejects(cancelled, /abort/i);
  controller.abort(); await cancellation;
  assert.equal(harness.timers.size, 0);
  const pending = harness.api.withRequestDeadline(new Promise(() => {}));
  const failure = assert.rejects(pending, /connection took too long/);
  harness.expire(); await failure;
  assert.equal(harness.timers.size, 0);
});

test('Page initialization and the access hook share one permissions load without caching later refreshes', async () => {
  let finishSession; let sessions = 0; let counters = 0; const effects = [];
  const session = new Promise(resolve => { finishSession = resolve; });
  const query = table => ({ select() { return this; }, eq() { return this; }, order() { return this; },
    maybeSingle: async () => ({ data: { id: 1, role: 'superadmin' }, error: null }),
    then(resolve) { return Promise.resolve({ data: table === 'services' ? [{ label_en: 'ECG' }] : [], error: null }).then(resolve); } });
  const channel = { on() { return this; }, subscribe() { return this; } };
  const api = load('app/transfer/hooks/useMyAccess.ts', {
    '@/lib/requestFetch': { withRequestDeadline: promise => promise },
    react: { useState: initial => [initial, () => {}], useCallback: fn => fn, useRef: value => ({ current: value }), useEffect: fn => effects.push(fn) },
    '@/lib/counters': { fetchActiveCounters: async () => { counters++; return [1]; } },
    '@/app/transfer/lib/constants': { CATEGORIES: ['ECG'] },
    '@/lib/supabase': { supabase: { auth: { getSession: async () => { sessions++; return session; } }, from: query, channel: () => channel, removeChannel() {} } },
  });
  const hook = api.useMyAccess(); effects[0]();
  const first = hook.fetchMyAccess(); const second = hook.fetchMyAccess();
  assert.equal(first, second);
  finishSession({ data: { session: { user: { id: 'staff' } } }, error: null });
  await first;
  assert.equal(sessions, 1); assert.equal(counters, 1);
  await hook.fetchMyAccess();
  assert.equal(sessions, 2); assert.equal(counters, 2);
});

test('A failed initial patient read rejects rather than presenting an empty operational queue', async () => {
  const query = { select() { return this; }, neq() { return this; }, gte() { return this; }, lt() { return this; }, order() { return this; },
    then(resolve) { return Promise.resolve({ data: null, error: { message: 'Offline' } }).then(resolve); } };
  const api = load('app/transfer/hooks/usePatientData.ts', {
    react: { useState: initial => [initial, () => {}], useCallback: fn => fn, useRef: value => ({ current: value }), useEffect() {} },
    '@/lib/supabase': { supabase: { from: () => query } }, '@/lib/counters': {},
  });
  const hook = api.usePatientData();
  await assert.rejects(hook.fetchData(true), /Unable to load the patient queue/);
  await hook.fetchData();
});
