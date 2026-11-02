/** @fileoverview Regression tests for station claim configuration persistence and logout release. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, {
    module: compiled,
    exports: compiled.exports,
    Response,
    URL,
    Headers,
    atob,
    console,
    Date,
    Error,
    process,
    require: (name) => {
      if (!(name in mocks)) throw new Error(`Unexpected mock require: ${name}`);
      return mocks[name];
    },
    ...globals,
  }, { filename: file });
  return compiled.exports;
}

test('assignDoctor detaches physician from previous cubicle when assigned to a new one', async () => {
  const doctorId = '00000000-0000-4000-8000-000000000001';
  const cubicles = [
    { id: 1, cubicleNum: 'C1', category: 'Consultation', room: 1, subcategory: null, doctorId },
    { id: 2, cubicleNum: 'C2', category: 'Consultation', room: 1, subcategory: null, doctorId: null },
  ];
  const doctors = [
    { id: doctorId, full_name: 'Dr. Test', active: true, auth_id: null, specialty: null },
  ];
  const users = [
    { id: 1, auth_id: 'admin-id', role: 'admin', username: 'admin' },
  ];

  const db = {
    from(table) {
      let filters = [];
      let pendingUpdate = null;
      const query = {
        select() { return this; },
        order() { return this; },
        eq(k, v) {
          filters.push((r) => r[k] === v);
          return this;
        },
        neq(k, v) {
          filters.push((r) => r[k] !== v);
          return this;
        },
        is(k, v) {
          filters.push((r) => (r[k] ?? null) === v);
          return this;
        },
        update(payload) {
          pendingUpdate = payload;
          return this;
        },
        async maybeSingle() {
          const list = table === 'cubicle' ? cubicles : table === 'doctors' ? doctors : table === 'users' ? users : [];
          if (pendingUpdate) {
            const matched = list.filter((r) => filters.every((f) => f(r)));
            matched.forEach((r) => Object.assign(r, pendingUpdate));
            return { data: matched[0] ?? null, error: null };
          }
          const matched = list.filter((r) => filters.every((f) => f(r)));
          return { data: matched[0] ?? null, error: null };
        },
        then(resolve) {
          const list = table === 'cubicle' ? cubicles : table === 'doctors' ? doctors : table === 'users' ? users : [];
          if (pendingUpdate) {
            const matched = list.filter((r) => filters.every((f) => f(r)));
            matched.forEach((r) => Object.assign(r, pendingUpdate));
            resolve({ data: matched.map((r) => ({ ...r })), error: null });
            return;
          }
          const matched = list.filter((r) => filters.every((f) => f(r)));
          resolve({ data: matched.map((r) => ({ ...r })), error: null });
        },
      };
      return query;
    },
  };

  const api = load('app/api/doctors/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': {
      requireUser: async () => ({ authorized: true, user: { id: 'admin-id' } }),
    },
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@/lib/doctors/syncAccounts': { syncDoctorAccounts: async () => {} },
    '@/lib/doctors/contracts': {
      isDoctorRecord: (v) => typeof v === 'object' && v !== null,
      parseDoctorDirectory: (d) => d,
    },
    '@/lib/doctors/access': { editableDoctorStations: async () => [1, 2] },
  });

  const res = await api.POST({
    json: async () => ({
      action: 'assign',
      cubicleId: 2,
      doctorId,
      expectedDoctorId: null,
    }),
  });

  assert.equal(res.status, 200);
  assert.equal(cubicles[0].doctorId, null);
  assert.equal(cubicles[1].doctorId, doctorId);
});

test('Logout releases active station claims and detaches doctor cubicles', async () => {
  const userCounters = [{ user_id: 10, counter: 3 }];
  const userCubicles = [{ user_id: 10, cubicle_id: 5 }];
  const userServices = [{ user_id: 10, service: 'Consultation' }];
  const cubicles = [{ id: 5, doctorId: 'doc-uuid-1' }];
  let savedMeta = null;

  const mockAdmin = {
    from(table) {
      let filters = [];
      let isDelete = false;
      let pendingUpdate = null;

      const query = {
        select() { return this; },
        eq(k, v) {
          filters.push((r) => r[k] === v);
          return this;
        },
        update(payload) {
          pendingUpdate = payload;
          return this;
        },
        delete() {
          isDelete = true;
          return this;
        },
        async maybeSingle() {
          if (table === 'users') {
            return { data: { id: 10, role: 'doctor', auth_id: 'doc-auth-uuid' }, error: null };
          }
          if (table === 'doctors') {
            return { data: { id: 'doc-uuid-1', auth_id: 'doc-auth-uuid' }, error: null };
          }
          return { data: null, error: null };
        },
        then(resolve) {
          if (isDelete) {
            if (table === 'user_counters') {
              const toKeep = userCounters.filter((r) => !filters.every((f) => f(r)));
              userCounters.length = 0;
              userCounters.push(...toKeep);
            }
            if (table === 'user_cubicles') {
              const toKeep = userCubicles.filter((r) => !filters.every((f) => f(r)));
              userCubicles.length = 0;
              userCubicles.push(...toKeep);
            }
            if (table === 'user_services') {
              const toKeep = userServices.filter((r) => !filters.every((f) => f(r)));
              userServices.length = 0;
              userServices.push(...toKeep);
            }
            resolve({ data: null, error: null });
            return;
          }
          if (pendingUpdate && table === 'cubicle') {
            const matched = cubicles.filter((r) => filters.every((f) => f(r)));
            matched.forEach((r) => Object.assign(r, pendingUpdate));
            resolve({ data: matched, error: null });
            return;
          }
          if (table === 'user_counters') resolve({ data: [...userCounters], error: null });
          else if (table === 'user_cubicles') resolve({ data: [...userCubicles], error: null });
          else if (table === 'user_services') resolve({ data: [...userServices], error: null });
          else resolve({ data: [], error: null });
        },
      };
      return query;
    },
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: { id: 'doc-auth-uuid', user_metadata: {} } },
          error: null,
        }),
        updateUserById: async (id, payload) => {
          savedMeta = payload.user_metadata;
          return { data: null, error: null };
        },
      },
    },
  };

  const logoutRoute = load('app/api/auth/logout/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    'next/headers': {
      cookies: async () => ({
        getAll: () => [{ name: 'sb-token', value: '123' }],
        set() {},
      }),
    },
    '@supabase/ssr': {
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'doc-auth-uuid' } } }),
          signOut: async () => {},
        },
      }),
    },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: mockAdmin },
  });

  const res = await logoutRoute.POST({
    headers: new Headers(),
    url: 'http://localhost/api/auth/logout',
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  // Active desk must be deleted from join tables
  assert.equal(userCounters.length, 0);
  assert.equal(userCubicles.length, 0);
  assert.equal(userServices.length, 0);
  // Doctor cubicle must be reset to null
  assert.equal(cubicles[0].doctorId, null);
  // Configuration must be saved in metadata
  assert.ok(savedMeta?.station_config);
  assert.equal(savedMeta.station_config.counter, 3);
  assert.equal(savedMeta.station_config.cubicleId, 5);
  assert.deepEqual(savedMeta.station_config.services, ['Consultation']);
});

test('POST /api/workstation/station-claim rejects claiming an occupied counter or cubicle with 409 Conflict', async () => {
  const users = [
    { id: 10, auth_id: 'user-caller', username: 'Nurse Alice', role: 'nurse' },
    { id: 20, auth_id: 'user-occupant', username: 'Nurse Bob', role: 'nurse' },
  ];
  const counters = [{ counter_number: 2, active: true }];
  const cubicles = [{ id: 101, cubicleNum: 'Consultation R1 C1', active: true }];
  const userCounters = [{ user_id: 20, counter: 2, users: { username: 'Nurse Bob' } }];
  const userCubicles = [{ user_id: 20, cubicle_id: 101, users: { username: 'Nurse Bob' } }];

  const mockAdmin = {
    from(table) {
      let filters = [];
      const query = {
        select() { return this; },
        eq(k, v) { filters.push((r) => r[k] === v); return this; },
        neq(k, v) { filters.push((r) => r[k] !== v); return this; },
        delete() { return this; },
        insert() { return this; },
        async maybeSingle() {
          let list = [];
          if (table === 'users') list = users;
          else if (table === 'counters') list = counters;
          else if (table === 'cubicle') list = cubicles;
          else if (table === 'user_counters') list = userCounters;
          else if (table === 'user_cubicles') list = userCubicles;
          const matched = list.filter((r) => filters.every((f) => f(r)));
          return { data: matched[0] ?? null, error: null };
        },
        then(resolve) {
          resolve({ data: [], error: null });
        },
      };
      return query;
    },
    auth: {
      admin: {
        updateUserById: async () => ({ data: null, error: null }),
      },
    },
  };

  const stationClaimRoute = load('app/api/workstation/station-claim/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': {
      requireUser: async () => ({
        authorized: true,
        user: { id: 'user-caller', user_metadata: {} },
      }),
    },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: mockAdmin },
    '@/lib/supabase/queueDistribution': { equallyDistributeCounterQueues: async () => ({ ok: true }) },
  });

  // Attempt to claim counter 2 which is occupied by Nurse Bob
  const counterConflictRes = await stationClaimRoute.POST({
    json: async () => ({
      workstation: 'registration',
      counter: 2,
      services: ['Consultation'],
    }),
  });
  assert.equal(counterConflictRes.status, 409);
  const counterErr = await counterConflictRes.json();
  assert.ok(counterErr.error.includes('Counter 2 is currently in use by Nurse Bob'));

  // Attempt to claim cubicle 101 which is occupied by Nurse Bob
  const cubicleConflictRes = await stationClaimRoute.POST({
    json: async () => ({
      workstation: 'nurse',
      cubicleId: 101,
      services: ['Consultation'],
    }),
  });
  assert.equal(cubicleConflictRes.status, 409);
  const cubicleErr = await cubicleConflictRes.json();
  assert.ok(cubicleErr.error.includes('currently in use by Nurse Bob'));
});
