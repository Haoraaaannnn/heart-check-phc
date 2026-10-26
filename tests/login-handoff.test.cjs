/** @fileoverview First-login server cookie handoff regression checks with no real credentials. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads the real login source with controlled auth and form dependencies. */
function load(file, mocks, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, console, URL, Response,
    require: name => { assert.ok(name in mocks, `Unexpected dependency: ${name}`); return mocks[name]; }, ...globals });
  return compiledModule.exports;
}

test('First login writes server cookies before confirming success and does not return tokens for a second writer', async () => {
  const writes = [];
  const profileQuery = { select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; },
    maybeSingle: async () => ({ data: { role: 'superadmin' } }), upsert: async () => ({ error: null }) };
  const api = load('app/api/auth/login/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => {
      assert.ok(writes.length > 0, 'Response must follow cookie installation'); return Response.json(body, init);
    } } },
    '@supabase/supabase-js': { createClient: () => ({ from: () => profileQuery }) },
    'next/headers': { cookies: async () => ({ getAll: () => [], set: (...args) => writes.push(args) }) },
    '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: { signInWithPassword: async () => {
      options.cookies.setAll([{ name: 'sb-test-auth-token.0', value: 'part-0', options: { maxAge: 3600 } },
        { name: 'sb-test-auth-token.1', value: 'part-1', options: { maxAge: 3600 } }]);
      return { data: { session: { access_token: 'test-only', refresh_token: 'test-only' }, user: { id: 'staff' } }, error: null };
    } } }) },
  }, { process: { env: {} } });
  const response = await api.POST(new Request('http://localhost/api/auth/login', { method: 'POST',
    body: JSON.stringify({ email: 'staff@example.invalid', password: 'test-only' }) }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { role: 'superadmin' });
  assert.equal(writes.length, 2);
  assert.equal(writes[0][2].path, '/');
  assert.equal('maxAge' in writes[0][2], false);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('First login waits for old session recovery, then navigates with server cookies without a second session write', async () => {
  const states = []; let cursor = 0; const destinations = []; const requests = [];
  const jsx = (type, props) => ({ type, props });
  const componentNames = ['LoginHeader', 'LoginForm', 'LoginFooter'];
  const mocks = {
    '@/lib/supabase': { supabase: { auth: { initialize: async () => { requests.push({ initialization: true }); } } } },
    react: { useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }]; }, useEffect() {}, useRef: () => ({ current: null }) },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useSearchParams: () => new URLSearchParams() },
    '@/app/login/constants/loginStyles': { LOGIN_STYLES: {} },
    '@/app/login/constants/loginTexts': { LOGIN_TEXTS: { alerts: {} } },
  };
  for (const name of componentNames) mocks[`@/app/login/components/${name}`] = { [name]: name };
  const api = load('app/login/page.tsx', mocks, {
    window: { location: { replace: destination => destinations.push(destination) } },
    fetch: async (url, options) => { requests.push({ url, options }); return Response.json({ role: 'superadmin' }); },
  });
  const inner = api.default().props.children.type;
  const form = () => { cursor = 0; return inner().props.children[1].props.children.props; };
  form().setEmail('staff@example.invalid'); form().setPassword('test-only');
  await form().onSubmit({ preventDefault() {} });
  assert.deepEqual(destinations, ['/select-screen']);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].initialization, true);
  assert.equal(requests[1].url, '/api/auth/login');
});
