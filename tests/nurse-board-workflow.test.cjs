/** @fileoverview Shared-workstation clinical board preserves visible stages, patient actions and guarded transitions. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });

/** Loads production components against isolated JSX and event boundaries. */
function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Error, console,
    require(name) { assert.ok(name in mocks, name); return mocks[name]; } });
  return compiled.exports;
}

/** Finds elements in the real components' synthetic JSX output. */
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
const texts = { allMyCubicles: 'All My Cubicles', btnMoveHere: 'Move Here',
  btnCall: 'Call', btnWithDoctor: 'With Doctor', btnCarryout: 'Carryout', btnDone: 'Done' };

/** Renders the board with actual datasets and opaque stage components to inspect its public contracts. */
function board(props) {
  const mocks = { 'react/jsx-runtime': { jsx, jsxs: jsx }, react: {},
    '@/app/nurse/constants/nurse': { NurseStyle: { boardContainer: {} } },
    '@/app/nurse/constants/nurseTexts': { nurseTexts: texts },
    '@/app/nurse/components/StationOverview': { StationOverview: 'overview' } };
  for (const name of ['AssignedSection', 'WithDoctorSection', 'CarryoutSection']) {
    mocks['@/app/nurse/components/' + name] = { [name]: name };
  }
  const api = load('app/nurse/components/NurseBoard.tsx', mocks);
  return api.NurseBoard(props);
}
const patient = { id: 1, patientNum: 'TEST-1', cubicleNum: 'Cubicle 1' };
const base = { assignedPatients: [patient], withDoctorPatients: [{ id: 2, patientNum: 'TEST-2' }], carryoutPatients: [],
  selectedPatient: { patient }, dragOverStage: null, isStageValidTarget: () => false };

test('All three clinical stages stay visible with the original ordered patient lists', () => {
  const tree = board(base);
  const stages = find(tree, node => ['AssignedSection', 'WithDoctorSection', 'CarryoutSection'].includes(node.type));
  assert.deepEqual([...stages.map(node => node.type)], ['AssignedSection', 'WithDoctorSection', 'CarryoutSection']);
  assert.equal(stages[0].props.patients, base.assignedPatients);
  assert.equal(stages[1].props.patients, base.withDoctorPatients);
  assert.equal(stages[2].props.patients.length, 0);
  assert.ok(stages.every(stage => stage.props.selectedPatientId === 1));
});

test('Existing selection, calling, pointer and clinical transition callbacks pass straight through', () => {
  const call = () => {}; const pointer = () => {}; const select = () => {}; const advance = () => {}; const finish = () => {};
  const tree = board({ ...base, onCall: call, onPointerDown: pointer, onSelectPatient: select,
    onMoveToWithDoctor: advance, onFinish: finish });
  const waiting = find(tree, node => node.type === 'AssignedSection')[0];
  const carryout = find(tree, node => node.type === 'CarryoutSection')[0];
  assert.equal(waiting.props.onCall, call); assert.equal(waiting.props.onPointerDown, pointer);
  assert.equal(waiting.props.onSelectPatient, select); assert.equal(waiting.props.onMoveToWithDoctor, advance);
  assert.equal(carryout.props.onFinish, finish);
});

test('Only eligible clinical destinations offer selection moves and drag highlighting follows its own stage', () => {
  const moves = [];
  const tree = board({ ...base, dragOverStage: 'with_doctor', isStageValidTarget: stage => stage === 'with_doctor',
    onAssignSelectedToStage: stage => moves.push(stage) });
  const waiting = find(tree, node => node.type === 'AssignedSection')[0];
  const consultation = find(tree, node => node.type === 'WithDoctorSection')[0];
  assert.equal(waiting.props.isValidSelectionTarget, false); assert.equal(waiting.props.isDragOver, false);
  assert.equal(consultation.props.isValidSelectionTarget, true); assert.equal(consultation.props.isDragOver, true);
  consultation.props.onMoveHere(); assert.deepEqual(moves, ['with_doctor']);
});

test('Stage lists retain drop targets and directly render patients using the shared Transfer heading style', () => {
  const titleStyle = 'shared-transfer-heading'; const move = () => {};
  const api = load('app/nurse/components/StageColumn.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, react: {},
    '@/app/nurse/constants/nurse': { NurseStyle: { stageColumn: {}, stageColumnHeader: {}, stageColumnContent: {}, activeDropzone: {} } },
    '@/app/nurse/constants/nurseTexts': { nurseTexts: texts },
    '@/constants/designs/transferStyles': { cubicleStyles: { headerTitle: titleStyle, headerCountBadge: 'shared-count' } },
  });
  const tree = api.StageColumn({ stage: 'with_doctor', title: 'With Doctor', badgeColorClass: '',
    count: 1, children: 'patient-content', isValidSelectionTarget: true, onMoveHere: move });
  assert.equal(tree.props['data-stage-id'], 'with_doctor');
  assert.equal(find(tree, node => node.type === 'h2')[0].props.className, titleStyle);
  assert.equal(find(tree, node => node.type === 'button')[0].props.onClick, move);
  assert.ok(find(tree, node => node.props?.children === 'patient-content').length > 0);
});

test('Live transitions update the correct visible stage and totals without local focus or duplicate patient state', () => {
  const moved = board({ ...base, assignedPatients: [], withDoctorPatients: [patient], carryoutPatients: [] });
  assert.equal(find(moved, node => node.type === 'AssignedSection')[0].props.patients.length, 0);
  assert.equal(find(moved, node => node.type === 'WithDoctorSection')[0].props.patients[0].id, 1);
  const done = board({ ...base, assignedPatients: [], withDoctorPatients: [], carryoutPatients: [], finishedCount: 1 });
  const summary = find(done, node => node.type === 'overview')[0];
  assert.equal(summary.props.activeCount, 0); assert.equal(summary.props.finishedCount, 1);
});
