import { test } from '@jest/globals';
import assert from 'node:assert';
import { buildPrompt } from '../src/lib/buildPrompt';

test('buildPrompt handles inquiry in English', () => {
  const { prompt } = buildPrompt('inquiry', 'en', 'What is the role of Qaadi?', null);
  assert.strictEqual(
    prompt,
    'INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\nWhat is the role of Qaadi?'
  );
});

test('buildPrompt rejects unsupported inquiry language', () => {
  assert.throws(
    () => buildPrompt('inquiry', 'other', 'Hello', null),
    /unsupported_inquiry_lang/
  );
});
