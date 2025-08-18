import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates, type SecretaryReport } from '../src/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const audit: SecretaryReport = {
    keywords: ['physics'],
    tokens: ['c: light'],
    issues: [{ type: 'demo', note: 'example' }],
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 22);
  assert.deepStrictEqual(result.missing, [
    'summary',
    'boundary',
    'post_analysis',
    'risks',
    'predictions',
    'testability',
  ]);
  assert.strictEqual(result.fields.keywords.score, 0.5);
});

test('runGates passes when all required fields are present', () => {
  const audit: SecretaryReport = {
    summary: 'Overview of experiment with enough detail',
    keywords: ['physics', 'experiment'],
    tokens: ['c: light', 'm: mass'],
    boundary: ['t=0', 'x->\u221E'],
    post_analysis: 'dimensionless analysis ensures units match across equations',
    risks: ['oversimplification', 'speed miscalc'],
    predictions: ['growth', 'decay'],
    testability: 'lab experiment verifying predictions thoroughly',
    issues: [{ type: 'none', note: 'no issues' }],
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
});

test('runGates blocks evaluation when fields are missing', () => {
  const audit: SecretaryReport = { keywords: [], issues: [{ type: 'none', note: 'no issues' }] };
  const gate = runGates({ secretary: { audit } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
  assert.strictEqual(gate.fields.keywords.score, 0);
});
