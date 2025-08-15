import test from 'node:test';
import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps for all criteria', () => {
  const text = 'I1 E3';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const i1 = result.find((r) => r.code === 'I1');
  assert.ok(i1);
  assert.strictEqual(i1?.score, 1);
  assert.strictEqual(i1?.gap, 0);

  const e3 = result.find((r) => r.code === 'E3');
  assert.ok(e3);
  assert.strictEqual(e3?.score, 1);

  const i2 = result.find((r) => r.code === 'I2');
  assert.ok(i2);
  assert.strictEqual(i2?.score, 0);
  assert.strictEqual(i2?.gap, 1);
});

test('summarizeQN21 computes percentage and classification', () => {
  const text = QN21_CRITERIA.slice(0, 17).map(c => c.code).join(' ');
  const result = evaluateQN21(text);
  const summary = summarizeQN21(result);
  assert.strictEqual(summary.total, 17);
  assert.strictEqual(summary.max, QN21_CRITERIA.length);
  assert.ok(summary.percentage > 80);
  assert.strictEqual(summary.classification, 'accepted');
});

