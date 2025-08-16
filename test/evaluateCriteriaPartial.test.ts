import assert from 'node:assert';
import { evaluateCriteria, Criterion } from '../src/lib/criteria';

test('evaluateCriteria returns partial scores and handles mismatches', () => {
  const criteria: Criterion[] = [
    {
      id: 'P',
      description: 'Partial coverage',
      weight: 9,
      keywords: ['alpha', 'beta', 'gamma'],
      enabled: true,
      category: 'advisory',
      version: 1,
    },
    {
      id: 'N',
      description: 'No match',
      weight: 4,
      keywords: ['delta'],
      enabled: true,
      category: 'advisory',
      version: 1,
    },
  ];

  const text = 'alpha and gamma were mentioned';
  const result = evaluateCriteria(text, criteria);

  const partial = result.find((r) => r.id === 'P');
  assert.ok(partial);
  // Two of three keywords matched -> 2/3 of weight 9 = 6
  assert.strictEqual(partial?.score, 6);
  assert.strictEqual(partial?.gap, 3);

  const none = result.find((r) => r.id === 'N');
  assert.ok(none);
  assert.strictEqual(none?.score, 0);
  assert.strictEqual(none?.gap, 4);
});
