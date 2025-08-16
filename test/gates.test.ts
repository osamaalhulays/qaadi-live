import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates, type SecretaryReport } from '../src/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const audit: SecretaryReport = { keywords: ['physics'], tokens: ['c: light'] };
  const result = runGates({ secretary: { audit } });
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
  const audit: SecretaryReport = {
    summary: 'Overview',
    keywords: ['physics'],
    tokens: ['c: light'],
    boundary: ['t=0'],
    post_analysis: 'dimensionless',
    risks: ['oversimplification'],
    predictions: ['growth'],
    testability: 'lab',
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
});

test('runGates blocks evaluation when fields are missing', () => {
  const audit: SecretaryReport = { keywords: [] };
  const gate = runGates({ secretary: { audit } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
});
