import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps based on patterns', () => {
  const text = 'Equations ensure rigor and ethics in research.';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 8 * (2 / 3));
  assert.strictEqual(equations?.gap, 8 - 8 * (2 / 3));

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 6 * (2 / 3));
  assert.strictEqual(rigor?.gap, 6 - 6 * (2 / 3));

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.strictEqual(ethics?.score, 8 * (2 / 3));
  assert.strictEqual(ethics?.gap, 8 - 8 * (2 / 3));

  const privacy = result.find((r) => r.code === 'privacy');
  assert.ok(privacy);
  assert.strictEqual(privacy?.score, 0);
  assert.strictEqual(privacy?.gap, 3);
});

test('evaluateQN21 detects uppercase and mixed-case indicators', () => {
  const text = 'The EQUATIONS were derived with RIGOR and ETHICS.';
  const result = evaluateQN21(text);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 8 * (2 / 3));

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 6 * (2 / 3));

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.strictEqual(ethics?.score, 8 * (2 / 3));
});

test('evaluateQN21 handles partial criteria in text', () => {
  const text =
    'Experiment design was robust, but reproducibility was ignored. Calibration was performed.';
  const result = evaluateQN21(text);

  const experiment = result.find((r) => r.code === 'experiment');
  assert.ok(experiment);
  assert.strictEqual(experiment?.score, 6 * (1 / 3));

  const reproducibility = result.find((r) => r.code === 'reproducibility');
  assert.ok(reproducibility);
  assert.strictEqual(reproducibility?.score, 0);

  const calibration = result.find((r) => r.code === 'calibration');
  assert.ok(calibration);
  assert.strictEqual(calibration?.score, 3 * (1 / 3));
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

test('QN21_CRITERIA exposes documented codes, types and weights', () => {
  const expected = [
    { code: 'equations', type: 'internal', weight: 8 },
    { code: 'rigor', type: 'internal', weight: 6 },
    { code: 'dimensional', type: 'internal', weight: 5 },
    { code: 'notation', type: 'internal', weight: 3 },
    { code: 'experiment', type: 'internal', weight: 6 },
    { code: 'calibration', type: 'internal', weight: 3 },
    { code: 'measurement', type: 'internal', weight: 4 },
    { code: 'data', type: 'internal', weight: 4 },
    { code: 'reproducibility', type: 'internal', weight: 5 },
    { code: 'validation', type: 'internal', weight: 4 },
    { code: 'conservation', type: 'internal', weight: 3 },
    { code: 'ethics', type: 'external', weight: 8 },
    { code: 'safety', type: 'external', weight: 5 },
    { code: 'environmental', type: 'external', weight: 5 },
    { code: 'accessibility', type: 'external', weight: 3 },
    { code: 'privacy', type: 'external', weight: 3 },
    { code: 'interdisciplinary', type: 'external', weight: 4 },
    { code: 'communication', type: 'external', weight: 6 },
    { code: 'engagement', type: 'external', weight: 5 },
    { code: 'policy', type: 'external', weight: 5 },
    { code: 'societal', type: 'external', weight: 5 },
  ];
  const actual = QN21_CRITERIA.map(({ code, type, weight }) => ({ code, type, weight }));
  assert.deepStrictEqual(actual, expected);
});

