import { test } from '@jest/globals';
import assert from 'node:assert';
import { evaluateText } from '@/lib/evaluationService.ts';

test('evaluateText combines QN21 and custom criteria', async () => {
  const text = 'Equations ensure safety and compliance in our methodology.';
  const result = await evaluateText(text);
  assert.ok(Array.isArray(result.criteria));
  const safety = result.criteria.find(c => c.name.toLowerCase().includes('safety'));
  assert.ok(safety);
  assert.ok((safety as any).score > 0);
});

test('evaluateText rejects low scoring text', async () => {
  const result = await evaluateText('nonsense');
  assert.strictEqual(result.classification, 'weak');
  assert.strictEqual(result.verdict, 'rejected');
});
