/** @fileoverview Regression checks for shared-tab activity, safe auth events, login navigation, and session policy. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads production modules with isolated SDK/browser doubles and no real credentials or network. */
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: key => {
    if (!(key in mocks)) throw new Error(`Unexpected dependency ${key}`);
    return mocks[key];
  }, Response, URL, Headers, atob, console, ...globals }, { filename: file });
  return module.exports;
}

/** In-memory localStorage shared by simulated browser tabs. */
function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), clear: () => data.clear() };
}

/** Flushes SDK and React-effect promise continuations without sleeping. */
async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
const policy = load('lib/sessionPolicy.ts');

test('activity in one tab keeps an unused sibling tab signed in', () => {
  const shared = storage();
  const transfer = new policy.SessionActivityClock(shared, 'session-a', 100000);
  const nurse = new policy.SessionActivityClock(shared, 'session-a', 100000);
  assert.equal(transfer.record(20, 100000 + 19 * 60000), true);
  assert.equal(nurse.remaining(20, 100000 + 21 * 60000), 18 * 60000);
});

test('refreshing or duplicating a page preserves the existing inactivity deadline', () => {
  const shared = storage();
  new policy.SessionActivityClock(shared, 'session-a', 100000);
  const duplicate = new policy.SessionActivityClock(shared, 'session-a', 100000 + 10 * 60000);
  assert.equal(duplicate.remaining(20, 100000 + 10 * 60000), 10 * 60000);
});

test('expired sessions cannot be revived by focus, a late click, or a new tab', () => {
  const shared = storage();
  new policy.SessionActivityClock(shared, 'session-a', 100000);
  const reopened = new policy.SessionActivityClock(shared, 'session-a', 100000 + 21 * 60000);
  assert.equal(reopened.remaining(20, 100000 + 21 * 60000), 0);
  assert.equal(reopened.record(20, 100000 + 21 * 60000), false);
});

test('new sign-ins and different accounts do not inherit another session deadline', () => {
  const shared = storage();
  new policy.SessionActivityClock(shared, 'old-session', 100000);
  const fresh = new policy.SessionActivityClock(shared, 'new-session', 100000 + 30 * 60000);
  assert.equal(fresh.remaining(20, 100000 + 30 * 60000), 20 * 60000);
  const token = payload => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  assert.equal(policy.sessionActivityKey(token({ session_id: 'same-session', exp: 1 }), 'user-a'), policy.sessionActivityKey(token({ session_id: 'same-session', exp: 2 }), 'user-a'));
  assert.notEqual(policy.sessionActivityKey(token({ session_id: 'new-session' }), 'user-a'), policy.sessionActivityKey(token({ session_id: 'same-session' }), 'user-a'));
});

test('policy accepts whole minutes only within the administrative range', () => {
  for (const value of [0, -1, 4, 721, 1.5, '20minutes', '20.0', '', null, false, Infinity]) assert.equal(policy.parseSessionMinutes(value), null);
  for (const value of [5, 20, 720, '60']) assert.equal(policy.parseSessionMinutes(value), Number(value));
});

test('storage failures retain local inactivity protection', () => {
  const clock = new policy.SessionActivityClock({ getItem() { throw Error('Blocked'); }, setItem() { throw Error('Blocked'); } }, 'session-a', 100000);
  assert.equal(clock.remaining(20, 100000 + 21 * 60000), 0);
});

