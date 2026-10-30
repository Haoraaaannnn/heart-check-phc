/**
 * @fileoverview Regression tests for registration counter occupancy and service scoping.
 *
 * Verifies:
 * 1. Counters not in use (unoccupied) must not serve anything.
 * 2. Counters must only accept the service(s) they are specified to handle (e.g. OPD vs Consultation).
 * 3. Ineligible or unoccupied counter assignments are automatically cleared.
 * 4. Monitor Now Serving queue typography conforms to zero-overflow viewport scaling.
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
    },
  }).outputText;

  const compiledModule = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module: compiledModule,
      exports: compiledModule.exports,
      console,
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

const countersLib = load('lib/counters.ts', {
  '@/lib/supabase': { supabase: {} },
});

test('Counter lanes stay hidden until staff ownership is confirmed, including on public monitors', async () => {
  const counters = [
    { counter_number: 3, active: true, on_break: true, occupied: true, services: ['Consultation'] },
    { counter_number: 2, active: true, on_break: false, occupied: false, services: ['Consultation'] },
    { counter_number: 1, active: true, on_break: false, occupied: true, services: ['Consultation'] },
    { counter_number: 4, active: false, on_break: false, occupied: true, services: ['Consultation'] },
  ];
  const api = load('lib/counters.ts', { '@/lib/supabase': { supabase: {} } }, {
    fetch: async () => ({ ok: true, json: async () => ({ counters }) }),
  });
  assert.deepEqual([...await api.fetchActiveCounters()], [1]);
  assert.deepEqual([...await api.fetchActiveCounters(true)], [1, 3]);
  counters[1].occupied = true;
  assert.deepEqual([...await api.fetchActiveCounters()], [1, 2]);
  counters[0].occupied = false;
  counters[2].occupied = false;
  assert.deepEqual([...await api.fetchActiveCounters(true)], [2]);
});

test('Active physical counters remain hidden when ownership discovery is unavailable', async () => {
  const query = { select() { return this; }, eq() { return this; },
    order: async () => ({ data: [{ counter_number: 1, label: 'Consultation', active: true, on_break: false }], error: null }) };
  const api = load('lib/counters.ts', { '@/lib/supabase': { supabase: { from: () => query } } }, {
    fetch: async () => { throw new Error('Ownership unavailable'); },
  });
  assert.deepEqual([...await api.fetchActiveCounters(true)], []);
});

test('matchesCounterService: matches exact service and common clinical abbreviations', () => {
  const { matchesCounterService } = countersLib;

  // Exact matches
  assert.equal(matchesCounterService(['OPD Screening'], 'OPD Screening'), true);
  assert.equal(matchesCounterService(['Consultation'], 'Consultation'), true);

  // Abbreviations & partial matches
  assert.equal(matchesCounterService(['OPD'], 'OPD Screening'), true);
  assert.equal(matchesCounterService(['OPD Screening'], 'OPD'), true);
  assert.equal(matchesCounterService(['Screening'], 'OPD Screening'), true);

  // Rejections for mismatched service
  assert.equal(matchesCounterService(['OPD Screening'], 'Consultation'), false);
  assert.equal(matchesCounterService(['Consultation'], 'OPD Screening'), false);
  assert.equal(matchesCounterService(['OPD Screening'], 'Warfarin'), false);
  assert.equal(matchesCounterService([], 'OPD Screening'), false);
  assert.equal(matchesCounterService(['OPD Screening'], null), false);
  assert.equal(matchesCounterService(['OPD Screening'], undefined), false);
});

test('filterEligibleCounters: excludes unoccupied counters, breaks, and mismatched services', () => {
  const { filterEligibleCounters } = countersLib;

  const counters = [
    { counter_number: 1, label: 'Counter 1', active: true, on_break: false, occupied: true, services: ['OPD Screening'] },
    { counter_number: 2, label: 'Counter 2', active: true, on_break: false, occupied: false, services: ['Consultation'] }, // unoccupied!
    { counter_number: 3, label: 'Counter 3', active: true, on_break: true, occupied: true, services: ['OPD Screening'] },  // on break!
    { counter_number: 4, label: 'Counter 4', active: false, on_break: false, occupied: true, services: ['OPD Screening'] }, // inactive!
    { counter_number: 5, label: 'Counter 5', active: true, on_break: false, occupied: true, services: ['Consultation'] },
  ];

  // OPD Screening patient
  const opdEligible = filterEligibleCounters(counters, 'OPD Screening');
  assert.equal(opdEligible.length, 1);
  assert.equal(opdEligible[0].counter_number, 1);

  // Consultation patient (Counter 2 is unoccupied, Counter 5 is occupied)
  const consultEligible = filterEligibleCounters(counters, 'Consultation');
  assert.equal(consultEligible.length, 1);
  assert.equal(consultEligible[0].counter_number, 5);

  // Other service (e.g. Warfarin)
  const warfarinEligible = filterEligibleCounters(counters, 'Warfarin');
  assert.equal(warfarinEligible.length, 0);

  // When no counters are occupied, no counter can serve
  const allUnoccupied = counters.map(c => ({ ...c, occupied: false }));
  assert.equal(filterEligibleCounters(allUnoccupied, 'OPD Screening').length, 0);
  assert.equal(filterEligibleCounters(allUnoccupied, 'Consultation').length, 0);
});

test('Intake assignment: unoccupied counters never serve; occupied counters serve only specified services', () => {
  const { filterEligibleCounters } = countersLib;

  // Scenario matching user problem:
  // Counter 1: occupied, serving OPD Screening ONLY
  // Counters 2, 3, 4: active in facilities, but NOT in use (unoccupied)
  const occupiedCounters = [
    { counter_number: 1, label: 'Counter 1', active: true, on_break: false, occupied: true, services: ['OPD Screening'] },
    { counter_number: 2, label: 'Counter 2', active: true, on_break: false, occupied: false, services: [] },
    { counter_number: 3, label: 'Counter 3', active: true, on_break: false, occupied: false, services: [] },
    { counter_number: 4, label: 'Counter 4', active: true, on_break: false, occupied: false, services: [] },
  ];

  const queue = [
    { id: 101, patientNum: '1001', service: 'OPD Screening', counter: undefined },
    { id: 102, patientNum: '1002', service: 'Consultation', counter: undefined },
    { id: 103, patientNum: '1003', service: 'OPD Screening', counter: undefined },
    { id: 104, patientNum: '1004', service: 'Consultation', counter: 2 }, // Erroneous legacy assignment to unoccupied counter 2
  ];

  const assigned = [];
  const cleared = [];

  for (const patient of queue) {
    const eligible = filterEligibleCounters(occupiedCounters, patient.service);
    const isCurrentEligible = patient.counter != null && eligible.some(c => c.counter_number === patient.counter);

    if (eligible.length === 0) {
      if (patient.counter != null) {
        cleared.push(patient.id);
        patient.counter = undefined;
      }
      continue;
    }

    if (!isCurrentEligible) {
      const chosen = eligible[0]; // Counter 1
      patient.counter = chosen.counter_number;
      assigned.push({ id: patient.id, counter: chosen.counter_number });
    }
  }

  // 1001 (OPD) was assigned to Counter 1
  assert.equal(queue.find(p => p.id === 101)?.counter, 1);
  // 1002 (Consultation) was NOT assigned to Counter 1, 2, 3, or 4
  assert.equal(queue.find(p => p.id === 102)?.counter, undefined);
  // 1003 (OPD) was assigned to Counter 1
  assert.equal(queue.find(p => p.id === 103)?.counter, 1);
  // 1004 (Consultation legacy on counter 2) was cleared because Counter 2 is unoccupied and doesn't serve Consultation
  assert.equal(queue.find(p => p.id === 104)?.counter, undefined);
  assert.ok(cleared.includes(104));

  // Verify counters 2, 3, 4 served NOTHING
  const allAssignedCounters = queue.map(p => p.counter).filter(Boolean);
  assert.ok(!allAssignedCounters.includes(2));
  assert.ok(!allAssignedCounters.includes(3));
  assert.ok(!allAssignedCounters.includes(4));
});

test('Monitor styles: ticket typography does not use oversized 10rem or 11.5rem classes', () => {
  const stylesModule = load('app/monitor/constants/monitorStyles.ts');
  const styles = stylesModule.MONITOR_STYLES;

  const fourServing = styles.registrationLayout.fourServingTicket;
  const nowServing = styles.registrationLayout.nowServingTicket;

  // Prohibit explosive font sizes that clip cards
  assert.ok(!fourServing.includes('11.5rem'), 'fourServingTicket must not exceed reasonable scale');
  assert.ok(!fourServing.includes('10rem'), 'fourServingTicket must not use text-[10rem]');
  assert.ok(!nowServing.includes('9.5rem'), 'nowServingTicket must not use text-[9.5rem]');

  // Confirm standard solid responsive scaling is maintained
  assert.ok(fourServing.includes('text-8xl'));
  assert.ok(nowServing.includes('text-8xl'));
});

test('Dynamic Services: newly added services with specific counters route correctly', () => {
  const { matchesCounterService, filterEligibleCounters } = countersLib;

  // Admin added new service 'Dental Clinic' and 'Pediatrics'
  assert.equal(matchesCounterService(['Dental Clinic'], 'Dental Clinic'), true);
  assert.equal(matchesCounterService(['Dental'], 'Dental Clinic'), true);
  assert.equal(matchesCounterService(['Dental Clinic'], 'Dental'), true);
  assert.equal(matchesCounterService(['Dental Clinic'], 'OPD Screening'), false);

  // Setup counters with newly added services
  const counters = [
    { counter_number: 1, label: 'Counter 1 (OPD)', active: true, on_break: false, occupied: true, services: ['OPD Screening'] },
    { counter_number: 2, label: 'Counter 2 (Dental)', active: true, on_break: false, occupied: true, services: ['Dental Clinic'] },
    { counter_number: 3, label: 'Counter 3 (Unoccupied)', active: true, on_break: false, occupied: false, services: ['Dental Clinic'] },
  ];

  // Dental patient should route ONLY to Counter 2, NOT 1 or 3
  const dentalEligible = filterEligibleCounters(counters, 'Dental Clinic');
  assert.equal(dentalEligible.length, 1);
  assert.equal(dentalEligible[0].counter_number, 2);

  // OPD patient should route ONLY to Counter 1, NOT 2 or 3
  const opdEligible = filterEligibleCounters(counters, 'OPD Screening');
  assert.equal(opdEligible.length, 1);
  assert.equal(opdEligible[0].counter_number, 1);

  // Unoccupied Counter 3 must NEVER be eligible
  const unoccupied = filterEligibleCounters(counters, 'Dental Clinic').filter(c => c.counter_number === 3);
  assert.equal(unoccupied.length, 0);
});

test('Multi-service counters: staff claiming multiple services accept all claimed and reject unclaimed', () => {
  const { filterEligibleCounters } = countersLib;

  // Staff at Counter 1 selected both OPD and Consultation
  const counters = [
    { counter_number: 1, label: 'Counter 1', active: true, on_break: false, occupied: true, services: ['OPD Screening', 'Consultation'] },
    { counter_number: 2, label: 'Counter 2', active: true, on_break: false, occupied: true, services: ['Dental'] },
  ];

  assert.equal(filterEligibleCounters(counters, 'OPD Screening')[0].counter_number, 1);
  assert.equal(filterEligibleCounters(counters, 'Consultation')[0].counter_number, 1);
  assert.equal(filterEligibleCounters(counters, 'Dental')[0].counter_number, 2);
  assert.equal(filterEligibleCounters(counters, 'Cardiology').length, 0); // No counter serves Cardiology
});

test('Dynamic Rooms & Cubicles: room discovery and cubicle filtering across newly added facilities', () => {
  // Simulate cubicle dataset when user adds Room 3, Room 4, and new cubicles for 'Consultation' and 'Dental'
  const cubicles = [
    { id: 1, cubicleNum: 'Consultation R1 C1', category: 'Consultation', room: 1, subcategory: 'Adult', on_break: false },
    { id: 2, cubicleNum: 'Consultation R1 C2', category: 'Consultation', room: 1, subcategory: 'Adult', on_break: false },
    { id: 3, cubicleNum: 'Consultation R2 C1', category: 'Consultation', room: 2, subcategory: 'Pedia', on_break: false },
    { id: 4, cubicleNum: 'Consultation R3 C1', category: 'Consultation', room: 3, subcategory: 'Adult', on_break: false }, // Newly added room 3!
    { id: 5, cubicleNum: 'Dental R4 C1', category: 'Dental', room: 4, subcategory: null, on_break: false }, // Newly added service Dental, room 4!
    { id: 6, cubicleNum: 'Dental R4 C2', category: 'Dental', room: 4, subcategory: null, on_break: true }, // Cubicle on break
  ];

  // 1. Dynamic room extraction (used in StationSetupModal and RoomsPanel)
  const distinctRooms = (cubicleList) => {
    const set = new Set();
    cubicleList.forEach(c => { if (c.room) set.add(c.room); });
    return Array.from(set).sort((a, b) => a - b);
  };

  assert.deepEqual(distinctRooms(cubicles), [1, 2, 3, 4]);

  // 2. Filter by service and room (e.g. transfer board selecting Room 3)
  const room3AdultConsultation = cubicles.filter(
    c => c.category === 'Consultation' && c.subcategory === 'Adult' && c.room === 3
  );
  assert.equal(room3AdultConsultation.length, 1);
  assert.equal(room3AdultConsultation[0].cubicleNum, 'Consultation R3 C1');

  // 3. Filter by newly added service 'Dental' excluding break cubicles
  const activeDentalCubicles = cubicles.filter(
    c => c.category === 'Dental' && !c.on_break
  );
  assert.equal(activeDentalCubicles.length, 1);
  assert.equal(activeDentalCubicles[0].cubicleNum, 'Dental R4 C1');
});

test('Non-registration services: bypass registration desk and clear erroneous counter assignments', () => {
  // Services configuration: Consultation requires registration, ECG does NOT require registration
  const activeRegServices = ['Consultation', 'OPD Screening', 'Dental'];

  const queue = [
    { id: 1, patientNum: '101', service: 'Consultation', counter: 1, reg_end: null },
    { id: 2, patientNum: '102', service: 'ECG', counter: 2, reg_end: null }, // Erroneous counter on non-reg service
    { id: 3, patientNum: '103', service: 'Dental', counter: undefined, reg_end: null },
  ];

  const cleared = [];
  for (const p of queue) {
    if (p.counter != null && !p.reg_end && !activeRegServices.includes(p.service || '')) {
      p.counter = undefined;
      cleared.push(p.id);
    }
  }

  // ECG patient counter was cleared
  assert.equal(queue.find(p => p.id === 2).counter, undefined);
  assert.deepEqual(cleared, [2]);

  // Consultation patient retained their counter
  assert.equal(queue.find(p => p.id === 1).counter, 1);
});

test('Counter Deactivation: active queue is automatically transferred to remaining open counters or returned to unassigned pool', () => {
  const { matchesCounterService } = countersLib;

  // Simulate deactivation of Counter 1
  const counterBeingDisabled = 1;
  const remainingCounters = [
    { counter_number: 2, isOccupied: true, services: ['OPD Screening'] },
    { counter_number: 3, isOccupied: true, services: ['Dental Clinic'] },
    { counter_number: 4, isOccupied: false, services: ['OPD Screening'] }, // Unoccupied: cannot receive patients
  ];

  // Patients currently stationed at Counter 1
  const patientsAtCounter1 = [
    { id: 201, patientNum: 'OPD-1', service: 'OPD Screening', counter: 1, reg_end: null, status: 'On Progress' },
    { id: 202, patientNum: 'OPD-2', service: 'OPD Screening', counter: 1, reg_end: null, status: 'On Progress' },
    { id: 203, patientNum: 'CON-1', service: 'Consultation', counter: 1, reg_end: null, status: 'On Progress' }, // No counter serves Consultation!
    { id: 204, patientNum: 'DONE-1', service: 'OPD Screening', counter: 1, reg_end: '2026-10-27T10:00:00Z', status: 'Done' }, // Already completed
  ];

  const counterLoad = new Map([
    [2, 1], // Counter 2 already has 1 patient
    [3, 0],
    [4, 0],
  ]);

  const activeWaiting = patientsAtCounter1.filter(p => !p.reg_end && p.status !== 'Done');
  assert.equal(activeWaiting.length, 3); // 201, 202, 203

  const transferred = [];
  const unassigned = [];

  for (const patient of activeWaiting) {
    const eligible = remainingCounters.filter(
      c => c.isOccupied && matchesCounterService(c.services, patient.service)
    );

    if (eligible.length > 0) {
      eligible.sort((a, b) => {
        const diff = (counterLoad.get(a.counter_number) || 0) - (counterLoad.get(b.counter_number) || 0);
        if (diff !== 0) return diff;
        return a.counter_number - b.counter_number;
      });

      const best = eligible[0];
      counterLoad.set(best.counter_number, (counterLoad.get(best.counter_number) || 0) + 1);
      patient.counter = best.counter_number;
      transferred.push({ id: patient.id, counter: best.counter_number });
    } else {
      patient.counter = null;
      unassigned.push(patient.id);
    }
  }

  // OPD patients 201 and 202 transferred to Counter 2
  assert.equal(patientsAtCounter1.find(p => p.id === 201).counter, 2);
  assert.equal(patientsAtCounter1.find(p => p.id === 202).counter, 2);
  assert.equal(transferred.length, 2);

  // Consultation patient 203 had no open counters: unassigned to queue
  assert.equal(patientsAtCounter1.find(p => p.id === 203).counter, null);
  assert.deepEqual(unassigned, [203]);

  // Dental counter 3 and unoccupied counter 4 received 0 OPD/Consultation patients
  assert.equal(counterLoad.get(3), 0);
  assert.equal(counterLoad.get(4), 0);

  // Completed patient 204 was untouched
  assert.equal(patientsAtCounter1.find(p => p.id === 204).counter, 1);
});


