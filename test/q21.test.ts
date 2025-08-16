import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns partial scores based on indicator coverage', () => {
  const text =
    'The equation F = ma [1] was derived with rigorous analysis and ethical oversight.';
  const result = evaluateQN21(text);

  const sigma = result.find((r) => r.code === 'Σ');
  assert.ok(sigma);
  assert.ok(Math.abs((sigma?.score ?? 0) - 6.4) < 1e-6);
  assert.ok(Math.abs((sigma?.gap ?? 0) - 1.6) < 1e-6);

  const delta = result.find((r) => r.code === 'Δ');
  assert.ok(delta);
  assert.ok(Math.abs((delta?.score ?? 0) - 4) < 1e-6);
  assert.ok(Math.abs((delta?.gap ?? 0) - 2) < 1e-6);

  const theta = result.find((r) => r.code === 'Θ');
  assert.ok(theta);
  assert.ok(Math.abs((theta?.score ?? 0) - 8 / 3) < 1e-6);
  assert.ok(Math.abs((theta?.gap ?? 0) - (16 / 3)) < 1e-6);

  const phi = result.find((r) => r.code === 'Φ');
  assert.ok(phi);
  assert.strictEqual(phi?.score, 0);
  assert.strictEqual(phi?.gap, 5);
});

test('evaluateQN21 handles partial coverage and mismatches', () => {
  const text =
    'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
  const result = evaluateQN21(text);

  const kappa = result.find((r) => r.code === 'Κ');
  assert.ok(kappa);
  assert.ok(Math.abs((kappa?.score ?? 0) - 1) < 1e-6);
  assert.ok(Math.abs((kappa?.gap ?? 0) - 2) < 1e-6);

  const rho = result.find((r) => r.code === 'Ρ');
  assert.ok(rho);
  assert.strictEqual(rho?.score, 0);
  assert.strictEqual(rho?.gap, 5);

  const beta = result.find((r) => r.code === 'Β');
  assert.ok(beta);
  assert.ok(Math.abs((beta?.score ?? 0) - (5 * (2 / 3))) < 1e-6);
});

test('summarizeQN21 computes percentage and classification', () => {
  const c1 = QN21_CRITERIA[0];
  const c2 = QN21_CRITERIA[1];
  const results = [
    { ...c1, score: 8, gap: 0 },
    { ...c2, score: 5, gap: 1 },
  ];
  const summary = summarizeQN21(results);
  assert.strictEqual(summary.total, 13);
  assert.strictEqual(summary.max, 14);
  assert.ok(Math.abs(summary.percentage - (13 / 14) * 100) < 1e-6);
  assert.strictEqual(summary.classification, 'accepted');
});

