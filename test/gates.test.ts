import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates, type SecretaryReport, type FieldKey } from '../src/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const audit: SecretaryReport = { keywords: ['physics'], tokens: ['c: light'] };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 25);
  const expectedMissing: FieldKey[] = [
    'summary',
    'boundary',
    'post_analysis',
    'risks',
    'predictions',
    'testability',
  ];
  assert.deepStrictEqual(result.missing, expectedMissing);
  assert.deepStrictEqual(result.fields, {
    summary: 0,
    keywords: 1,
    tokens: 1,
    boundary: 0,
    post_analysis: 0,
    risks: 0,
    predictions: 0,
    testability: 0,
  });
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
  assert.deepStrictEqual(result.fields, {
    summary: 1,
    keywords: 1,
    tokens: 1,
    boundary: 1,
    post_analysis: 1,
    risks: 1,
    predictions: 1,
    testability: 1,
  });
});

test('runGates blocks evaluation when fields are missing', () => {
  const audit: SecretaryReport = { keywords: [] };
  const gate = runGates({ secretary: { audit } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
});
