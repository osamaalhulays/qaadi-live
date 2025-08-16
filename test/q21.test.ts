import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 distributes scores proportionally', () => {
  const text =
    'The equation F = ma was derived with rigorous analysis and ethical oversight.';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 6);
  assert.strictEqual(equations?.gap, 2);

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 4);
  assert.strictEqual(rigor?.gap, 2);

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.ok(ethics!.score > 0 && ethics!.score < ethics!.weight);

  const safety = result.find((r) => r.code === 'safety');
  assert.ok(safety);
  assert.strictEqual(safety?.score, 0);
  assert.strictEqual(safety?.gap, 5);
});

test('evaluateQN21 handles partial coverage and mismatches', () => {
  const text =
    'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
  const result = evaluateQN21(text);

  const calibration = result.find((r) => r.code === 'calibration');
  assert.ok(calibration);
  assert.strictEqual(calibration?.score, 1);

  const reproducibility = result.find((r) => r.code === 'reproducibility');
  assert.ok(reproducibility);
  assert.strictEqual(reproducibility?.score, 0);

  const engagement = result.find((r) => r.code === 'engagement');
  assert.ok(engagement);
  assert.ok(Math.abs(engagement!.score - 10 / 3) < 1e-9);
});

test('pattern indicators contribute to scoring', () => {
  const text =
    'Validation comparison with prior studies [12] but lacked policy references.';
  const result = evaluateQN21(text);

  const validation = result.find((r) => r.code === 'validation');
  assert.ok(validation);
  assert.strictEqual(validation?.score, 3);

  const policy = result.find((r) => r.code === 'policy');
  assert.ok(policy);
  assert.ok(policy!.score > 0 && policy!.score < policy!.weight);

  const safety = result.find((r) => r.code === 'safety');
  assert.ok(safety);
  assert.strictEqual(safety?.score, 0);
});

test('summarizeQN21 computes totals and classification', () => {
  const text = QN21_CRITERIA.slice(0, 17)
    .map((c) => c.keywords[0])
    .join(' ');
  const result = evaluateQN21(text);
  const summary = summarizeQN21(result);
  assert.strictEqual(summary.max, 100);
  assert.ok(summary.total < summary.max);
  assert.strictEqual(summary.classification, 'weak');
});

