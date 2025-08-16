import { test, expect } from '@jest/globals';
import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps based on patterns', () => {
  const text =
    'The equation F = ma was derived with rigorous analysis and ethical oversight.';
  const result = evaluateQN21(text);

  expect(result.length).toBe(QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  expect(equations).toBeDefined();
  expect(equations?.score).toBe(8);
  expect(equations?.gap).toBe(0);

  const rigor = result.find((r) => r.code === 'rigor');
  expect(rigor).toBeDefined();
  expect(rigor?.score).toBe(6);
  expect(rigor?.gap).toBe(0);

  const ethics = result.find((r) => r.code === 'ethics');
  expect(ethics).toBeDefined();
  expect(ethics?.score).toBe(8);
  expect(ethics?.gap).toBe(0);

  const safety = result.find((r) => r.code === 'safety');
  expect(safety).toBeDefined();
  expect(safety?.score).toBe(0);
  expect(safety?.gap).toBe(5);
});

test('evaluateQN21 detects uppercase and mixed-case indicators', () => {
  const text =
    'The EQUATION F = ma was DErIvEd with eThIcAL oversight.';
  const result = evaluateQN21(text);

  const equations = result.find((r) => r.code === 'equations');
  expect(equations).toBeDefined();
  expect(equations?.score).toBe(8);

  const rigor = result.find((r) => r.code === 'rigor');
  expect(rigor).toBeDefined();
  expect(rigor?.score).toBe(6);

  const ethics = result.find((r) => r.code === 'ethics');
  expect(ethics).toBeDefined();
  expect(ethics?.score).toBe(8);
});

test('evaluateQN21 handles partial criteria in text', () => {
  const text =
    'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
  const result = evaluateQN21(text);

  const calibration = result.find((r) => r.code === 'calibration');
  expect(calibration).toBeDefined();
  expect(calibration?.score).toBe(3);

  const reproducibility = result.find((r) => r.code === 'reproducibility');
  expect(reproducibility).toBeDefined();
  expect(reproducibility?.score).toBe(0);

  const engagement = result.find((r) => r.code === 'engagement');
  expect(engagement).toBeDefined();
  expect(engagement?.score).toBe(5);
});

test('summarizeQN21 computes totals, max, percentage, and classification', () => {
  const results = [
    { ...QN21_CRITERIA[0], score: QN21_CRITERIA[0].weight, gap: 0 },
    { ...QN21_CRITERIA[1], score: QN21_CRITERIA[1].weight, gap: 0 },
    { ...QN21_CRITERIA[2], score: 0, gap: QN21_CRITERIA[2].weight },
  ];
  const summary = summarizeQN21(results);
  const expectedTotal = QN21_CRITERIA[0].weight + QN21_CRITERIA[1].weight;
  const expectedMax =
    QN21_CRITERIA[0].weight +
    QN21_CRITERIA[1].weight +
    QN21_CRITERIA[2].weight;
  expect(summary.total).toBe(expectedTotal);
  expect(summary.max).toBe(expectedMax);
  expect(summary.percentage).toBe((expectedTotal / expectedMax) * 100);
  expect(summary.classification).toBe('needs_improvement');
});
