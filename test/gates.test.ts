// Unit tests for secretary gate validation
import assert from 'node:assert';
import { runGates } from '../src/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const result = runGates({
    secretary: { audit: { keywords: ['physics'], tokens: ['c: light'] } }
  });
  assert.strictEqual(result.ready_percent, 0);
  assert.deepStrictEqual(result.missing, [
    'summary',
    'equations',
    'references',
    'boundary',
  ]);
});

test('runGates passes when all required fields are present', () => {
  const result = runGates({
    secretary: {
      audit: {
        keywords: ['physics'],
        tokens: ['c: light'],
        boundary: ['t=0'],
        post_analysis: 'dimensionless',
        risks: ['oversimplification'],
        predictions: ['growth'],
        testability: 'lab',
        summary: 'A',
        equations: ['E=mc^2'],
        references: ['Ref'],
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

test('runGates returns all fields missing when report is absent', () => {
  const result = runGates({});
  assert.strictEqual(result.ready_percent, 0);
  assert.deepStrictEqual(result.missing, [
    'summary',
    'equations',
    'references',
    'boundary',
  ]);
});
