import { test, expect } from '@jest/globals';
import { runGates } from '../src/lib/workflow';

test('runGates detects missing fields', () => {
  const result = runGates({ secretary: { audit: { summary: 'A', equations: ['E=mc^2'] } } });
  expect(result.ready_percent).toBe(67);
  expect(result.missing).toEqual(['references']);
});

test('runGates passes when all fields present', () => {
  const result = runGates({ secretary: { audit: { summary: 'A', equations: ['E=mc^2'], references: ['Ref'] } } });
  expect(result.ready_percent).toBe(100);
  expect(result.missing).toEqual([]);
});
