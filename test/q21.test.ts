import { test, expect } from '@jest/globals';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps based on keywords', () => {
  const text =
    'The equation F = ma was derived with rigorous analysis and ethical oversight.';
  const result = evaluateQN21(text);

  expect(result.length).toBe(QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  expect(equations).toBeTruthy();
  expect(equations?.score).toBe(8);
  expect(equations?.gap).toBe(0);

  const rigor = result.find((r) => r.code === 'rigor');
  expect(rigor).toBeTruthy();
  expect(rigor?.score).toBe(6);
  expect(rigor?.gap).toBe(0);

  const ethics = result.find((r) => r.code === 'ethics');
  expect(ethics).toBeTruthy();
  expect(ethics?.score).toBe(8);
  expect(ethics?.gap).toBe(0);

  const safety = result.find((r) => r.code === 'safety');
  expect(safety).toBeTruthy();
  expect(safety?.score).toBe(0);
  expect(safety?.gap).toBe(5);
});

test('evaluateQN21 handles partial criteria in text', () => {
  const text =
    'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
  const result = evaluateQN21(text);

  const calibration = result.find((r) => r.code === 'calibration');
  expect(calibration).toBeTruthy();
  expect(calibration?.score).toBe(3);

  const reproducibility = result.find((r) => r.code === 'reproducibility');
  expect(reproducibility).toBeTruthy();
  expect(reproducibility?.score).toBe(0);

  const engagement = result.find((r) => r.code === 'engagement');
  expect(engagement).toBeTruthy();
  expect(engagement?.score).toBe(5);
});

test('summarizeQN21 computes percentage and classification', () => {
  const text = QN21_CRITERIA.slice(0, 17)
    .map((c) => c.keywords[0])
    .join(' ');
  const result = evaluateQN21(text);
  const summary = summarizeQN21(result);
  expect(summary.total).toBe(17);
  expect(summary.max).toBe(QN21_CRITERIA.length);
  expect(summary.percentage > 80).toBeTruthy();
  expect(summary.classification).toBe('accepted');
});

