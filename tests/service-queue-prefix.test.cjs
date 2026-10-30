/**
 * @fileoverview Regression and integration tests for service queue prefix generation,
 * multi-character prefixes, digit padding, and kiosk ticket creation.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

/**
 * Pure simulator of the queue number generation logic matching PostgreSQL create_patient.
 *
 * @param {string} prefix - The ticket prefix (e.g. "67", "10", "LAB", "C").
 * @param {string[]} existingPatientNums - Array of existing patientNum values generated today.
 * @param {number} padLength - Configured digit padding length (default 3).
 * @returns {string} The formatted next ticket code.
 */
function simulateNextQueueNumber(prefix, existingPatientNums, padLength = 3) {
  const prefixStr = prefix || '';
  const prefixLen = prefixStr.length;

  let maxNum = 0;
  for (const pNum of existingPatientNums) {
    if (prefixLen > 0 && !pNum.startsWith(prefixStr)) continue;

    const suffix = pNum.slice(prefixLen);
    if (/^[0-9]+$/.test(suffix) && suffix.length <= 6) {
      const num = parseInt(suffix, 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const targetLen = Math.max(padLength, String(nextNum).length);
  return prefixStr + String(nextNum).padStart(targetLen, '0');
}

test('Multi-digit prefix (e.g. 67) increments sequentially without shifting digits or truncating', () => {
  const prefix = '67';
  const padLength = 3;

  // 1st ticket
  const ticket1 = simulateNextQueueNumber(prefix, [], padLength);
  assert.equal(ticket1, '67001');

  // 2nd ticket: Must NOT truncate into 67700 or shift 7 left
  const ticket2 = simulateNextQueueNumber(prefix, [ticket1], padLength);
  assert.equal(ticket2, '67002');
  assert.notEqual(ticket2, '67700');
  assert.notEqual(ticket2, '67770');

  // 3rd ticket
  const ticket3 = simulateNextQueueNumber(prefix, [ticket1, ticket2], padLength);
  assert.equal(ticket3, '67003');

  // Continues cleanly up to ticket 10
  const tickets = [ticket1, ticket2, ticket3];
  for (let i = 4; i <= 10; i++) {
    tickets.push(simulateNextQueueNumber(prefix, tickets, padLength));
  }
  assert.equal(tickets[9], '67010');
});

test('Alphanumeric and multi-digit prefixes (LAB, 10, OPD) generate valid ticket numbers', () => {
  assert.equal(simulateNextQueueNumber('LAB', []), 'LAB001');
  assert.equal(simulateNextQueueNumber('LAB', ['LAB001']), 'LAB002');

  assert.equal(simulateNextQueueNumber('10', []), '10001');
  assert.equal(simulateNextQueueNumber('10', ['10001']), '10002');

  assert.equal(simulateNextQueueNumber('C', []), 'C001');
  assert.equal(simulateNextQueueNumber('C', ['C001']), 'C002');
});

test('Custom queue_pad_length (e.g. 4) pads to configured length and prevents truncation on overflow', () => {
  assert.equal(simulateNextQueueNumber('67', [], 4), '670001');
  assert.equal(simulateNextQueueNumber('67', ['670001'], 4), '670002');

  // Overflow past padLength: If padLength is 3 and counter reaches 1000, must expand to 671000, never truncate to 67100
  const existing999 = ['67999'];
  assert.equal(simulateNextQueueNumber('67', existing999, 3), '671000');
  assert.notEqual(simulateNextQueueNumber('67', existing999, 3), '67100');
});

test('Live Database Verification: Service "Others" with prefix 67 generates sequential tickets', async (t) => {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    t.skip('Skipping live DB check: .env.local not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[match[1]] = val;
    }
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    t.skip('Skipping live DB check: missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const createdPatientIds = [];

  try {
    // 1. Invoke create_patient RPC for 'Others' (prefix 67)
    const { data: p1Data, error: p1Err } = await supabase.rpc('create_patient', {
      p_service: 'Others',
      p_subcategory: null,
      p_preferred_cubicles: null,
      p_prefix: '67',
      p_group_by_subcategory: false,
      p_phone: null,
    });
    assert.ifError(p1Err);
    assert.ok(p1Data && p1Data.length > 0);
    createdPatientIds.push(p1Data[0].id);
    assert.equal(p1Data[0].patientNum, '67001');

    // 2. 2nd patient: Must generate 67002, NOT 67700 or duplicate
    const { data: p2Data, error: p2Err } = await supabase.rpc('create_patient', {
      p_service: 'Others',
      p_subcategory: null,
      p_preferred_cubicles: null,
      p_prefix: '67',
      p_group_by_subcategory: false,
      p_phone: null,
    });
    assert.ifError(p2Err);
    assert.ok(p2Data && p2Data.length > 0);
    createdPatientIds.push(p2Data[0].id);
    assert.equal(p2Data[0].patientNum, '67002');
    assert.notEqual(p2Data[0].patientNum, '67700');

    // 3. 3rd patient: Must generate 67003, NOT 67770
    const { data: p3Data, error: p3Err } = await supabase.rpc('create_patient', {
      p_service: 'Others',
      p_subcategory: null,
      p_preferred_cubicles: null,
      p_prefix: '67',
      p_group_by_subcategory: false,
      p_phone: null,
    });
    assert.ifError(p3Err);
    assert.ok(p3Data && p3Data.length > 0);
    createdPatientIds.push(p3Data[0].id);
    assert.equal(p3Data[0].patientNum, '67003');

    // 4. Verify patient record can be retrieved cleanly for printing verification
    const { data: verifyRecord, error: verifyErr } = await supabase
      .from('patients')
      .select('id, patientNum, service, is_historical')
      .eq('id', createdPatientIds[1])
      .single();

    assert.ifError(verifyErr);
    assert.equal(verifyRecord.patientNum, '67002');
    assert.equal(verifyRecord.service, 'Others');
  } finally {
    if (createdPatientIds.length > 0) {
      await supabase.from('patients').delete().in('id', createdPatientIds);
    }
  }
});

test('Live Database Verification: Creating a brand new service with custom prefix and pad length validates output', async (t) => {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    t.skip('Skipping live DB check: .env.local not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[match[1]] = val;
    }
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    t.skip('Skipping live DB check: missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const testPrefix = `T${randomChar}`;
  const testServiceName = `Unique Service ${testPrefix}_${Date.now()}`;
  let createdServiceId = null;
  const createdPatientIds = [];

  try {
    // 1. Create new service with custom prefix and pad length 4
    const { data: service, error: svcErr } = await supabase
      .from('services')
      .insert([
        {
          label_en: testServiceName,
          label_fil: 'Bagong Serbisyo',
          icon_src: 'bx-plus-medical',
          display_order: 998,
          patient_type: 'both',
          queue_prefix: testPrefix,
          queue_pad_length: 4,
          show_on_monitor: false,
        },
      ])
      .select('id, label_en, queue_prefix, queue_pad_length')
      .single();

    assert.ifError(svcErr);
    assert.ok(service);
    createdServiceId = service.id;
    assert.equal(service.queue_prefix, testPrefix);
    assert.equal(service.queue_pad_length, 4);

    // 2. 1st ticket: Must respect queue_pad_length = 4 (e.g. Z40001)
    const { data: p1Data, error: p1Err } = await supabase.rpc('create_patient', {
      p_service: testServiceName,
      p_subcategory: null,
      p_preferred_cubicles: null,
      p_prefix: testPrefix,
      p_group_by_subcategory: false,
      p_phone: null,
    });
    assert.ifError(p1Err);
    createdPatientIds.push(p1Data[0].id);
    assert.equal(p1Data[0].patientNum, `${testPrefix}0001`);

    // 3. 2nd ticket: Must increment cleanly to 0002
    const { data: p2Data, error: p2Err } = await supabase.rpc('create_patient', {
      p_service: testServiceName,
      p_subcategory: null,
      p_preferred_cubicles: null,
      p_prefix: testPrefix,
      p_group_by_subcategory: false,
      p_phone: null,
    });
    assert.ifError(p2Err);
    createdPatientIds.push(p2Data[0].id);
    assert.equal(p2Data[0].patientNum, `${testPrefix}0002`);

    // 4. Verify patient record intake for printing
    const { data: verifyRecord, error: verifyErr } = await supabase
      .from('patients')
      .select('id, patientNum, service, is_historical')
      .eq('patientNum', `${testPrefix}0002`)
      .eq('is_historical', false)
      .single();

    assert.ifError(verifyErr);
    assert.equal(verifyRecord.patientNum, `${testPrefix}0002`);
    assert.equal(verifyRecord.service, testServiceName);
  } finally {
    if (createdPatientIds.length > 0) {
      await supabase.from('patients').delete().in('id', createdPatientIds);
    }
    if (createdServiceId) {
      await supabase.from('services').delete().eq('id', createdServiceId);
    }
  }
});
