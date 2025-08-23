import { test } from '@jest/globals';
import assert from 'node:assert';
import { gateQn21 } from '@/lib/workflow';

test('gateQn21 blocks when total percentage below threshold', () => {
  const report = {
    score_total: 7,
    weight_total: 15,
    criteria: [
      { id: 1, name: 'equations', score: 2, weight: 5 },
      { id: 3, name: 'dimensional', score: 4, weight: 7 },
      { id: 13, name: 'definitions', score: 1, weight: 3 },
    ],
  };
  const gate = gateQn21(report);
  assert.strictEqual(gate.allowed, false);
  assert.ok(gate.percentage < 60);
});

test('gateQn21 blocks when critical criterion fails', () => {
  const report = {
    score_total: 73,
    weight_total: 110,
    criteria: [
      { id: 1, name: 'equations', score: 3, weight: 10 },
      { id: 2, score: 7, weight: 10 },
      { id: 3, name: 'dimensional', score: 7, weight: 10 },
      { id: 4, score: 7, weight: 10 },
      { id: 5, score: 7, weight: 10 },
      { id: 6, score: 7, weight: 10 },
      { id: 7, score: 7, weight: 10 },
      { id: 8, score: 7, weight: 10 },
      { id: 9, score: 7, weight: 10 },
      { id: 10, score: 7, weight: 10 },
      { id: 13, name: 'definitions', score: 7, weight: 10 },
    ],
  };
  const gate = gateQn21(report, [1]);
  assert.strictEqual(gate.allowed, false);
  assert.deepStrictEqual(gate.failed, [1]);
});

test('gateQn21 blocks when mandatory criteria are below minimum', () => {
  const report = {
    score_total: 60,
    weight_total: 70,
    criteria: [
      { id: 1, name: 'equations', score: 0, weight: 10 },
      { id: 3, name: 'dimensional', score: 10, weight: 10 },
      { id: 13, name: 'definitions', score: 10, weight: 10 },
      { id: 2, score: 10, weight: 10 },
      { id: 4, score: 10, weight: 10 },
      { id: 5, score: 10, weight: 10 },
      { id: 6, score: 10, weight: 10 },
    ],
  };
  const gate = gateQn21(report);
  assert.strictEqual(gate.allowed, false);
  assert.deepStrictEqual(gate.failed, ['equations']);
});

test('gateQn21 allows when all mandatory criteria meet minimum', () => {
  const report = {
    score_total: 71,
    weight_total: 80,
    criteria: [
      { id: 1, name: 'equations', score: 1, weight: 10 },
      { id: 3, name: 'dimensional', score: 10, weight: 10 },
      { id: 13, name: 'definitions', score: 10, weight: 10 },
      { id: 2, score: 10, weight: 10 },
      { id: 4, score: 10, weight: 10 },
      { id: 5, score: 10, weight: 10 },
      { id: 6, score: 10, weight: 10 },
      { id: 7, score: 10, weight: 10 },
    ],
  };
  const gate = gateQn21(report);
  assert.strictEqual(gate.allowed, true);
  assert.deepStrictEqual(gate.failed, []);
  assert.ok(gate.percentage >= 60);
});
