import assert from 'node:assert';
import {
  loadCriteria,
  addCriterion,
  updateCriterion,
  deleteCriterion,
  evaluateCriteria
} from '../src/lib/criteria';
import { runJudge } from '../src/lib/workers/judge';

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

  const judge = await runJudge('foo equation');
  const jCrit = judge.criteria.find((c: any) => c.name === 'Test criterion');
  assert.ok(jCrit);
  assert.strictEqual(jCrit.score, 2);
  const jCustom = judge.custom.find((c: any) => c.id === 'TST');
  assert.ok(jCustom);
  assert.strictEqual(jCustom.score, 2);
  const qn = judge.criteria.find((c: any) => c.name === 'Equation accuracy');
  assert.ok(qn && qn.score > 0);

  await updateCriterion('TST', { enabled: false });
  criteria = await loadCriteria();
  result = evaluateCriteria('foo', criteria);
  crit = result.find((c) => c.id === 'TST');
  assert.ok(crit);
  assert.strictEqual(crit?.score, 0);
  const judge2 = await runJudge('foo equation');
  const jCrit2 = judge2.criteria.find((c: any) => c.name === 'Test criterion');
  assert.ok(jCrit2);
  assert.strictEqual(jCrit2.score, 0);
  const jCustom2 = judge2.custom.find((c: any) => c.id === 'TST');
  assert.ok(jCustom2);
  assert.strictEqual(jCustom2.score, 0);

  await deleteCriterion('TST');
  const end = await loadCriteria();
  assert.deepStrictEqual(end, start);
});
