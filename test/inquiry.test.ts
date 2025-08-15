import test from 'node:test';
import assert from 'node:assert';
import { buildPrompt } from '../src/app/api/generate/route';

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
