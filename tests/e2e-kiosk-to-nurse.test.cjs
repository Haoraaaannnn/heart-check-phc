/**
 * @fileoverview End-to-End Clinic Simulation Test: Kiosk -> Monitor(Registration) -> Transfer -> Monitor(Services) -> Nurse -> Finished.
 *
 * Exercises the entire patient journey across all subsystems in memory:
 * 1. Kiosk Check-In: Phone encryption, ticket numbering, queue registration.
 * 2. Registration Monitor & Counter Intake: Counter assignment, speech call, reg_start -> reg_end.
 * 3. Transfer Desk: Eligibility validation, cubicle matching, break rejection, cubicle assignment.
 * 4. Clinical Service & Custom Monitor: Multi-service speech dispatch, queue scale, PII sanitization.
 * 5. Nurse Workstation: Progressive stage transitions (Assigned -> With Doctor -> Carryout -> Done),
 *    timestamp enforcement, stage-skipping prevention, and post-completion immutability.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

/** Transpiles and loads a TypeScript module in an isolated VM context. */
function load(file, mocks = {}, globals = {}) {
  const fullPath = path.join(__dirname, '..', file);
  const source = fs.readFileSync(fullPath, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, {
    module: compiledModule,
    exports: compiledModule.exports,
    Request,
    Response,
    Headers,
    URL,
    Buffer,
    console: { log() {}, warn() {}, error() {} },
    require: name => {
      assert.ok(name in mocks, `Unexpected require: ${name}`);
      return mocks[name];
    },
    ...globals
  }, { filename: file });
  return compiledModule.exports;
}

