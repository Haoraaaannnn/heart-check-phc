/** @fileoverview Browser display persistence, validation and public-display isolation contracts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Loads production components without database access or a real authenticated account. */
function load(file, mocks = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports,
    require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return compiled.exports;
}
const rules = load('lib/displayPreferences.ts');
const jsx = (type, props) => ({ type, props });

test('Display settings cover staff pages and explicitly exclude every kiosk and monitor route', () => {
  for (const route of ['/kiosk', '/kiosk/pages/sms-input', '/kiosk/slideshow', '/monitor', '/monitor/consultation']) {
    assert.equal(rules.allowsDisplayPreferences(route), false);
  }
  for (const route of ['/login', '/select-screen', '/nurse', '/transfer', '/dashboard/pages/patients', '/superadmin']) {
    assert.equal(rules.allowsDisplayPreferences(route), true);
  }
});

test('Corrupt storage and arbitrary CSS values cannot inject unsafe text or page scales', () => {
  for (const stored of [null, '{bad-json', 'null', '[]', '{"fontPercent":"150","zoomPercent":9999}', '{"fontPercent":0,"zoomPercent":"url(private)"}']) {
    assert.equal(JSON.stringify(rules.readDisplayPreferences(stored)), '{"fontPercent":100,"zoomPercent":100}');
  }
  assert.equal(JSON.stringify(rules.readDisplayPreferences('{"fontPercent":125,"zoomPercent":80}')), '{"fontPercent":125,"zoomPercent":80}');
});

/** Runs the actual provider's effects and updates with browser storage and route-change doubles. */
function provider({ blockedStorage = false } = {}) {
  let pathname = '/transfer'; let layoutEffect; let layoutCleanup; let previousDeps; let subscribed = false;
  const values = new Map([[rules.DISPLAY_STORAGE_KEY, '{"fontPercent":125,"zoomPercent":90}']]);
  const root = { dataset: {}, style: { fontSize: '', zoom: '',
    setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } } };
  const listeners = {};
  const storage = { getItem(key) { if (blockedStorage) throw new Error('Blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (blockedStorage) throw new Error('Blocked'); values.set(key, value); } };
  const browserWindow = { localStorage: storage, addEventListener: (key, handler) => { listeners[key] = handler; }, removeEventListener() {} };
  const store = load('lib/displayPreferenceStore.ts', { './displayPreferences': rules }, { window: browserWindow });
  const api = load('components/display/DisplayPreferencesProvider.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: {
      createContext: () => ({ Provider: 'provider' }), useContext() {},
      useSyncExternalStore(subscribe, getSnapshot) { if (!subscribed) { subscribed = true; subscribe(() => {}); } return getSnapshot(); },
      useLayoutEffect(effect, deps) {
        if (previousDeps && deps.every((value, index) => value === previousDeps[index])) return;
        layoutCleanup?.(); layoutEffect = effect; previousDeps = deps;
      },
    },
    'next/navigation': { usePathname: () => pathname }, '@/lib/displayPreferences': rules,
    '@/lib/displayPreferenceStore': store,
    './DisplaySettingsButton': { DisplaySettingsButton: 'display-button' },
  }, { document: { documentElement: root }, window: browserWindow });
  return { root, values, listeners, render(route = pathname) {
    pathname = route; const tree = api.DisplayPreferencesProvider({ children: 'page' });
    if (layoutEffect) { const effect = layoutEffect; layoutEffect = null; layoutCleanup = effect(); }
    return tree.props.value;
  } };
}

test('Saved settings apply to staff pages, persist changes, reset, and synchronize other tabs', () => {
  const app = provider(); app.render(); let context = app.render();
  assert.equal(app.root.style.fontSize, '125%'); assert.equal(app.root.style.zoom, '0.9');
  context.update({ fontPercent: 150, zoomPercent: 125 }); context = app.render();
  assert.equal(app.root.style.zoom, '1.25'); assert.equal(app.root.dataset.staffPageScale, '1.25');
  assert.equal(app.values.get(rules.DISPLAY_STORAGE_KEY), '{"fontPercent":150,"zoomPercent":125}');
  app.listeners.storage({ key: rules.DISPLAY_STORAGE_KEY, newValue: '{"fontPercent":110,"zoomPercent":80}' });
  context = app.render(); assert.equal(app.root.style.fontSize, '110%'); assert.equal(app.root.style.zoom, '0.8');
  context.update(rules.DEFAULT_DISPLAY_PREFERENCES); app.render();
  assert.equal(app.root.style.fontSize, '100%'); assert.equal(app.root.style.zoom, '1');
});

