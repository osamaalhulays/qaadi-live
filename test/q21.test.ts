import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps based on patterns', () => {
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

test('evaluateQN21 detects uppercase and mixed-case indicators', () => {
  const text =
    'The EQUATION F = ma was DErIvEd with eThIcAL oversight.';
  const result = evaluateQN21(text);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 8);

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 6);

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.strictEqual(ethics?.score, 8);
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
  const criterionA = {
    code: 'c1',
    type: 'internal',
    weight: 5,
    description: '',
    keywords: [],
  } as const;
  const criterionB = {
    code: 'c2',
    type: 'internal',
    weight: 3,
    description: '',
    keywords: [],
  } as const;
  const criterionC = {
    code: 'c3',
    type: 'internal',
    weight: 2,
    description: '',
    keywords: [],
  } as const;
  const results = [
    { ...criterionA, score: 5, gap: 0 },
    { ...criterionB, score: 0, gap: 3 },
    { ...criterionC, score: 2, gap: 0 },
  ];
  const summary = summarizeQN21(results);
  const expectedTotal = 7; // 5 + 0 + 2
  const expectedMax = 10; // 5 + 3 + 2
  assert.strictEqual(summary.total, expectedTotal);
  assert.strictEqual(summary.max, expectedMax);
  assert.strictEqual(summary.percentage, (expectedTotal / expectedMax) * 100);
  assert.strictEqual(summary.classification, 'needs_improvement');
});

test('evaluateQN21 maintains scores for sticky regex patterns across calls', () => {
  const rigor = QN21_CRITERIA.find((c) => c.code === 'rigor');
  assert.ok(rigor);
  const originalPatterns = rigor.patterns;
  try {
    rigor.patterns = [/analysis/y];
    const text = 'analysis and more analysis';
    const firstScore = evaluateQN21(text).find((r) => r.code === 'rigor')?.score;
    const secondScore = evaluateQN21(text).find((r) => r.code === 'rigor')?.score;
    assert.strictEqual(firstScore, rigor.weight);
    assert.strictEqual(secondScore, rigor.weight);
    assert.strictEqual(firstScore, secondScore);
  } finally {
    rigor.patterns = originalPatterns;
  }
});

