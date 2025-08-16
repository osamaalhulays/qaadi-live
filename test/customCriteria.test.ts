import test from 'node:test';
import assert from 'node:assert';
import {
  loadCriteria,
  addCriterion,
  updateCriterion,
  deleteCriterion,
  evaluateCriteria
} from '../src/lib/criteria';

test('CRUD and evaluation for custom criteria', async () => {
  const start = await loadCriteria();
  await addCriterion({
    id: 'TST',
    description: 'Test criterion',
    weight: 2,
    keywords: ['foo'],
    enabled: true
  });
  let criteria = await loadCriteria();
  let result = evaluateCriteria('foo', criteria);
  let crit = result.find((c) => c.id === 'TST');
  assert.ok(crit);
  assert.strictEqual(crit?.score, 2);

  await updateCriterion('TST', { enabled: false });
  criteria = await loadCriteria();
  result = evaluateCriteria('foo', criteria);
  crit = result.find((c) => c.id === 'TST');
  assert.ok(crit);
  assert.strictEqual(crit?.score, 0);

  await deleteCriterion('TST');
  const end = await loadCriteria();
  assert.deepStrictEqual(end, start);
});
