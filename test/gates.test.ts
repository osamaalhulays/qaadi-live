import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates } from '../src/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const result = runGates({
    secretary: { audit: { keywords: ['physics'], tokens: ['c: light'] } }
  });
  assert.strictEqual(result.ready_percent, 25);
  assert.deepStrictEqual(result.missing, [
    'summary',
    'boundary',
    'post_analysis',
    'risks',
    'predictions',
    'testability',
  ]);
});

test('runGates passes when all required fields are present', () => {
  const result = runGates({
    secretary: {
      audit: {
        summary: 'Overview',
        keywords: ['physics'],
        tokens: ['c: light'],
        boundary: ['t=0'],
        post_analysis: 'dimensionless',
        risks: ['oversimplification'],
        predictions: ['growth'],
        testability: 'lab',
      },
    },
  });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
});

test('runGates blocks evaluation when fields are missing', () => {
  const gate = runGates({ secretary: { audit: { keywords: [] } } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
});
