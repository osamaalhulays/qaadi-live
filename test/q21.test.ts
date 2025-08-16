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
  assert.strictEqual(summary.total, expectedTotal);
  assert.strictEqual(summary.max, expectedMax);
  assert.strictEqual(summary.percentage, (expectedTotal / expectedMax) * 100);
  assert.strictEqual(summary.classification, 'needs_improvement');
});

test('evaluateQN21 handles regex with global flag consistently', () => {
  const criteria = [
    {
      code: 'global',
      type: 'internal' as const,
      weight: 2,
      description: 'Global regex pattern',
      keywords: [/analysis/g],
    },
  ];
  const text = 'analysis';
  const first = evaluateQN21(text, criteria);
  const second = evaluateQN21(text, criteria);
  assert.strictEqual(first[0].score, 2);
  assert.strictEqual(second[0].score, 2);
});

