/**
 * @fileoverview Validation test suite for Estimated Wait Time (EWT) computation,
 * formatting, and queue pile-up dynamics across kiosk, thermal receipt, and SMS.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Transpiles and loads a TypeScript module in an isolated sandbox context. */
function loadTs(relativeFilePath, mocks = {}) {
  const absolutePath = path.join(__dirname, '..', relativeFilePath);
  const rawCode = fs.readFileSync(absolutePath, 'utf8');
  const transpiled = ts.transpileModule(rawCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const sandboxExports = {};
  const sandboxModule = { exports: sandboxExports };

  vm.runInNewContext(transpiled, {
    module: sandboxModule,
    exports: sandboxExports,
    Date,
    Math,
    Intl,
    console,
    require: (importPath) => {
      if (mocks[importPath]) return mocks[importPath];
      throw new Error(`Unmocked dependency in test: ${importPath}`);
    },
  });

  return sandboxModule.exports;
}

// 1. Load EWT text constants and formatting utilities
const ewtTexts = loadTs('constants/texts/ewtTexts.ts');
const {
  formatEwtLabel,
  formatEwtReceiptLabel,
  formatEwtSmsLabel,
  EWT_TEXTS,
} = ewtTexts;

// 2. Load manilaDayRange utility
const manilaDayRangeModule = loadTs('utils/manilaDayRange.ts');
const { manilaDayRange } = manilaDayRangeModule;

// 3. Load ewtComputation module with mocked dependencies
const ewtComputation = loadTs('app/api/print-ticket/ewtComputation.ts', {
  '@/lib/logger': { getTimestamp: () => '2026-11-01T22:00:00+08:00' },
  '@/utils/manilaDayRange': { manilaDayRange },
  '@/constants/ewtTexts': ewtTexts,
});
const { computeEstimatedWaitMinutes } = ewtComputation;

// =========================================================================
// TEST SUITE 1: Human-Friendly Range Formatting
// =========================================================================

test('EWT formatters correctly bracket wait times from 0m to >180m', () => {
  // Test Case A: Under 10 minutes
  assert.equal(formatEwtLabel(5), 'Less than 10 minutes');
  assert.equal(formatEwtReceiptLabel(5), '< 10 minutes');
  assert.equal(formatEwtSmsLabel(5), 'wala pang 10 minuto');

  // Test Case B: 10 to 29 minutes
  assert.equal(formatEwtLabel(15), 'About 10 to 30 minutes');
  assert.equal(formatEwtReceiptLabel(15), '~10-30 minutes');
  assert.equal(formatEwtSmsLabel(15), '~10 hanggang 30 minuto');

  // Test Case C: 30 to 59 minutes
  assert.equal(formatEwtLabel(45), 'About 30 minutes to 1 hour');
  assert.equal(formatEwtReceiptLabel(45), '~30 min - 1 hr');
  assert.equal(formatEwtSmsLabel(45), '~30 minuto hanggang 1 oras');

  // Test Case D: 60 to 119 minutes (1 to 2 hours)
  assert.equal(formatEwtLabel(90), 'About 1 to 2 hours');
  assert.equal(formatEwtReceiptLabel(90), '~1 to 2 hours');
  assert.equal(formatEwtSmsLabel(90), '~1 hanggang 2 oras');

  // Test Case E: 120 to 180 minutes (2 to 3 hours)
  assert.equal(formatEwtLabel(150), 'About 2 to 3 hours');
  assert.equal(formatEwtReceiptLabel(150), '~2 to 3 hours');
  assert.equal(formatEwtSmsLabel(150), '~2 hanggang 3 oras');

  // Test Case F: Exceeding 180 minutes (Heavy queue pile-up)
  assert.equal(formatEwtLabel(210), 'More than 3 hours');
  assert.equal(formatEwtReceiptLabel(210), '> 3 hours');
  assert.equal(formatEwtSmsLabel(210), 'higit sa 3 oras');
});

test('EWT formatters handle null, undefined, NaN, and negative minutes safely', () => {
  assert.equal(formatEwtLabel(null), EWT_TEXTS.calculating);
  assert.equal(formatEwtLabel(undefined), EWT_TEXTS.calculating);
  assert.equal(formatEwtLabel(NaN), EWT_TEXTS.calculating);
  assert.equal(formatEwtLabel(-5), EWT_TEXTS.calculating);

  assert.equal(formatEwtReceiptLabel(null), 'Unavailable');
  assert.equal(formatEwtReceiptLabel(undefined), 'Unavailable');
  assert.equal(formatEwtReceiptLabel(NaN), 'Unavailable');

  assert.equal(formatEwtSmsLabel(null), 'mga 15 hanggang 30 minuto');
  assert.equal(formatEwtSmsLabel(undefined), 'mga 15 hanggang 30 minuto');
});

// =========================================================================
// TEST SUITE 2: Mock Supabase Client & Dynamic Computation
// =========================================================================

/**
 * Creates an in-memory test database double simulating Supabase PostgREST queries.
 */
function createMockSupabase(dataset) {
  const {
    patients = [],
    cubicles = [],
    counters = [],
    simulateError = false,
  } = dataset;

  return {
    from(table) {
      if (simulateError) {
        return {
          select() {
            return {
              eq() { return this; },
              in() { return this; },
              gte() { return this; },
              lt() { return this; },
              not() { return this; },
              order() { return this; },
              limit() { return this; },
              then(resolve) {
                resolve({ data: null, count: null, error: new Error('Simulated DB network failure') });
              },
            };
          },
        };
      }

      const activeFilters = [];
      let isCountOnly = false;
      let limitCount = Infinity;

      const queryBuilder = {
        select(_fields, options) {
          if (options && options.head && options.count === 'exact') {
            isCountOnly = true;
          }
          return this;
        },
        eq(field, value) {
          activeFilters.push(row => row[field] === value);
          return this;
        },
        in(field, values) {
          activeFilters.push(row => values.includes(row[field]));
          return this;
        },
        gte(field, value) {
          activeFilters.push(row => row[field] >= value);
          return this;
        },
        lt(field, value) {
          activeFilters.push(row => row[field] < value);
          return this;
        },
        not(field, operator, value) {
          if (operator === 'is' && value === null) {
            activeFilters.push(row => row[field] !== null && row[field] !== undefined);
          }
          return this;
        },
        order() {
          return this;
        },
        limit(num) {
          limitCount = num;
          return this;
        },
        then(resolve) {
          let sourceTable = [];
          if (table === 'patients') sourceTable = patients;
          if (table === 'cubicle') sourceTable = cubicles;
          if (table === 'counters') sourceTable = counters;

          const filtered = sourceTable.filter(row => activeFilters.every(f => f(row)));

          if (isCountOnly) {
            resolve({ data: null, count: filtered.length, error: null });
          } else {
            resolve({ data: filtered.slice(0, limitCount), count: filtered.length, error: null });
          }
        },
      };

      return queryBuilder;
    },
  };
}

test('Queue Pile-Up Dynamics: EWT scales proportionally as patients queue ahead', async () => {
  const service = 'Adult Cardiology';
  const todayRange = manilaDayRange(Date.now());
  const nowIso = new Date(Date.parse(todayRange.start) + 4 * 3600000).toISOString();

  // 2 open cubicles for Adult Cardiology
  const cubicles = [
    { id: 1, cubicleNum: 'C1', category: service, on_break: false },
    { id: 2, cubicleNum: 'C2', category: service, on_break: false },
  ];

  // Helper to generate N waiting patients created earlier today
  const generateQueue = (count) => {
    const list = [];
    // 1 completed patient to mark intake as commenced today (buffer = 5m)
    list.push({
      id: 1000,
      service,
      status: 'Done',
      is_historical: false,
      created_at: todayRange.start,
      consult_start: todayRange.start,
      consult_end: new Date(Date.parse(todayRange.start) + 15 * 60000).toISOString(),
    });

    for (let i = 1; i <= count; i++) {
      const minutesOffset = i * 2;
      list.push({
        id: i,
        patientNum: `C00${i}`,
        service,
        status: 'On Progress', // standard kiosk status
        is_historical: false,
        created_at: new Date(Date.parse(todayRange.start) + minutesOffset * 60000).toISOString(),
      });
    }
    return list;
  };

  // Scenario 1: Empty Queue (0 patients ahead)
  {
    const mockDb = createMockSupabase({ cubicles, patients: generateQueue(0) });
    const result = await computeEstimatedWaitMinutes(mockDb, service, nowIso);
    assert.equal(result.positionAhead, 0);
    assert.equal(result.activeServers, 2);
    // (0 / 2) * 15 + 5 = 5m
    assert.equal(result.estimatedWaitMinutes, 5);
    assert.equal(formatEwtLabel(result.estimatedWaitMinutes), 'Less than 10 minutes');
  }

  // Scenario 2: Light Queue (2 patients ahead)
  {
    const mockDb = createMockSupabase({ cubicles, patients: generateQueue(2) });
    const result = await computeEstimatedWaitMinutes(mockDb, service, nowIso);
    assert.equal(result.positionAhead, 2);
    assert.equal(result.activeServers, 2);
    // (2 / 2) * 15 + 5 = 20m
    assert.equal(result.estimatedWaitMinutes, 20);
    assert.equal(formatEwtLabel(result.estimatedWaitMinutes), 'About 10 to 30 minutes');
  }

  // Scenario 3: Moderate Pile-Up (6 patients ahead)
  {
    const mockDb = createMockSupabase({ cubicles, patients: generateQueue(6) });
    const result = await computeEstimatedWaitMinutes(mockDb, service, nowIso);
    assert.equal(result.positionAhead, 6);
    assert.equal(result.activeServers, 2);
    // (6 / 2) * 15 + 5 = 50m
    assert.equal(result.estimatedWaitMinutes, 50);
    assert.equal(formatEwtLabel(result.estimatedWaitMinutes), 'About 30 minutes to 1 hour');
  }

  // Scenario 4: Heavy Pile-Up (12 patients ahead)
  {
    const mockDb = createMockSupabase({ cubicles, patients: generateQueue(12) });
    const result = await computeEstimatedWaitMinutes(mockDb, service, nowIso);
    assert.equal(result.positionAhead, 12);
    // (12 / 2) * 15 + 5 = 95m
    assert.equal(result.estimatedWaitMinutes, 95);
    assert.equal(formatEwtLabel(result.estimatedWaitMinutes), 'About 1 to 2 hours');
  }

  // Scenario 5: Severe Pile-Up (20 patients ahead)
  {
    const mockDb = createMockSupabase({ cubicles, patients: generateQueue(20) });
    const result = await computeEstimatedWaitMinutes(mockDb, service, nowIso);
    assert.equal(result.positionAhead, 20);
    // (20 / 2) * 15 + 5 = 155m
    assert.equal(result.estimatedWaitMinutes, 155);
    assert.equal(formatEwtLabel(result.estimatedWaitMinutes), 'About 2 to 3 hours');
  }

  // Scenario 6: Extreme Pile-Up (28 patients ahead) -> Exceeds 3 hours
  {
    const mockDb = createMockSupabase({ cubicles, patients: generateQueue(28) });
    const result = await computeEstimatedWaitMinutes(mockDb, service, nowIso);
    assert.equal(result.positionAhead, 28);
    // (28 / 2) * 15 + 5 = 215m
    assert.equal(result.estimatedWaitMinutes, 215);
    assert.equal(formatEwtLabel(result.estimatedWaitMinutes), 'More than 3 hours');
    assert.equal(formatEwtReceiptLabel(result.estimatedWaitMinutes), '> 3 hours');
    assert.equal(formatEwtSmsLabel(result.estimatedWaitMinutes), 'higit sa 3 oras');
  }
});

test('Multi-Server Scaling: Adding open cubicles dynamically cuts wait time in half', async () => {
  const service = 'Consultation';
  const todayRange = manilaDayRange(Date.now());
  const nowIso = new Date(Date.parse(todayRange.start) + 4 * 3600000).toISOString();

  // 12 waiting patients
  const patients = [
    {
      id: 999,
      service,
      status: 'Done',
      is_historical: false,
      created_at: todayRange.start,
      consult_start: todayRange.start,
      consult_end: new Date(Date.parse(todayRange.start) + 15 * 60000).toISOString(),
    },
  ];
  for (let i = 1; i <= 12; i++) {
    patients.push({
      id: i,
      service,
      status: 'On Progress',
      is_historical: false,
      created_at: new Date(Date.parse(todayRange.start) + i * 60000).toISOString(),
    });
  }

  // 1 Single Cubicle open: (12 / 1) * 15 + 5 = 185m -> 185m rounded to 185
  const mockDb1 = createMockSupabase({
    cubicles: [{ id: 1, cubicleNum: 'C1', category: service, on_break: false }],
    patients,
  });
  const result1 = await computeEstimatedWaitMinutes(mockDb1, service, nowIso);
  assert.equal(result1.activeServers, 1);
  assert.equal(result1.estimatedWaitMinutes, 185);
  assert.equal(formatEwtLabel(result1.estimatedWaitMinutes), 'More than 3 hours');

  // 4 Cubicles open: (12 / 4) * 15 + 5 = 50m
  const mockDb4 = createMockSupabase({
    cubicles: [
      { id: 1, cubicleNum: 'C1', category: service, on_break: false },
      { id: 2, cubicleNum: 'C2', category: service, on_break: false },
      { id: 3, cubicleNum: 'C3', category: service, on_break: false },
      { id: 4, cubicleNum: 'C4', category: service, on_break: false },
    ],
    patients,
  });
  const result4 = await computeEstimatedWaitMinutes(mockDb4, service, nowIso);
  assert.equal(result4.activeServers, 4);
  assert.equal(result4.estimatedWaitMinutes, 50);
  assert.equal(formatEwtLabel(result4.estimatedWaitMinutes), 'About 30 minutes to 1 hour');
});

test('Status Isolation: Only active queue statuses count; Done, Idle, and Removed are excluded', async () => {
  const service = 'OPD Screening';
  const todayRange = manilaDayRange(Date.now());
  const nowIso = new Date(Date.parse(todayRange.start) + 4 * 3600000).toISOString();

  const patients = [
    // Completed patient so intake has started
    { id: 1, service, status: 'Done', is_historical: false, created_at: todayRange.start },
    // Active waiting patients
    { id: 2, service, status: 'On Progress', is_historical: false, created_at: todayRange.start },
    { id: 3, service, status: 'Waiting', is_historical: false, created_at: todayRange.start },
    { id: 4, service, status: 'Assigned', is_historical: false, created_at: todayRange.start },
    // Inactive or completed patients - MUST BE EXCLUDED
    { id: 5, service, status: 'Done', is_historical: false, created_at: todayRange.start },
    { id: 6, service, status: 'Idle', is_historical: false, created_at: todayRange.start },
    { id: 7, service, status: 'Removed', is_historical: false, created_at: todayRange.start },
    // Historical patient - MUST BE EXCLUDED
    { id: 8, service, status: 'On Progress', is_historical: true, created_at: todayRange.start },
    // Patient in different service - MUST BE EXCLUDED
    { id: 9, service: 'Pediatric Care', status: 'On Progress', is_historical: false, created_at: todayRange.start },
  ];

  const mockDb = createMockSupabase({
    cubicles: [{ id: 1, cubicleNum: 'C1', category: service, on_break: false }],
    patients,
  });

  const result = await computeEstimatedWaitMinutes(mockDb, service, nowIso);
  // Exactly 3 waiting patients ahead: IDs 2, 3, 4
  assert.equal(result.positionAhead, 3);
  // (3 / 1) * 15 + 5 = 50m
  assert.equal(result.estimatedWaitMinutes, 50);
});

test('Cold-Start vs Operational Buffer: 15m buffer applies before any patients are attended', async () => {
  const service = 'Cardiology';
  const nowIso = new Date().toISOString();

  // No patients have been seen today (no 'Done', 'With Doctor', or 'Carryout')
  const mockDbCold = createMockSupabase({
    cubicles: [{ id: 1, cubicleNum: 'C1', category: service, on_break: false }],
    patients: [
      { id: 1, service, status: 'On Progress', is_historical: false, created_at: nowIso },
    ],
  });

  const coldResult = await computeEstimatedWaitMinutes(mockDbCold, service, nowIso);
  // positionAhead = 0 (created_at < nowIso has 0), activeServers = 1, buffer = 15m (cold start)
  // (0 / 1) * 15 + 15 = 15m
  assert.equal(coldResult.estimatedWaitMinutes, 15);
});

test('Resilience: Database failure falls back gracefully to default duration without crashing', async () => {
  const mockDbError = createMockSupabase({ simulateError: true });
  const result = await computeEstimatedWaitMinutes(mockDbError, 'Emergency', new Date().toISOString());

  assert.equal(result.estimatedWaitMinutes, 15);
  assert.equal(result.positionAhead, 0);
  assert.equal(result.activeServers, 1);
  assert.equal(formatEwtLabel(result.estimatedWaitMinutes), 'About 10 to 30 minutes');
});
