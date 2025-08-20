import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates, type SecretaryReport, type FieldKey } from '../src/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const audit: SecretaryReport = {
    keywords: ['physics'],
    tokens: ['c: light'],
    identity: '',
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 22);
  const expectedMissing: FieldKey[] = [
    'summary',
    'core_equations',
    'boundary',
    'dimensional',
    'risks',
    'references',
    'identity',
  ];
  assert.deepStrictEqual(result.missing, expectedMissing);
  assert.deepStrictEqual(result.fields, {
    summary: 0,
    keywords: 1,
    tokens: 1,
    core_equations: 0,
    boundary: 0,
    dimensional: 0,
    risks: 0,
    references: 0,
    identity: 0,
  });
});

test('runGates passes when all required fields are present', () => {
  const audit: SecretaryReport = {
    summary: 'Overview',
    keywords: ['physics'],
    tokens: ['c: light'],
    core_equations: ['E=mc^2'],
    boundary: ['t=0'],
    dimensional: 'dimensionless',
    risks: ['oversimplification'],
    references: ['Doe, J. (2020). Title. Journal.'],
    identity: 'source',
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.fields, {
    summary: 1,
    keywords: 1,
    tokens: 1,
    core_equations: 1,
    boundary: 1,
    dimensional: 1,
    risks: 1,
    references: 1,
    identity: 1,
  });
});

test('runGates blocks evaluation when fields are missing', () => {
  const audit: SecretaryReport = { keywords: [], identity: '' };
  const gate = runGates({ secretary: { audit } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
});
