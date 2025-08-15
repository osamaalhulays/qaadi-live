import test from 'node:test';
import assert from 'node:assert';

import { evaluateQN21, QN21_CRITERIA } from '../src/lib/q21';

test('evaluateQN21 returns scores and gaps for all criteria', () => {
  const text = 'Σ Θ';
  const result = evaluateQN21(text);

  assert.strictEqual(result.length, QN21_CRITERIA.length);

  const sigma = result.find((r) => r.code === 'Σ');
  assert.ok(sigma);
  assert.strictEqual(sigma?.score, 8);
  assert.strictEqual(sigma?.gap, 0);

  const theta = result.find((r) => r.code === 'Θ');
  assert.ok(theta);
  assert.strictEqual(theta?.score, 8);
  assert.strictEqual(theta?.gap, 0);

  const delta = result.find((r) => r.code === 'Δ');
  assert.ok(delta);
  assert.strictEqual(delta?.score, 0);
  assert.strictEqual(delta?.gap, 6);
});