test('Public route transitions restore original sizing before paint and retain staff preferences for return', () => {
  const app = provider(); app.render(); app.render();
  for (const route of ['/kiosk/pages/kiosk-services', '/monitor/consultation']) {
    app.render(route); assert.equal(app.root.style.fontSize, ''); assert.equal(app.root.style.zoom, '');
    assert.equal(app.root.dataset.staffDisplay, undefined); assert.equal(app.root.dataset.staffPageScale, undefined);
  }
  app.render('/nurse'); assert.equal(app.root.style.fontSize, '125%'); assert.equal(app.root.style.zoom, '0.9');
});

test('Blocked browser storage does not prevent adjustment and is reported honestly', () => {
  const app = provider({ blockedStorage: true }); app.render(); let context = app.render();
  assert.equal(context.storageAvailable, false);
  context.update({ fontPercent: 150, zoomPercent: 80 }); context = app.render();
  assert.equal(app.root.style.fontSize, '150%'); assert.equal(app.root.style.zoom, '0.8'); assert.equal(context.storageAvailable, false);
});

test('Text and page zoom are independent accessible controls with a working reset', () => {
  const changes = [];
  const api = load('components/display/DisplaySettingsCard.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, '@/lib/displayPreferences': rules,
    './DisplayPreferencesProvider': { useDisplayPreferences: () => ({ preferences: { fontPercent: 100, zoomPercent: 90 },
      storageAvailable: true, update: value => changes.push(value) }) },
  });
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    return node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
  }
  const tree = nodes(api.DisplaySettingsCard()); const selects = tree.filter(node => node.type === 'select');
  assert.equal(selects.length, 2);
  selects[0].props.onChange({ target: { value: '150' } }); assert.equal(changes[0].zoomPercent, 90);
  selects[1].props.onChange({ target: { value: '80' } }); assert.equal(changes[1].fontPercent, 100);
  tree.find(node => node.type === 'button').props.onClick(); assert.equal(changes.at(-1).zoomPercent, 100);
});

test('Pointer previews use a bounded scale while hit-testing keeps original viewport coordinates', () => {
  for (const [value, expected] of [['1.25', 1.25], ['0.8', 0.8], [undefined, 1], ['0', 1], ['malformed', 1]]) {
    const api = load('lib/displayPreferences.ts', {}, { document: { documentElement: { dataset: { staffPageScale: value } } } });
    assert.equal(api.staffPageScale(), expected);
    assert.equal((400 / api.staffPageScale()) * api.staffPageScale(), 400);
  }
});

test('Both operational drag previews compensate for page zoom without changing the patient movement coordinates', () => {
  for (const [file, name, extras] of [
    ['app/transfer/components/DragGhost.tsx', 'DragGhost', { '@/constants/designs/transferStyles': { dragGhostStyles: {} } }],
    ['app/nurse/components/NurseDragGhost.tsx', 'NurseDragGhost', { '@/app/nurse/constants/nurseTexts': { nurseTexts: {} } }],
  ]) {
    const api = load(file, { 'react/jsx-runtime': { jsx, jsxs: jsx }, react: { useState: () => [true, () => {}], useEffect() {} },
      'react-dom': { createPortal: node => node }, '@/lib/displayPreferences': { staffPageScale: () => 1.25 }, ...extras },
    { document: { body: {} } });
    const point = { x: 400, y: 200 };
    const tree = api[name]({ point, patient: { id: 1, patientNum: 'TEST-1', service: 'Consultation' } });
    assert.equal(tree.props.style.left, '320px'); assert.equal(tree.props.style.top, '160px');
    assert.equal(point.x, 400); assert.equal(point.y, 200);
  }
});