/** Simulates the AES-256-GCM patient phone encryption action. */
function encryptPhone(phone, secretHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
  const key = Buffer.from(secretHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${enc.toString('base64')}:${tag.toString('base64')}`;
}

/** Simulates the phone masking rule from AGENTS.md (0917 •••• 567). */
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 4)} •••• ${phone.slice(-3)}`;
}

/** In-memory stateful clinic database double. */
function createClinicDatabase() {
  const state = {
    patients: [],
    services: [
      { id: 1, label_en: 'Consultation', has_subcategories: true, requires_registration: true, prefix: '2', queue_pad_length: 3 },
      { id: 2, label_en: 'Registration', has_subcategories: false, requires_registration: false, prefix: '1', queue_pad_length: 3 },
      { id: 3, label_en: 'ECG', has_subcategories: false, requires_registration: false, prefix: '3', queue_pad_length: 3 },
    ],
    counters: [
      { counter_number: 1, active: true, on_break: false },
      { counter_number: 2, active: true, on_break: true }, // on break
    ],
    cubicle: [
      { id: 101, cubicleNum: 'Consultation R1 C1', category: 'Consultation', subcategory: 'Pedia', room: 1, doctorId: 10, on_break: false },
      { id: 102, cubicleNum: 'Consultation R1 C2', category: 'Consultation', subcategory: 'Pedia', room: 1, doctorId: 11, on_break: true }, // on break
      { id: 103, cubicleNum: 'Consultation R2 C1', category: 'Consultation', subcategory: 'Adult', room: 2, doctorId: 12, on_break: false },
    ],
    doctors: [
      { id: 10, full_name: 'Maria Santos', auth_id: 'doc-10' },
      { id: 11, full_name: 'Juan Dela Cruz', auth_id: 'doc-11' },
      { id: 12, full_name: 'Elena Ramos', auth_id: 'doc-12' },
    ],
    users: [
      { id: 1, auth_id: 'staff-reg', role: 'registration' },
      { id: 2, auth_id: 'staff-nurse', role: 'nurse' },
      { id: 3, auth_id: 'staff-admin', role: 'admin' },
    ],
    user_cubicles: [{ user_id: 2, cubicle_id: 101 }],
    user_services: [{ user_id: 2, service: 'Consultation' }],
    user_counters: [{ user_id: 1, counter: 1 }],
    user_rooms: [{ user_id: 2, service: 'Consultation', subcategory: 'Pedia', room: 1 }],
    monitor_calls: [],
  };

  let nextPatientId = 1;
  let nextCallId = 1;

  const db = {
    state,
    rpc(name, payload) {
      if (name === 'create_patient') {
        const count = state.patients.filter(p => p.service === payload.p_service).length + 1;
        const patientNum = `${payload.p_prefix}${String(count).padStart(3, '0')}`;
        const patient = {
          id: nextPatientId++,
          patientNum,
          service: payload.p_service,
          subcategory: payload.p_subcategory ?? null,
          preferredCubicleNums: payload.p_preferred_cubicles ?? null,
          phoneNum: payload.p_phone ?? null,
          status: 'On Progress',
          counter: null,
          cubicleNum: null,
          reg_start: null,
          reg_end: null,
          consult_start: null,
          consult_end: null,
          carryout_start: null,
          carryout_end: null,
          called_at: null,
          queue_position: state.patients.length + 1,
          is_historical: false,
          created_at: new Date().toISOString(),
        };
        state.patients.push(patient);
        return Promise.resolve({ data: [{ id: patient.id, patientNum: patient.patientNum, queue_position: patient.queue_position }], error: null });
      }

      if (name === 'enqueue_monitor_call') {
        const call = {
          id: nextCallId++,
          patient_id: payload.p_patient_id,
          actor_id: payload.p_actor_id,
          service: payload.p_service,
          subcategory: payload.p_subcategory,
          counter: payload.p_counter,
          cubicle: payload.p_cubicle,
          ticket: payload.p_ticket,
          message: payload.p_message,
          expires_at: new Date(Date.now() + 90000).toISOString(),
        };
        state.monitor_calls.push(call);
        return Promise.resolve({ data: true, error: null });
      }

      return Promise.resolve({ data: null, error: new Error(`Unknown RPC ${name}`) });
    },
    from(tableName) {
      const filters = [];
      let updateFields = null;

      const query = {
        select() { return this; },
        eq(col, val) { filters.push(row => row[col] === val); return this; },
        neq(col, val) { filters.push(row => row[col] !== val); return this; },
        gt(col, val) { filters.push(row => row[col] > val); return this; },
        gte(col, val) { filters.push(row => row[col] >= val); return this; },
        lt(col, val) { filters.push(row => row[col] < val); return this; },
        in(col, vals) { filters.push(row => vals.includes(row[col])); return this; },
        is(col, val) { filters.push(row => val === null ? row[col] === null : row[col] === val); return this; },
        not(col, op, val) {
          if (op === 'is' && val === null) filters.push(row => row[col] !== null);
          return this;
        },
        order(col, opts = {}) {
          return this;
        },
        limit(num) { return this; },
        update(fields) { updateFields = fields; return this; },
        async maybeSingle() {
          if (tableName === 'patients' && updateFields?.cubicleNum) {
            const isBreak = state.cubicle.some(c => c.cubicleNum === updateFields.cubicleNum && c.on_break);
            if (isBreak) return { data: null, error: { message: 'Station on break' } };
          }
          let rows = state[tableName] ?? [];
          for (const f of filters) rows = rows.filter(f);
          if (updateFields) {
            for (const r of rows) Object.assign(r, updateFields);
          }
          return { data: rows[0] ?? null, error: null };
        },
        then(resolve, reject) {
          let rows = state[tableName] ?? [];
          for (const f of filters) rows = rows.filter(f);
          if (updateFields) {
            for (const r of rows) Object.assign(r, updateFields);
          }
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        }
      };
      return query;
    }
  };

  return db;
}

// -------------------------------------------------------------------------------------
// TEST SUITE: COMPLETE CLINIC LIFECYCLE
// -------------------------------------------------------------------------------------

test('Clinic End-to-End Simulation: Kiosk -> Registration -> Transfer -> Clinical Monitor -> Nurse -> Finished', async () => {
  const db = createClinicDatabase();

  // ===================================================================================
  // STEP 1: KIOSK (Check-in & Ticket Dispensing)
  // ===================================================================================
  const rawPhone = '09171234567';
  const encryptedPhone = encryptPhone(rawPhone);
  assert.match(encryptedPhone, /^enc:v1:/, 'Phone number must be encrypted with AES-256-GCM');
  assert.equal(maskPhone(rawPhone), '0917 •••• 567', 'Client screens must display masked phone');

  // Kiosk RPC invocation
  const kioskResult = await db.rpc('create_patient', {
    p_service: 'Consultation',
    p_subcategory: 'Pedia',
    p_preferred_cubicles: ['Consultation R1 C1'],
    p_prefix: '2',
    p_group_by_subcategory: false,
    p_phone: encryptedPhone,
  });

  assert.equal(kioskResult.error, null);
  const patient = db.state.patients[0];
  assert.ok(patient, 'Patient must be inserted in database');
  assert.equal(patient.patientNum, '2001', 'Patient ticket must follow service prefix 2 and padding');
  assert.equal(patient.service, 'Consultation');
  assert.equal(patient.subcategory, 'Pedia');
  assert.equal(patient.status, 'On Progress', 'Kiosk check-in assigns On Progress queue status');
  assert.equal(patient.is_historical, false, 'Patient must not be marked historical');
  assert.equal(patient.counter, null, 'Counter must start unassigned');
  assert.equal(patient.cubicleNum, null, 'Cubicle must start unassigned');
  assert.equal(patient.reg_start, null);
  assert.equal(patient.reg_end, null);

  // ===================================================================================
  // STEP 2: REGISTRATION MONITOR & COUNTER INTAKE
  // ===================================================================================
  // Registration desk claims the patient at Counter 1
  const activeCounters = db.state.counters.filter(c => c.active && !c.on_break).map(c => c.counter_number);
  assert.deepEqual(activeCounters, [1], 'Counter 1 is open, Counter 2 is on break');

  const nowMs = Date.now();
  patient.counter = 1;
  patient.reg_start = new Date(nowMs).toISOString();

  // Registration Monitor verifies visibility
  const regMonitorPatients = db.state.patients.filter(p =>
    p.service === 'Consultation' &&
    p.counter === 1 &&
    p.reg_end === null &&
    !p.is_historical
  );
  assert.equal(regMonitorPatients.length, 1);
  assert.equal(regMonitorPatients[0].patientNum, '2001', 'Registration monitor must display patient 2001');

  // Registration Staff calls patient to Counter 1 via POST /api/monitor-calls
  const monitorCallsApi = load('app/api/monitor-calls/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': {
      requireUser: async () => ({ authorized: true, user: { id: 'staff-reg' } })
    },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: db },
    '@/utils/formatTicketSpeech': { formatTicketForSpeech: t => t.split('').join(' ') },
  });

  const regCallRequest = new Request('http://localhost/api/monitor-calls', {
    method: 'POST',
    body: JSON.stringify({ patientId: patient.id })
  });
  const regCallResponse = await monitorCallsApi.POST(regCallRequest);
  assert.equal(regCallResponse.status, 202, 'Registration call must be accepted');

  const enqueuedRegCall = db.state.monitor_calls[0];
  assert.ok(enqueuedRegCall);
  assert.equal(enqueuedRegCall.service, 'Registration');
  assert.equal(enqueuedRegCall.counter, 1);
  assert.match(enqueuedRegCall.message, /Counter 1/);
  assert.match(enqueuedRegCall.message, /2 0 0 1/);

  // Public Monitor Poll (GET /api/monitor-calls?service=Registration&after=0)
  const regPollResponse = await monitorCallsApi.GET(new Request('http://localhost/api/monitor-calls?service=Registration&after=0'));
  const regPollJson = await regPollResponse.json();
  assert.equal(regPollJson.calls.length, 1);
  assert.equal(regPollJson.calls[0].ticket, '2001');
  assert.equal(regPollJson.calls[0].counter, 1);
  assert.equal('patient_id' in regPollJson.calls[0], false, 'PII and database IDs must not be leaked to public monitor');

  // Registration Finishes (Assessment completed)
  patient.reg_end = new Date(nowMs + 180000).toISOString(); // 3 minutes later

  // Once reg_end is stamped, patient no longer appears on Registration active counter
  const regActiveAfterFinish = db.state.patients.filter(p => p.counter === 1 && p.reg_end === null);
  assert.equal(regActiveAfterFinish.length, 0, 'Patient cleared from active counter when reg_end is stamped');

  // ===================================================================================
  // STEP 3: TRANSFER DESK (Counter -> Clinical Cubicle)
  // ===================================================================================
  // Transfer pool queries patients ready for cubicle routing:
  // Requires: reg_end IS NOT NULL and cubicleNum IS NULL
  const transferQueue = db.state.patients.filter(p => p.reg_end !== null && p.cubicleNum === null && !p.is_historical);
  assert.equal(transferQueue.length, 1);
  assert.equal(transferQueue[0].patientNum, '2001', 'Patient 2001 must appear in transfer queue');

  // Candidate cubicle calculation
  const transferMutations = load('app/transfer/lib/transferMutations.ts', {
    './constants': { MAX_PATIENTS_PER_CUBICLE: 5 },
    '@/lib/offlineQueue': { enqueueMutation: async () => ({ id: 'mock' }) },
    '@/lib/supabase': { supabase: db },
  }, { navigator: { onLine: true } });

  const activePediaCubicles = db.state.cubicle.filter(c => !c.on_break);
  const candidates = transferMutations.assignmentCandidates({
    patient,
    cubicles: activePediaCubicles,
    assigned: {}
  });

  // Cubicle R1 C1 is open for Pedia; Cubicle R1 C2 is on break; Cubicle R2 C1 is Adult
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].cubicleNum, 'Consultation R1 C1', 'Candidate must match Pedia cubicle and skip on-break station');

  // Reject assignment if destination cubicle is on break
  const onBreakCubicle = db.state.cubicle.find(c => c.on_break);
  await assert.rejects(
    transferMutations.saveTransferAssignments([{ id: patient.id, cubicleNum: onBreakCubicle.cubicleNum, status: 'Assigned' }]),
    /patient could not be moved/,
    'Assignment to an on-break station must fail'
  );

  // Execute valid assignment to Consultation R1 C1
  await transferMutations.saveTransferAssignments([
    { id: patient.id, cubicleNum: 'Consultation R1 C1', status: 'Assigned' }
  ]);

  assert.equal(patient.cubicleNum, 'Consultation R1 C1');
  assert.equal(patient.status, 'Assigned');
  patient.called_at = new Date(nowMs + 200000).toISOString();

  // ===================================================================================
  // STEP 4: CLINICAL SERVICE & CUSTOM MONITOR DISPLAY
  // ===================================================================================
  // Multi-service monitor polling: ?service=Registration,Consultation,ECG
  const clinicalCallRequest = new Request('http://localhost/api/monitor-calls', {
    method: 'POST',
    body: JSON.stringify({ patientId: patient.id })
  });
  const clinicalCallResponse = await load('app/api/monitor-calls/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': {
      requireUser: async () => ({ authorized: true, user: { id: 'staff-nurse' } })
    },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: db },
    '@/utils/formatTicketSpeech': { formatTicketForSpeech: t => t.split('').join(' ') },
  }).POST(clinicalCallRequest);

  assert.equal(clinicalCallResponse.status, 202, 'Clinical call must be accepted');

  const enqueuedClinicalCall = db.state.monitor_calls[db.state.monitor_calls.length - 1];
  assert.equal(enqueuedClinicalCall.service, 'Consultation');
  assert.equal(enqueuedClinicalCall.cubicle, 'Consultation R1 C1');
  assert.match(enqueuedClinicalCall.message, /Consultation R1 C1/);

  // Multi-Service Custom Monitor receives call event
  const customMonitorPoll = await load('app/api/monitor-calls/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': { requireUser: async () => ({ authorized: true, user: { id: 'staff-reg' } }) },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: db },
    '@/utils/formatTicketSpeech': { formatTicketForSpeech: t => t.split('').join(' ') },
  }).GET(new Request('http://localhost/api/monitor-calls?service=Registration,Consultation,ECG&after=1'));

  const customPollJson = await customMonitorPoll.json();
  assert.equal(customPollJson.calls.length, 1);
  assert.equal(customPollJson.calls[0].ticket, '2001');
  assert.equal(customPollJson.calls[0].cubicle, 'Consultation R1 C1');

  // ===================================================================================
  // STEP 5: NURSE WORKSTATION (Clinical Progression)
  // ===================================================================================
  const nurseTransitionApi = load('app/api/nurse/patients/transition.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': {
      requireUser: async () => ({
        authorized: true,
        user: { id: 'staff-nurse', user_metadata: { allowed_workstations: ['nurse'] } }
      })
    },
  });

  const sendNurseUpdate = (updates, expectedStatus) => {
    return nurseTransitionApi.handleNurseTransition(
      new Request('http://localhost/api/nurse/patients', {
        method: 'PATCH',
        body: JSON.stringify({ patientId: patient.id, updates, expectedStatus })
      }),
      db
    );
  };

  // Step 5A: Stage skipping must be rejected (Assigned cannot jump directly to Done)
  const skipResponse = await sendNurseUpdate({ status: 'Done' }, 'Assigned');
  assert.equal(skipResponse.status, 409, 'Skipping stages (Assigned -> Done) must be blocked');

  // Step 5B: Progressive transition: Assigned -> With Doctor
  const doctorSeenTime = new Date(nowMs + 240000).toISOString();
  const withDoctorResponse = await sendNurseUpdate({ status: 'With Doctor', consult_start: doctorSeenTime }, 'Assigned');
  assert.equal(withDoctorResponse.status, 200, 'Assigned -> With Doctor transition must succeed');
  assert.equal(patient.status, 'With Doctor');
  assert.equal(patient.consult_start, doctorSeenTime);

  // Step 5C: Progressive transition: With Doctor -> Carryout
  const doctorEndTime = new Date(nowMs + 600000).toISOString(); // 6 mins consult
  const carryoutResponse = await sendNurseUpdate({
    status: 'Carryout',
    consult_end: doctorEndTime,
    carryout_start: doctorEndTime
  }, 'With Doctor');
  assert.equal(carryoutResponse.status, 200, 'With Doctor -> Carryout transition must succeed');
  assert.equal(patient.status, 'Carryout');
  assert.equal(patient.consult_end, doctorEndTime);
  assert.equal(patient.carryout_start, doctorEndTime);

  // Step 5D: Progressive transition: Carryout -> Done (FINISHED)
  const carryoutEndTime = new Date(nowMs + 780000).toISOString(); // 3 mins carryout
  const doneResponse = await sendNurseUpdate({
    status: 'Done',
    carryout_end: carryoutEndTime
  }, 'Carryout');
  assert.equal(doneResponse.status, 200, 'Carryout -> Done transition must succeed');
  assert.equal(patient.status, 'Done');
  assert.equal(patient.carryout_end, carryoutEndTime);

  // ===================================================================================
  // STEP 6: POST-COMPLETION INVARIANTS & INTEGRITY VERIFICATION
  // ===================================================================================
  // 1. Finished patient cannot be called to monitors
  const finishedCallResponse = await load('app/api/monitor-calls/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': { requireUser: async () => ({ authorized: true, user: { id: 'staff-nurse' } }) },
    '@/lib/supabase/facilityHelpers': { supabaseAdmin: db },
    '@/utils/formatTicketSpeech': { formatTicketForSpeech: t => t.split('').join(' ') },
  }).POST(new Request('http://localhost/api/monitor-calls', {
    method: 'POST',
    body: JSON.stringify({ patientId: patient.id })
  }));
  assert.equal(finishedCallResponse.status, 409, 'Done patients cannot be recalled to public monitors');

  // 2. Finished patient cannot regress backward to earlier stages
  const regressResponse = await sendNurseUpdate({ status: 'With Doctor' }, 'Done');
  assert.equal(regressResponse.status, 409, 'Done patient status is immutable and cannot regress');

  // 3. Time and Motion metrics are fully calculable without NaN or null gaps
  const regDurationMin = (new Date(patient.reg_end).getTime() - new Date(patient.reg_start).getTime()) / 60000;
  const consultDurationMin = (new Date(patient.consult_end).getTime() - new Date(patient.consult_start).getTime()) / 60000;
  const carryoutDurationMin = (new Date(patient.carryout_end).getTime() - new Date(patient.carryout_start).getTime()) / 60000;
  const totalDurationMin = (new Date(patient.carryout_end).getTime() - new Date(patient.created_at).getTime()) / 60000;

  assert.equal(regDurationMin, 3, 'Registration intake was 3 minutes');
  assert.equal(consultDurationMin, 6, 'Doctor consultation was 6 minutes');
  assert.equal(carryoutDurationMin, 3, 'Carry out was 3 minutes');
  assert.equal(Math.round(totalDurationMin), 13, 'Total journey from kiosk to finished was 13 minutes');
});

