import { test } from '@jest/globals';
import assert from 'node:assert';
import { gateQn21 } from '../src/lib/workflow';

test('gateQn21 blocks when total percentage below threshold', () => {
  const report = {
    score_total: 15,
    criteria: [
      { id: 1, score: 5 },
      { id: 2, score: 5 },
      { id: 3, score: 5 },
    ],
  };
  const gate = gateQn21(report);
  assert.strictEqual(gate.allowed, false);
  assert.ok(gate.percentage < 60);
});

test('gateQn21 blocks when critical criterion fails', () => {
  const report = {
    score_total: 66,
    criteria: [
      { id: 1, score: 3 },
      { id: 2, score: 7 },
      { id: 3, score: 7 },
      { id: 4, score: 7 },
      { id: 5, score: 7 },
      { id: 6, score: 7 },
      { id: 7, score: 7 },
      { id: 8, score: 7 },
      { id: 9, score: 7 },
      { id: 10, score: 7 },
    ],
  };
  const gate = gateQn21(report, [1]);
  assert.strictEqual(gate.allowed, false);
  assert.deepStrictEqual(gate.failed, [1]);
});