/** Runs the actual auth hook with controlled effects, timers, and SDK events. */
function authorizationHarness({ role = 'superadmin', sessionError = null, allowedWorkstations } = {}) {
  const effects = []; const timers = new Map(); const states = []; const navigations = []; const events = new Map();
  const callbacks = []; let timerId = 0; let sessionReads = 0; let roleReads = 0; let inAuthCallback = false;
  const supabase = {
    auth: {
      getSession: async () => {
        assert.equal(inAuthCallback, false, 'SDK calls must not execute inside the auth notification lock');
        sessionReads++;
        return { data: { session: { user: { id: 'staff', user_metadata: { allowed_workstations: allowedWorkstations } } } }, error: sessionError };
      },
      onAuthStateChange: callback => { callbacks.push(callback); return { data: { listener: null, subscription: { unsubscribe() {} } } }; },
    },
    from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => { roleReads++; return { data: { role }, error: null }; } }),
  };
  const api = load('hooks/useStaffAuthorization.ts', {
    react: { useState: value => [value, next => states.push(next)], useEffect: fn => effects.push(fn) },
    '@/lib/supabase': { supabase },
  }, {
    window: { location: { replace: url => navigations.push(url), reload() { throw Error('Unexpected full reload'); } },
      addEventListener: (name, callback) => events.set(name, callback), removeEventListener() {} },
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }, clearTimeout: id => timers.delete(id),
  });
  // Match the SDK's real listener response shape.
  supabase.auth.onAuthStateChange = callback => { callbacks.push(callback); return { data: { subscription: { unsubscribe() {} } } }; };
  return {
    mount: (roles, workstation) => { api.useStaffAuthorization(roles, workstation); effects.shift()(); },
    async run(ms = 0) { const list = [...timers.entries()].filter(([, item]) => item.ms === ms); for (const [id, item] of list) { timers.delete(id); item.fn(); } await flush(); },
    fire(event) { inAuthCallback = true; callbacks.forEach(callback => callback(event, null)); inAuthCallback = false; },
    states, navigations, events, timers,
    reads: () => ({ sessionReads, roleReads }),
  };
}

test('initial empty notifications and token refresh never reload or sign out staff pages', async () => {
  const harness = authorizationHarness(); harness.mount(['superadmin']);
  harness.fire('INITIAL_SESSION'); await harness.run();
  harness.fire('TOKEN_REFRESHED'); await flush();
  assert.deepEqual(harness.navigations, []);
  assert.ok(harness.states.includes(false));
  assert.equal(harness.reads().sessionReads, 1);
});

test('layout and page share one in-flight role check', async () => {
  const harness = authorizationHarness(); harness.mount(['superadmin']); harness.mount(['admin', 'superadmin']);
  await harness.run();
  assert.deepEqual(harness.reads(), { sessionReads: 1, roleReads: 1 });
  assert.equal(harness.states.filter(value => value === false).length, 2);
});

test('temporary session failures retry instead of navigating to Login', async () => {
  const harness = authorizationHarness({ sessionError: new Error('Temporary network failure') });
  harness.mount(['superadmin']); await harness.run();
  assert.deepEqual(harness.navigations, []);
  assert.ok([...harness.timers.values()].some(timer => timer.ms === 2000));
});

test('restoring a page revalidates without reloading; real logout still redirects', async () => {
  const harness = authorizationHarness(); harness.mount(['superadmin']); await harness.run();
  harness.events.get('pageshow')({ persisted: true }); await harness.run();
  assert.deepEqual(harness.navigations, []);
  harness.fire('SIGNED_IN'); await harness.run();
  harness.fire('SIGNED_OUT');
  assert.deepEqual(harness.navigations, ['/login']);
});

test('wrong roles remain blocked by the shared guard', async () => {
  const harness = authorizationHarness({ role: 'nurse' }); harness.mount(['superadmin']); await harness.run();
  assert.deepEqual(harness.navigations, ['/unauthorized']);
});

test('workstation restrictions survive session-guard conflict resolution, including for superadmins', async () => {
  for (const workstation of ['transfer', 'nurse']) {
    for (const allowedWorkstations of [undefined, [workstation], [], ['dashboard']]) {
      const harness = authorizationHarness({ allowedWorkstations });
      harness.mount(['superadmin'], workstation);
      await harness.run();
      const permitted = allowedWorkstations === undefined || allowedWorkstations.includes(workstation);
      assert.deepEqual(harness.navigations, permitted ? [] : ['/unauthorized']);
      assert.equal(harness.states.includes(false), permitted);
    }
  }
});

