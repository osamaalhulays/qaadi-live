import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates, type SecretaryReport, type FieldKey } from '@/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const audit: SecretaryReport = {
    keywords: ['physics'],
    overflow_log: [],
    identity: '',
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 15);
  const expectedMissing: FieldKey[] = [
    'abstract',
    'nomenclature',
    'core_equations',
    'boundary_conditions',
    'dimensional_analysis',
    'limitations_risks',
    'preliminary_references',
    'identity',
  ];
  assert.deepStrictEqual(result.missing, expectedMissing);
  assert.deepStrictEqual(result.fields, {
    abstract: 0,
    keywords: 1,
    nomenclature: 0,
    core_equations: 0,
    boundary_conditions: 0,
    dimensional_analysis: 0,
    limitations_risks: 0,
    preliminary_references: 0,
    identity: 0,
  });
});

test('runGates passes when all required fields are present', () => {
  const audit: SecretaryReport = {
    abstract: 'Overview',
    keywords: ['physics'],
    nomenclature: ['m|kg|mass'],
    core_equations: ['E=mc^2'],
    boundary_conditions: ['t=0'],
    dimensional_analysis: 'dimensionless',
    limitations_risks: 'oversimplification',
    preliminary_references: ['Doe 2020'],
    identity: 'source',
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.fields, {
    abstract: 1,
    keywords: 1,
    nomenclature: 1,
    core_equations: 1,
    boundary_conditions: 1,
    dimensional_analysis: 1,
    limitations_risks: 1,
    preliminary_references: 1,
    identity: 1,
  });
});

test('runGates blocks evaluation when fields are missing', () => {
  const audit: SecretaryReport = { keywords: [], overflow_log: [], identity: '' };
  const gate = runGates({ secretary: { audit } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
});
