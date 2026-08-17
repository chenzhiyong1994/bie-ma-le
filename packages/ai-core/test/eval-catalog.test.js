const test = require('node:test');
const assert = require('node:assert/strict');
const { listRoles } = require('../src/roles');
const { casesByRole, allCases } = require('../../../evals/role-evaluation-catalog');

test('keeps fifteen independent offline cases for every public role', () => {
  const ids = new Set();
  for (const role of listRoles()) {
    const cases = casesByRole[role.id];
    assert.equal(cases.length, 15, role.name);
    assert.deepEqual(
      Object.fromEntries(['critical', 'rebuilding', 'ready'].map((band) => [band, cases.filter((item) => item.expectedBand === band).length])),
      { critical: 5, rebuilding: 5, ready: 5 }
    );
    for (const item of cases) {
      assert.equal(ids.has(item.id), false, item.id);
      ids.add(item.id);
      assert.equal(item.materialText.length >= 80, true, item.id);
      assert.equal(typeof item.focus, 'string');
    }
  }
  assert.equal(allCases.length, 60);
});
