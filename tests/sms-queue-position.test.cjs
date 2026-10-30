/** @fileoverview Station-specific SMS ranks, rotation ordering, ordinal wording and read-only snapshots. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads the actual rules and server reader without a database connection or SMS gateway. */
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return compiled.exports;
}
const rules = load('lib/sms/queuePosition.ts');
const ranges = load('utils/manilaDayRange.ts');

/** Returns a synthetic registration ticket with a stable ordering timestamp. */
function entry(id, fields = {}) {
  return { id, patientNum: `TEST-${id}`, is_historical: false, status: 'On Progress', counter: 2, cubicleNum: null,
    reg_end: null, called_at: null, created_at: `2026-10-30T00:00:${String(id).padStart(2, '0')}Z`,
    counter_rejoin_at: null, queue_position: id, ...fields };
}

test('Fifth at a counter means four tickets ahead in that counter, excluding other lanes and inactive tickets', () => {
  const rows = Array.from({ length: 5 }, (_, index) => entry(index + 1));
  const target = rows[4];
  rows.push(entry(6, { counter: 1 }), entry(7, { status: 'Idle' }), entry(8, { status: 'Removed' }),
    entry(9, { status: 'Done' }), entry(10, { reg_end: '2026-10-30T00:01:00Z' }));
  const result = rules.rankSmsQueue({ target, rows });
  assert.equal(result.position, 5); assert.equal(result.aheadCount, 4); assert.equal(result.destination, 'Counter 2');
  assert.equal(rules.smsQueuePositionText(result), 'You are 5th in line at Counter 2 (4 ahead).');
});

test('Counter rotation rejoin time determines the rank without altering the queue', () => {
  const rotated = entry(1, { counter_rejoin_at: '2026-10-30T00:02:00Z' });
  const rows = [rotated, entry(2), entry(3)]; const before = JSON.stringify(rows);
  assert.equal(rules.rankSmsQueue({ target: rotated, rows }).position, 3);
  assert.equal(JSON.stringify(rows), before);
});

test('Cubicle ranks follow assigned call order and exclude active consultations, other cubicles and completed tickets', () => {
  const first = entry(1, { status: 'Assigned', cubicleNum: 'Consultation R1 C1', reg_end: '2026-10-30T00:00:00Z', called_at: '2026-10-30T00:01:00Z' });
  const second = { ...first, id: 2, called_at: '2026-10-30T00:02:00Z' };
  const result = rules.rankSmsQueue({ target: second, rows: [second, { ...first, id: 3, status: 'With Doctor' },
    { ...first, id: 4, cubicleNum: 'Consultation R1 C2' }, { ...first, id: 5, status: 'Done' }, first] });
  assert.equal(result.position, 2); assert.equal(result.destination, 'Consultation R1 C1');
});

test('Ordinals handle the teens correctly, while unassigned or moved tickets have no invented position', () => {
  for (const [position, ordinal] of [[1, '1st'], [2, '2nd'], [3, '3rd'], [5, '5th'], [11, '11th'], [12, '12th'],
    [13, '13th'], [21, '21st'], [22, '22nd'], [23, '23rd'], [111, '111th']]) {
    assert.ok(rules.smsQueuePositionText({ position, destination: 'Counter 2' }).includes(ordinal));
  }
  assert.equal(rules.smsQueuePositionText(null), '');
  assert.equal(rules.rankSmsQueue({ target: entry(1, { counter: null }), rows: [entry(1)] }), null);
  assert.equal(rules.rankSmsQueue({ target: entry(1), rows: [entry(1, { counter: 3 })] }), null);
});

/** Provides a read-only relational double with observable date, station and historical filters. */
function reader({ rows, rejected = false, moveBeforeRoster = false, truncated = false }) {
  const queries = []; let readCount = 0;
  const client = { from: table => {
    assert.equal(table, 'patients'); readCount++;
    if (moveBeforeRoster && readCount === 2) rows.find(row => row.id === 5).counter = 3;
    const filters = []; let take = Infinity; let columns; let descending = false;
    const result = () => {
      let selected = rows.filter(row => filters.every(filter => filter(row)));
      if (descending) selected = [...selected].sort((first, second) => Date.parse(second.created_at) - Date.parse(first.created_at));
      return { data: selected.slice(0, truncated && readCount === 2 ? 3 : take), count: selected.length,
        error: rejected ? { message: 'private diagnostic' } : null };
    };
    const query = {
      select(value) { columns = value; return this; },
      eq(field, value) { filters.push(row => row[field] === value); return this; },
      is(field, value) { filters.push(row => row[field] === value); return this; },
      in(field, values) { filters.push(row => values.includes(row[field])); return this; },
      gte(field, value) { filters.push(row => row[field] >= value); return this; },
      lt(field, value) { filters.push(row => row[field] < value); return this; },
      order(_field, options) { descending = options.ascending === false; return this; },
      limit(value) { take = value; return this; },
      async maybeSingle() { const value = result(); return { ...value, data: value.data[0] ?? null }; },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    queries.push(() => columns);
    return query;
  } };
  const api = load('lib/sms/readQueuePosition.ts', { '@/lib/supabase/admin': { createAdminClient: () => client },
    '@/utils/manilaDayRange': ranges, '@/lib/sms/queuePosition': rules });
  return { api, queries };
}

test('Server rank uses today in Manila, excludes historical records, and never requests contact or name fields', async () => {
  const rows = Array.from({ length: 5 }, (_, index) => entry(index + 1));
  rows.push(entry(6, { is_historical: true }), entry(7, { created_at: '2026-10-29T15:59:59Z' }),
    entry(8, { created_at: '2026-10-30T16:00:00Z' }));
  const fixture = reader({ rows });
  const result = await fixture.api.readSmsQueuePosition({ patientId: 5, patientNum: 'TEST-5', nowMs: Date.parse('2026-10-30T12:00:00Z') });
  assert.equal(result.ok, true); assert.equal(result.position.position, 5);
  for (const fields of fixture.queries.map(query => query())) {
    assert.ok(!fields.includes('phone')); assert.ok(!fields.includes('name'));
  }
});

test('Database failures and station moves cannot produce a misleading rank', async () => {
  const failed = reader({ rows: [entry(1)], rejected: true });
  const error = await failed.api.readSmsQueuePosition({ patientId: 1, patientNum: 'TEST-1', nowMs: Date.parse('2026-10-30T12:00:00Z') });
  assert.equal(error.ok, false); assert.ok(!error.error.includes('private'));
  const moved = reader({ rows: Array.from({ length: 5 }, (_, index) => entry(index + 1)), moveBeforeRoster: true });
  const result = await moved.api.readSmsQueuePosition({ patientId: 5, patientNum: 'TEST-5', nowMs: Date.parse('2026-10-30T12:00:00Z') });
  assert.equal(result.ok, true); assert.equal(result.position, null);
});

test('Reused ticket numbers resolve by patient ID and incomplete rosters never produce a guessed rank', async () => {
  const rows = Array.from({ length: 5 }, (_, index) => entry(index + 1));
  rows.push(entry(11, { patientNum: 'TEST-5', counter: 1 }));
  const fixture = reader({ rows });
  const options = { patientId: 5, patientNum: 'TEST-5', nowMs: Date.parse('2026-10-30T12:00:00Z') };
  const result = await fixture.api.readSmsQueuePosition(options);
  assert.equal(result.ok, true); assert.equal(result.position.position, 5); assert.equal(result.position.destination, 'Counter 2');
  const limited = await reader({ rows, truncated: true }).api.readSmsQueuePosition(options);
  assert.equal(limited.ok, false);
});
