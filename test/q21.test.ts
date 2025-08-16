import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps based on patterns', () => {
  const text = 'Equations ensure rigor and ethics in research.';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 5);
  assert.strictEqual(equations?.gap, 0);

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 5 * (1 / 2));
  assert.strictEqual(rigor?.gap, 5 - 5 * (1 / 2));

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.strictEqual(ethics?.score, 2);
  assert.strictEqual(ethics?.gap, 0);

  const references = result.find((r) => r.code === 'references');
  assert.ok(references);
  assert.strictEqual(references?.score, 0);
  assert.strictEqual(references?.gap, 3);
});

test('evaluateQN21 detects uppercase and mixed-case indicators', () => {
  const text = 'The EQUATIONS were derived with RIGOR and ETHICS.';
  const result = evaluateQN21(text);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 5);

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 5 * (1 / 2));

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.strictEqual(ethics?.score, 2);
});

test('evaluateQN21 handles partial criteria in text', () => {
  const text =
    'Predictions were promising. Reproducibility was not discussed. Diagrams were provided.';
  const result = evaluateQN21(text);

  const predictions = result.find((r) => r.code === 'predictions');
  assert.ok(predictions);
  assert.strictEqual(predictions?.score, 6 * (1 / 2));

  const reproducibility = result.find((r) => r.code === 'reproducibility');
  assert.ok(reproducibility);
  assert.strictEqual(reproducibility?.score, 0);

  const diagrams = result.find((r) => r.code === 'diagrams');
  assert.ok(diagrams);
  assert.strictEqual(diagrams?.score, 2 * (1 / 2));
});

test('evaluateQN21 gives full score when all indicators match', () => {
  const text = 'Equation and equations illustrate fundamental EQUATIONs.';
  const result = evaluateQN21(text);
  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 5);
  assert.strictEqual(equations?.gap, 0);
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
    { code: 'equations', type: 'internal', weight: 5 },
    { code: 'rigor', type: 'internal', weight: 5 },
    { code: 'dimensional', type: 'internal', weight: 5 },
    { code: 'symmetry', type: 'internal', weight: 4 },
    { code: 'conservation', type: 'internal', weight: 4 },
    { code: 'boundary', type: 'internal', weight: 4 },
    { code: 'consistency', type: 'internal', weight: 5 },
    { code: 'scope', type: 'internal', weight: 4 },
    { code: 'novelty', type: 'internal', weight: 4 },
    { code: 'predictions', type: 'internal', weight: 6 },
    { code: 'falsifiability', type: 'internal', weight: 6 },
    { code: 'methodology', type: 'internal', weight: 4 },
    { code: 'definitions', type: 'internal', weight: 3 },
    { code: 'terminology', type: 'internal', weight: 3 },
    { code: 'clarity', type: 'internal', weight: 3 },
    { code: 'diagrams', type: 'internal', weight: 2 },
    { code: 'limitations', type: 'internal', weight: 3 },
    { code: 'expAlignment', type: 'external', weight: 6 },
    { code: 'reproducibility', type: 'external', weight: 5 },
    { code: 'references', type: 'external', weight: 3 },
    { code: 'ethics', type: 'external', weight: 2 },
  ];
  const actual = QN21_CRITERIA.map(({ code, type, weight }) => ({ code, type, weight }));
  assert.deepStrictEqual(actual, expected);
});

