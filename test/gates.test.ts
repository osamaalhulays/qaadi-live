import test from 'node:test';
import assert from 'node:assert';
import { runGates } from '../src/lib/workflow';

test('runGates detects multiple missing fields', () => {
  const result = runGates({ secretary: { audit: { summary: 'A', equations: ['E=mc^2'] } } });
  assert.strictEqual(result.ready_percent, 40);
  assert.deepStrictEqual(result.missing, ['keywords', 'boundary', 'references']);
});

test('runGates passes when all required fields are present', () => {
  const result = runGates({
    secretary: {
      audit: {
        summary: 'A',
        keywords: ['physics'],
        equations: ['E=mc^2'],
        boundary: ['t=0'],
        references: ['Ref']
      }
    }
  });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
});

test('runGates blocks evaluation when fields are missing', () => {
  const gate = runGates({ secretary: { audit: { summary: 'Only summary' } } });
  const shouldEvaluate = gate.missing.length === 0;
  assert.strictEqual(shouldEvaluate, false);
});
