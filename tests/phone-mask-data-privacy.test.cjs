/**
 * @fileoverview Unit and regression tests for client-safe phone privacy masking (RA 10173).
 *
 * Verifies that all mobile numbers, international formats, encrypted tokens, and incomplete
 * digits are safely masked before rendering on administrative and workstation client screens.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Transpiles and loads a TypeScript module in an isolated VM context. */
function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, {
    module: compiled,
    exports: compiled.exports,
    Date,
    Error,
    Buffer,
    console: { log() {}, warn() {}, error() {} },
  });
  return compiled.exports;
}

const { maskPhoneDisplay } = load('utils/phoneMask.ts');

test('maskPhoneDisplay masks standard 11-digit Philippine mobile numbers', () => {
  assert.equal(maskPhoneDisplay('09171234567'), '0917 •••• 567');
  assert.equal(maskPhoneDisplay('09998765432'), '0999 •••• 432');
  assert.equal(maskPhoneDisplay('09123456789'), '0912 •••• 789');
});

test('maskPhoneDisplay masks international 12-digit +63 format mobile numbers', () => {
  assert.equal(maskPhoneDisplay('+639171234567'), '+63 917 •••• 567');
  assert.equal(maskPhoneDisplay('639171234567'), '+63 917 •••• 567');
});

test('maskPhoneDisplay masks 10-digit without leading zero', () => {
  assert.equal(maskPhoneDisplay('9171234567'), '0917 •••• 567');
});

test('maskPhoneDisplay safely obscures AES-256-GCM ciphertext tokens (enc:v1:)', () => {
  assert.equal(
    maskPhoneDisplay('enc:v1:iv_sample:auth_tag_sample:ciphertext_sample'),
    'Protected'
  );
  assert.equal(maskPhoneDisplay('enc:v1:9823472098410298'), 'Protected');
});

test('maskPhoneDisplay respects already masked phone strings without re-mangling', () => {
  assert.equal(maskPhoneDisplay('0917 •••• 567'), '0917 •••• 567');
});

test('maskPhoneDisplay handles null, undefined, empty string, and zero fallback', () => {
  assert.equal(maskPhoneDisplay(null), 'None');
  assert.equal(maskPhoneDisplay(undefined), 'None');
  assert.equal(maskPhoneDisplay(''), 'None');
  assert.equal(maskPhoneDisplay('0'), 'None');
  assert.equal(maskPhoneDisplay(null, '---'), '---');
  assert.equal(maskPhoneDisplay('', 'Protected'), 'Protected');
});

test('maskPhoneDisplay handles arbitrary strings and numeric inputs safely', () => {
  assert.equal(maskPhoneDisplay(9171234567), '0917 •••• 567');
  assert.equal(maskPhoneDisplay('1234567'), '123 •••• 567');
  assert.equal(maskPhoneDisplay('123'), '••••');
});