/** Runs the actual server proxy and records any attempted cookie mutation. */
function proxyHarness({ authError = null, user = { id: 'staff' } } = {}) {
  const writes = [];
  class NextResponse extends Response {
    constructor(body, init) { super(body, init); this.cookies = { set: (...args) => writes.push(args) }; }
    static next() { return new NextResponse(null); }
    static redirect(url) { return new NextResponse(null, { status: 307, headers: { Location: String(url) } }); }
  }
  const supabase = { auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: { role: 'superadmin' }, error: null }) }) };
  const api = load('proxy.ts', { 'next/server': { NextResponse }, '@supabase/ssr': { createServerClient: () => supabase } }, { process: { env: {} } });
  return { writes, run: pathname => api.proxy({ url: `http://localhost${pathname}`, nextUrl: new URL(`http://localhost${pathname}`), headers: new Headers(),
    cookies: { getAll: () => [{ name: 'sb-test-auth-token', value: 'keep-session' }], set() {} } }) };
}

test('opening or prefetching Login does not clear cookies in any tab', async () => {
  const harness = proxyHarness();
  const response = await harness.run('/login');
  assert.equal(response.status, 200); assert.deepEqual(harness.writes, []);
});

test('temporary server auth outages return retryable errors without forcing logout', async () => {
  const harness = proxyHarness({ user: null, authError: { name: 'AuthRetryableFetchError', status: 503 } });
  const response = await harness.run('/transfer');
  assert.equal(response.status, 503); assert.equal(response.headers.get('location'), null); assert.deepEqual(harness.writes, []);
});

test('explicit logout revokes only this browser session and retains the requested destination', async () => {
  const scopes = []; const navigation = [];
  const api = load('lib/supabase/signOut.ts', { '@/lib/supabase': { supabase: { auth: { signOut: async options => scopes.push(options.scope) } } } }, {
    fetch: async () => Response.json({ success: true }), sessionStorage: { clear() {} },
    window: { location: { replace: url => navigation.push(url) } },
  });
  await api.handleSignOut('/login?reason=idle');
  assert.deepEqual(scopes, ['local']); assert.deepEqual(navigation, ['/login?reason=idle']);
});

/** Loads the session-policy endpoint with a server-side privilege decision and settings store. */
function policyApi({ admin = true, stored = null } = {}) {
  const writes = [];
  const allowed = { authorized: true };
  const forbidden = { authorized: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  const api = load('app/api/auth/session-policy/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': { requireUser: async () => allowed },
    '@/lib/supabase/superadminGuard': { requireSuperadmin: async () => admin ? allowed : forbidden },
    '@/lib/sessionPolicy': policy,
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: { from: () => ({ select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: stored === null ? null : { value: stored }, error: null }),
      upsert: async value => { writes.push(value); return { error: null }; } }) } },
  });
  return { ...api, writes };
}

test('session timeout uses the old default until a Superadmin explicitly changes it', async () => {
  const request = new Request('http://localhost/api/auth/session-policy');
  assert.equal((await (await policyApi().GET(request)).json()).minutes, 20);
  assert.equal((await (await policyApi({ stored: '120' }).GET(request)).json()).minutes, 120);
});

test('session policy writes are authorized and strictly validated on the server', async () => {
  const request = minutes => new Request('http://localhost/api/auth/session-policy', { method: 'POST', body: JSON.stringify({ minutes }) });
  const denied = policyApi({ admin: false });
  assert.equal((await denied.POST(request(120))).status, 403); assert.equal(denied.writes.length, 0);
  const allowed = policyApi();
  assert.equal((await allowed.POST(request(0))).status, 400);
  assert.equal((await allowed.POST(request(720))).status, 200);
  assert.equal(allowed.writes[0].key, 'staff_session_idle_minutes');
  assert.equal(allowed.writes[0].value, '720');
});
