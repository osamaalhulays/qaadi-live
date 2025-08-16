import { test, expect } from '@jest/globals';
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
  expect(crit).toBeTruthy();
  expect(crit?.score).toBe(2);

  await updateCriterion('TST', { enabled: false });
  criteria = await loadCriteria();
  result = evaluateCriteria('foo', criteria);
  crit = result.find((c) => c.id === 'TST');
  expect(crit).toBeTruthy();
  expect(crit?.score).toBe(0);

  await deleteCriterion('TST');
  const end = await loadCriteria();
  expect(end).toEqual(start);
});
