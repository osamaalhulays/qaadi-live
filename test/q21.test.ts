import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps based on keywords', () => {
  const text =
    'The equation F = ma was derived with rigorous analysis and ethical oversight.';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const sigma = result.find((r) => r.code === 'Σ');
  assert.ok(sigma);
  assert.strictEqual(sigma?.score, 8);
  assert.strictEqual(sigma?.gap, 0);

  const delta = result.find((r) => r.code === 'Δ');
  assert.ok(delta);
  assert.strictEqual(delta?.score, 6);
  assert.strictEqual(delta?.gap, 0);

  const theta = result.find((r) => r.code === 'Θ');
  assert.ok(theta);
  assert.strictEqual(theta?.score, 8);
  assert.strictEqual(theta?.gap, 0);

  const phi = result.find((r) => r.code === 'Φ');
  assert.ok(phi);
  assert.strictEqual(phi?.score, 0);
  assert.strictEqual(phi?.gap, 5);
});

test('evaluateQN21 handles partial criteria in text', () => {
  const text =
    'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
  const result = evaluateQN21(text);

  const kappa = result.find((r) => r.code === 'Κ');
  assert.ok(kappa);
  assert.strictEqual(kappa?.score, 3);

  const rho = result.find((r) => r.code === 'Ρ');
  assert.ok(rho);
  assert.strictEqual(rho?.score, 0);

  const beta = result.find((r) => r.code === 'Β');
  assert.ok(beta);
  assert.strictEqual(beta?.score, 5);
});

test('summarizeQN21 computes percentage and classification', () => {
  const text = QN21_CRITERIA.slice(0, 17)
    .map((c) => c.keywords[0])
    .join(' ');
  const result = evaluateQN21(text);
  const summary = summarizeQN21(result);
  assert.strictEqual(summary.total, 17);
  assert.strictEqual(summary.max, QN21_CRITERIA.length);
  assert.ok(summary.percentage > 80);
  assert.strictEqual(summary.classification, 'accepted');
});

