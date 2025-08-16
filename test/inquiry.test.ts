import { describe, it, expect } from '@jest/globals';
import { buildPrompt } from '../src/app/api/generate/route';

describe('buildPrompt', () => {
  it('handles inquiry in English', () => {
    const { prompt } = buildPrompt('inquiry', 'en', 'What is the role of Qaadi?', null);
    expect(prompt).toBe(
      'INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\nWhat is the role of Qaadi?'
    );
  });

  it('rejects unsupported inquiry language', () => {
    expect(() => buildPrompt('inquiry', 'other', 'Hello', null)).toThrow(/unsupported_inquiry_lang/);
  });
});
