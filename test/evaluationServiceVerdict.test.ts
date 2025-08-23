import { test, jest } from '@jest/globals';
import assert from 'node:assert';

async function setupMocks(score: number, weight: number) {
  jest.resetModules();
  jest.unstable_mockModule('@/lib/q21', () => ({
    evaluateQN21: () => [
      { code: 'c', description: 'd', score, weight, type: 'internal' as const },
    ],
  }));
  jest.unstable_mockModule('@/lib/criteria', () => ({
    loadCriteria: async () => [],
    evaluateCriteria: () => [],
  }));
  const mod = await import('@/lib/evaluationService.ts');
  return mod.evaluateText;
}

test('evaluateText maps accepted classification to approved verdict', async () => {
  const evaluateText = await setupMocks(5, 5);
  const result = await evaluateText('x');
  assert.strictEqual(result.classification, 'accepted');
  assert.strictEqual(result.verdict, 'approved');
});

test('evaluateText maps needs_improvement classification to needs_improvement verdict', async () => {
  const evaluateText = await setupMocks(3, 5);
  const result = await evaluateText('x');
  assert.strictEqual(result.classification, 'needs_improvement');
  assert.strictEqual(result.verdict, 'needs_improvement');
});

test('evaluateText maps weak classification to rejected verdict', async () => {
  const evaluateText = await setupMocks(2, 5);
  const result = await evaluateText('x');
  assert.strictEqual(result.classification, 'weak');
  assert.strictEqual(result.verdict, 'rejected');
});
