import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt } from '../src/lib/buildPrompt';

describe('buildPrompt', () => {
  it('handles inquiry in English', () => {
    const { prompt } = buildPrompt('inquiry', 'en', 'What is the role of Qaadi?', null);
    assert.strictEqual(
      prompt,
      'INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\nWhat is the role of Qaadi?'
    );
  });

  it('rejects unsupported inquiry language', () => {
    assert.throws(
      () => buildPrompt('inquiry', 'other', 'Hello', null),
      /unsupported_inquiry_lang/
    );
  });
});
