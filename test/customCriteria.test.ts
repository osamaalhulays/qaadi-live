import { test, expect } from '@jest/globals';
import {
  loadCriteria,
  addCriterion,
  updateCriterion,
  deleteCriterion,
  evaluateCriteria,
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
  expect(crit).toBeTruthy();
  expect(crit?.score).toBe(2);

  const judge = await runJudge('foo equation');
  const jCrit = judge.criteria.find((c: any) => c.name === 'Test criterion');
  expect(jCrit).toBeTruthy();
  expect(jCrit?.score).toBe(2);
  const qn = judge.criteria.find((c: any) => c.name === 'Equation accuracy');
  expect(qn && qn.score > 0).toBe(true);

  await updateCriterion('TST', { enabled: false });
  criteria = await loadCriteria();
  result = evaluateCriteria('foo', criteria);
  crit = result.find((c) => c.id === 'TST');
  expect(crit).toBeTruthy();
  expect(crit?.score).toBe(0);

  const judge2 = await runJudge('foo equation');
  const jCrit2 = judge2.criteria.find((c: any) => c.name === 'Test criterion');
  expect(jCrit2).toBeTruthy();
  expect(jCrit2?.score).toBe(0);

  await deleteCriterion('TST');
  const end = await loadCriteria();
  expect(end).toEqual(start);
});
