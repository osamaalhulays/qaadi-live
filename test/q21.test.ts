import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps for all criteria', () => {
  const text = 'equations ethics';
  const result = evaluateQN21(text);

  expect(result).toHaveLength(QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  expect(equations).toBeTruthy();
  expect(equations?.score).toBe(8);
  expect(equations?.gap).toBe(0);

  const ethics = result.find((r) => r.code === 'ethics');
  expect(ethics).toBeTruthy();
  expect(ethics?.score).toBe(8);
  expect(ethics?.gap).toBe(0);

  const rigor = result.find((r) => r.code === 'rigor');
  expect(rigor).toBeTruthy();
  expect(rigor?.score).toBe(0);
  expect(rigor?.gap).toBe(6);
});

test('summarizeQN21 computes percentage and classification', () => {
  const text = QN21_CRITERIA.slice(0, 18).map((c) => c.code).join(' ');
  const result = evaluateQN21(text);
  const summary = summarizeQN21(result);
  const expectedTotal = QN21_CRITERIA.slice(0, 18).reduce((sum, c) => sum + c.weight, 0);
  const expectedMax = QN21_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
  expect(summary.total).toBe(expectedTotal);
  expect(summary.max).toBe(expectedMax);
  expect(summary.percentage).toBeGreaterThan(80);
  expect(summary.classification).toBe('accepted');
});

