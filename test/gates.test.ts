import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates, type SecretaryReport, type FieldKey } from '@/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const audit: SecretaryReport = {
    keywords: ['physics'],
    identity: '',
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 7);
  const expectedMissing: FieldKey[] = [
    'abstract',
    'nomenclature',
    'symbols_units',
    'core_equations',
    'boundary_conditions',
    'assumptions_scope',
    'dimensional_analysis',
    'limitations_risks',
    'preliminary_references',
    'version',
    'status',
    'parent_id',
    'overflow_log',
    'identity',
  ];
  assert.deepStrictEqual(result.missing, expectedMissing);
  assert.deepStrictEqual(result.fields, {
    abstract: 0,
    keywords: 1,
    nomenclature: 0,
    symbols_units: 0,
    core_equations: 0,
    boundary_conditions: 0,
    assumptions_scope: 0,
    dimensional_analysis: 0,
    limitations_risks: 0,
    preliminary_references: 0,
    version: 0,
    status: 0,
    parent_id: 0,
    overflow_log: 0,
    identity: 0,
  });
});

test('runGates passes when all required fields are present', () => {
  const audit: SecretaryReport = {
    abstract: 'Overview',
    keywords: ['physics'],
    nomenclature: ['m|kg|mass'],
    symbols_units: ['m|kg'],
    core_equations: ['E=mc^2'],
    boundary_conditions: ['t=0'],
    assumptions_scope: ['scope'],
    dimensional_analysis: 'dimensionless',
    limitations_risks: 'oversimplification',
    preliminary_references: ['Doe 2020'],
    version: '1.0',
    status: 'draft',
    parent_id: 'root',
    overflow_log: [],
    identity: 'source',
  };
  const result = runGates({ secretary: { audit } });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.fields, {
    abstract: 1,
    keywords: 1,
    nomenclature: 1,
    symbols_units: 1,
    core_equations: 1,
    boundary_conditions: 1,
    assumptions_scope: 1,
    dimensional_analysis: 1,
    limitations_risks: 1,
    preliminary_references: 1,
    version: 1,
    status: 1,
    parent_id: 1,
    overflow_log: 1,
    identity: 1,
  });
});

test('runGates blocks evaluation when fields are missing', () => {
  const audit: SecretaryReport = { keywords: [], identity: '' };
  const gate = runGates({ secretary: { audit } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
});
