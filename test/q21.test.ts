import test from 'node:test';
import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps for all criteria', () => {
  const text = 'equations ethics';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const equations = result.find((r) => r.code === 'equations');
  assert.ok(equations);
  assert.strictEqual(equations?.score, 8);
  assert.strictEqual(equations?.gap, 0);

  const ethics = result.find((r) => r.code === 'ethics');
  assert.ok(ethics);
  assert.strictEqual(ethics?.score, 8);
  assert.strictEqual(ethics?.gap, 0);

  const rigor = result.find((r) => r.code === 'rigor');
  assert.ok(rigor);
  assert.strictEqual(rigor?.score, 0);
  assert.strictEqual(rigor?.gap, 6);
});

test('summarizeQN21 computes percentage and classification', () => {
  const text = QN21_CRITERIA.slice(0, 18).map(c => c.code).join(' ');
  const result = evaluateQN21(text);
  const summary = summarizeQN21(result);
  const expectedTotal = QN21_CRITERIA.slice(0, 18).reduce((sum, c) => sum + c.weight, 0);
  const expectedMax = QN21_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
  assert.strictEqual(summary.total, expectedTotal);
  assert.strictEqual(summary.max, expectedMax);
  assert.ok(summary.percentage > 80);
  assert.strictEqual(summary.classification, 'accepted');
});

