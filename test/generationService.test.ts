import { test, jest } from '@jest/globals';
import assert from 'node:assert';
import { generateText } from '../src/lib/generationService.ts';

test('generateText delegates to provided runner', async () => {
  const runner = jest.fn().mockResolvedValue({ text: 'hi' });
  const res = await generateText('auto', {}, 'prompt', 5, runner);
  assert.deepStrictEqual(res, { text: 'hi' });
  assert.strictEqual(runner.mock.calls.length, 1);
  assert.deepStrictEqual(runner.mock.calls[0], ['auto', {}, 'prompt', 5]);
});
