import test from 'node:test';
import assert from 'node:assert/strict';
import { runGates } from '../src/lib/workflow';

test('runGates detects missing fields', () => {
  const result = runGates({ secretary: { audit: { summary: 'A', equations: ['E=mc^2'] } } });
  assert.strictEqual(result.ready_percent, 67);
  assert.deepStrictEqual(result.missing, ['references']);
});

test('runGates passes when all fields present', () => {
  const result = runGates({ secretary: { audit: { summary: 'A', equations: ['E=mc^2'], references: ['Ref'] } } });
  assert.strictEqual(result.ready_percent, 100);
  assert.deepStrictEqual(result.missing, []);
});
