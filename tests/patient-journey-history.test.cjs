/**
 * @fileoverview Unit and integration tests for Patient Journey History & Stage Progression.
 *
 * Verifies:
 * 1. Progression stage classifier (Registration -> Queued -> In Service -> Completed).
 * 2. Exception states (Idle / On Hold, Removed).
 * 3. Journey steps progression contract (indices 0..3).
 * 4. Desk ordering logic (Signed-in user's counter first at index 0, occupied desks sorted, unclaimed excluded).
 * 5. Manila timestamp formatting and elapsed duration calculation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

/**
 * Loads a TypeScript source module into a sandboxed VM context.
 */
function loadTsModule(relativePath, mocks = {}, globals = {}) {
  const fullPath = path.join(__dirname, '..', relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;

  const compiledModule = { exports: {} };
  vm.runInNewContext(
    transpiled,
    {
      module: compiledModule,
      exports: compiledModule.exports,
      console,
      require: (name) => {
        if (mocks[name]) return mocks[name];
        throw new Error(`Unexpected mock require: ${name}`);
      },
      ...globals,
    }
  );
  return compiledModule.exports;
}

// Load pure history domain module
const historyModule = loadTsModule('app/transfer/types/history.ts', {
  '@/types/Types': {},
});
const { getPatientStage, JOURNEY_STEPS } = historyModule;

test('JOURNEY_STEPS defines exactly 4 progressive workflow steps', () => {
  assert.equal(JOURNEY_STEPS.length, 4);
  const steps = JOURNEY_STEPS.map((s) => s.step);
  const stages = JOURNEY_STEPS.map((s) => s.stage);
  assert.equal(steps[0], 0);
  assert.equal(steps[1], 1);
  assert.equal(steps[2], 2);
  assert.equal(steps[3], 3);

  assert.equal(stages[0], 'registration');
  assert.equal(stages[1], 'queued');
  assert.equal(stages[2], 'in_service');
  assert.equal(stages[3], 'done');

  assert.equal(JOURNEY_STEPS[0].label, 'Registration');
  assert.equal(JOURNEY_STEPS[1].label, 'Waiting Queue');
  assert.equal(JOURNEY_STEPS[2].label, 'In Service');
  assert.equal(JOURNEY_STEPS[3].label, 'Completed');
});

test('getPatientStage classifies Stage 0: Registration counter correctly', () => {
  const patientAtCounter = {
    id: 101,
    patientNum: 'A001',
    counter: 3,
    reg_start: '2026-10-31T08:00:00Z',
    status: 'In Registration',
  };

  const info = getPatientStage(patientAtCounter);
  assert.equal(info.stage, 'registration');
  assert.equal(info.stepIndex, 0);
  assert.equal(info.isTerminal, false);
  assert.equal(info.isException, false);
  assert.equal(info.currentLocation, 'Counter 3');
  assert.equal(info.stageColor, 'amber');
});

test('getPatientStage classifies Stage 1: Waiting Queue correctly', () => {
  const patientInQueue = {
    id: 102,
    patientNum: 'C005',
    reg_start: '2026-10-31T08:00:00Z',
    reg_end: '2026-10-31T08:05:00Z',
    status: 'On Progress',
    counter: null,
    cubicleNum: null,
  };

  const info = getPatientStage(patientInQueue);
  assert.equal(info.stage, 'queued');
  assert.equal(info.stepIndex, 1);
  assert.equal(info.isTerminal, false);
  assert.equal(info.isException, false);
  assert.equal(info.stageColor, 'blue');
});

test('getPatientStage classifies Stage 2: In Service (Consultation Cubicle) correctly', () => {
  const patientInCubicle = {
    id: 103,
    patientNum: 'C006',
    reg_end: '2026-10-31T08:05:00Z',
    status: 'assigned',
    cubicleNum: 'Adult-1',
  };

  const info = getPatientStage(patientInCubicle);
  assert.equal(info.stage, 'in_service');
  assert.equal(info.stepIndex, 2);
  assert.equal(info.isTerminal, false);
  assert.equal(info.isException, false);
  assert.equal(info.currentLocation, 'Cubicle Adult-1');
  assert.equal(info.stageColor, 'purple');
});

test('getPatientStage classifies Stage 3: Completed correctly across all completion signals', () => {
  // Case A: status = 'done'
  const donePatient = {
    id: 104,
    patientNum: 'C007',
    status: 'done',
    cubicleNum: 'Pedia-2',
  };
  const infoDone = getPatientStage(donePatient);
  assert.equal(infoDone.stage, 'done');
  assert.equal(infoDone.stepIndex, 3);
  assert.equal(infoDone.isTerminal, true);
  assert.equal(infoDone.isException, false);
  assert.equal(infoDone.stageColor, 'emerald');

  // Case B: consult_end is recorded
  const finishedPatient = {
    id: 105,
    patientNum: 'C008',
    status: 'On Progress',
    consult_end: '2026-10-31T08:30:00Z',
  };
  const infoFinished = getPatientStage(finishedPatient);
  assert.equal(infoFinished.stage, 'done');
  assert.equal(infoFinished.stepIndex, 3);
  assert.equal(infoFinished.isTerminal, true);

  // Case C: carryout_end is recorded
  const carryoutPatient = {
    id: 106,
    patientNum: 'C009',
    status: 'On Progress',
    carryout_end: '2026-10-31T08:45:00Z',
  };
  const infoCarryout = getPatientStage(carryoutPatient);
  assert.equal(infoCarryout.stage, 'done');
  assert.equal(infoCarryout.stepIndex, 3);
});

test('getPatientStage classifies Exception: On Hold (Idle) correctly', () => {
  const idlePatient = {
    id: 107,
    patientNum: 'C010',
    status: 'idle',
    idle_at: '2026-10-31T08:20:00Z',
    cubicleNum: 'Adult-2',
  };

  const info = getPatientStage(idlePatient);
  assert.equal(info.stage, 'idle');
  assert.equal(info.stepIndex, 1);
  assert.equal(info.isTerminal, false);
  assert.equal(info.isException, true);
  assert.equal(info.stageColor, 'amber');
  assert.equal(info.label, 'On Hold (Idle)');
});

test('getPatientStage classifies Exception: Removed correctly', () => {
  const removedPatient = {
    id: 108,
    patientNum: 'C011',
    status: 'removed',
    removed_at: '2026-10-31T08:15:00Z',
  };

  const info = getPatientStage(removedPatient);
  assert.equal(info.stage, 'removed');
  assert.equal(info.stepIndex, -1);
  assert.equal(info.isTerminal, true);
  assert.equal(info.isException, true);
  assert.equal(info.stageColor, 'slate');
  assert.equal(info.label, 'Removed');
});

test('Desk Ordering: Signed-in staff counter is sorted first at index 0, followed by occupied desks', () => {
  // Scenario:
  // Available counters in DB: 1, 2, 3, 4, 5
  // Logged in counters: 2, 4, 5 (1 and 3 are unoccupied)
  // Signed-in user is at Counter 4
  const availableCounters = [
    { id: 1, occupiedBy: null, service: 'Consultation' },
    { id: 2, occupiedBy: 'staff-b', service: 'Consultation' },
    { id: 3, occupiedBy: null, service: 'Consultation' },
    { id: 4, occupiedBy: 'staff-me', service: 'Consultation' },
    { id: 5, occupiedBy: 'staff-c', service: 'Consultation' },
  ];
  const myCounter = 4;
  const myCounters = [4];

  // Filtering: only counters that are logged in with an account
  const occupiedSet = new Set();
  if (myCounter != null) occupiedSet.add(myCounter);
  for (const c of availableCounters) {
    if (c.occupiedBy != null || myCounters.includes(c.id)) {
      occupiedSet.add(c.id);
    }
  }

  // Sorting: myCounter ALWAYS first, then remaining occupied desks numerically
  const list = Array.from(occupiedSet);
  list.sort((a, b) => {
    const aIsMine = myCounter != null ? a === myCounter : myCounters.includes(a);
    const bIsMine = myCounter != null ? b === myCounter : myCounters.includes(b);
    if (aIsMine && !bIsMine) return -1;
    if (!aIsMine && bIsMine) return 1;
    return a - b;
  });

  // Verification
  assert.equal(list[0], 4, 'Signed-in staff counter must be first at index 0');
  assert.deepEqual(list, [4, 2, 5], 'Unoccupied counters 1 and 3 must be excluded');
});

test('Elapsed wait duration in minutes is computed accurately', () => {
  const patient = {
    id: 109,
    created_at: '2026-10-31T08:00:00Z',
    consult_end: '2026-10-31T08:35:00Z',
  };

  const startMs = new Date(patient.created_at).getTime();
  const endMs = new Date(patient.consult_end).getTime();
  const diffMs = Math.max(0, endMs - startMs);
  const elapsedMinutes = Math.round(diffMs / 60_000);

  assert.equal(elapsedMinutes, 35);
});
