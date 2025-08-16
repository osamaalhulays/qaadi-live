import { test, expect } from '@jest/globals';
import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns partial scores based on indicator coverage', () => {
  const text =
    'The equation F = ma [1] was derived with rigorous analysis and ethical oversight.';
  const result = evaluateQN21(text);

  const sigma = result.find((r) => r.code === 'Σ');
  expect(sigma).toBeDefined();
  expect(sigma?.score).toBeCloseTo(6.4);
  expect(sigma?.gap).toBeCloseTo(1.6);

  const delta = result.find((r) => r.code === 'Δ');
  expect(delta).toBeDefined();
  expect(delta?.score).toBeCloseTo(4);
  expect(delta?.gap).toBeCloseTo(2);

  const theta = result.find((r) => r.code === 'Θ');
  expect(theta).toBeDefined();
  expect(theta?.score).toBeCloseTo(8 / 3);
  expect(theta?.gap).toBeCloseTo(16 / 3);

  const phi = result.find((r) => r.code === 'Φ');
  expect(phi).toBeDefined();
  expect(phi?.score).toBe(0);
  expect(phi?.gap).toBe(5);
});

test('evaluateQN21 handles partial coverage and mismatches', () => {
  const text =
    'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
  const result = evaluateQN21(text);

  const kappa = result.find((r) => r.code === 'Κ');
  expect(kappa).toBeDefined();
  expect(kappa?.score).toBeCloseTo(1);
  expect(kappa?.gap).toBeCloseTo(2);

  const rho = result.find((r) => r.code === 'Ρ');
  expect(rho).toBeDefined();
  expect(rho?.score).toBe(0);
  expect(rho?.gap).toBe(5);

  const beta = result.find((r) => r.code === 'Β');
  expect(beta).toBeDefined();
  expect(beta?.score).toBeCloseTo(5 * (2 / 3));
});

test('summarizeQN21 computes percentage and classification', () => {
  const c1 = QN21_CRITERIA[0];
  const c2 = QN21_CRITERIA[1];
  const results = [
    { ...c1, score: 8, gap: 0 },
    { ...c2, score: 5, gap: 1 },
  ];
  const summary = summarizeQN21(results);
  expect(summary.total).toBe(13);
  expect(summary.max).toBe(14);
  expect(summary.percentage).toBeCloseTo((13 / 14) * 100);
  expect(summary.classification).toBe('accepted');
});