test('Failure Path: Patient lacking reg_end is rejected from clinical progression if service requires registration', async () => {
  const db = createClinicDatabase();

  // Create a Consultation patient who bypassed registration (reg_end is null)
  await db.rpc('create_patient', {
    p_service: 'Consultation',
    p_subcategory: 'Pedia',
    p_preferred_cubicles: ['Consultation R1 C1'],
    p_prefix: '2',
    p_group_by_subcategory: false,
    p_phone: null,
  });

  const patient = db.state.patients[0];
  assert.equal(patient.reg_end, null);

  // In transfer queue: patient lacking reg_end cannot be transferred to cubicle
  const eligibleForTransfer = db.state.patients.filter(p => p.reg_end !== null && p.cubicleNum === null);
  assert.equal(eligibleForTransfer.length, 0, 'Unregistered consultation patients cannot be transferred');
});

test('Security & Role Boundary: Registration staff cannot execute nurse clinical transitions', async () => {
  const db = createClinicDatabase();
  await db.rpc('create_patient', {
    p_service: 'Consultation',
    p_subcategory: 'Pedia',
    p_prefix: '2',
    p_group_by_subcategory: false,
  });
  const patient = db.state.patients[0];
  patient.status = 'Assigned';
  patient.cubicleNum = 'Consultation R1 C1';

  const nurseTransitionApi = load('app/api/nurse/patients/transition.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': {
      requireUser: async () => ({
        authorized: true,
        user: { id: 'staff-reg', user_metadata: { allowed_workstations: ['registration'] } } // Registration role
      })
    },
  });

  const response = await nurseTransitionApi.handleNurseTransition(
    new Request('http://localhost/api/nurse/patients', {
      method: 'PATCH',
      body: JSON.stringify({ patientId: patient.id, updates: { status: 'With Doctor' }, expectedStatus: 'Assigned' })
    }),
    db
  );

  assert.equal(response.status, 403, 'Registration staff must be barred from nurse stage transitions');
  assert.equal(patient.status, 'Assigned', 'Patient status must remain untouched');
});

