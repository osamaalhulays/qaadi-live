import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps based on keywords', () => {
  const text =
    'The equation F = ma was derived with rigorous analysis and ethical oversight.';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 8);
  assert.strictEqual(equations?.gap, 0);

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 6);
  assert.strictEqual(rigor?.gap, 0);

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.strictEqual(ethics?.score, 8);
  assert.strictEqual(ethics?.gap, 0);

  const safety = result.find((r) => r.code === 'safety');
  assert.ok(safety);
  assert.strictEqual(safety?.score, 0);
  assert.strictEqual(safety?.gap, 5);
});

test('evaluateQN21 handles partial criteria in text', () => {
  const text =
    'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
  const result = evaluateQN21(text);

  const calibration = result.find((r) => r.code === 'calibration');
  assert.ok(calibration);
  assert.strictEqual(calibration?.score, 3);

  const reproducibility = result.find((r) => r.code === 'reproducibility');
  assert.ok(reproducibility);
  assert.strictEqual(reproducibility?.score, 0);

  const engagement = result.find((r) => r.code === 'engagement');
  assert.ok(engagement);
  assert.strictEqual(engagement?.score, 5);
});

test('summarizeQN21 computes percentage and classification', () => {
  const included = QN21_CRITERIA.slice(0, 17);
  const text = included.map((c) => c.keywords[0]).join(' ');
  const result = evaluateQN21(text);
  const summary = summarizeQN21(result);
  const expectedTotal = included.reduce((sum, c) => sum + c.weight, 0);
  const expectedMax = QN21_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
  const expectedPercentage = (expectedTotal / expectedMax) * 100;
  assert.strictEqual(summary.total, expectedTotal);
  assert.strictEqual(summary.max, expectedMax);
  assert.strictEqual(summary.percentage, expectedPercentage);
  assert.strictEqual(summary.classification, 'needs_improvement');
});

