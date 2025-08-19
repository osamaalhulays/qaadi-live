import { test, jest } from '@jest/globals';
import assert from 'node:assert';
import { generateText } from '../src/lib/generationService.ts';

test('generateText delegates to provided runner', async () => {
  const runner = jest.fn().mockResolvedValue({ text: 'hi' });
  const keys = Object.create(null);
  const res = await generateText('auto', keys, 'prompt', 5, runner);
  assert.deepStrictEqual(res, { text: 'hi' });
  assert.strictEqual(runner.mock.calls.length, 1);
  assert.deepStrictEqual(runner.mock.calls[0], ['auto', {}, 'prompt', 5]);
  assert.strictEqual(
    Object.getPrototypeOf(runner.mock.calls[0][1]),
    Object.prototype
  );
});