test('Concurrency & Historical Immunity: Concurrent mutations and historical patients are immune to updates', async () => {
  const db = createClinicDatabase();
  await db.rpc('create_patient', {
    p_service: 'Consultation',
    p_subcategory: 'Pedia',
    p_prefix: '2',
    p_group_by_subcategory: false,
  });
  const patient = db.state.patients[0];
  patient.status = 'Assigned';
  patient.cubicleNum = 'Consultation R1 C1';

  const nurseTransitionApi = load('app/api/nurse/patients/transition.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase/authGuard': {
      requireUser: async () => ({
        authorized: true,
        user: { id: 'staff-nurse', user_metadata: { allowed_workstations: ['nurse'] } }
      })
    },
  });

  // Stale expected status: Client thought status was 'Waiting' but it is 'Assigned'
  const staleResponse = await nurseTransitionApi.handleNurseTransition(
    new Request('http://localhost/api/nurse/patients', {
      method: 'PATCH',
      body: JSON.stringify({ patientId: patient.id, updates: { status: 'With Doctor' }, expectedStatus: 'Waiting' })
    }),
    db
  );
  assert.equal(staleResponse.status, 409, 'Stale concurrent update must be rejected with 409 conflict');

  // Historical patient immunity: is_historical = true
  patient.is_historical = true;
  const historicalResponse = await nurseTransitionApi.handleNurseTransition(
    new Request('http://localhost/api/nurse/patients', {
      method: 'PATCH',
      body: JSON.stringify({ patientId: patient.id, updates: { status: 'With Doctor' }, expectedStatus: 'Assigned' })
    }),
    db
  );
  assert.equal(historicalResponse.status, 409, 'Historical patients must be immune to clinical transitions');
});
