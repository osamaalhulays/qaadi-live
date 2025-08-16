import { test, expect } from '@jest/globals';
import { buildPrompt } from '../src/lib/buildPrompt';

test('buildPrompt handles inquiry in English', () => {
  const { prompt } = buildPrompt('inquiry', 'en', 'What is the role of Qaadi?', null);
  expect(prompt).toBe(
    'INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\nWhat is the role of Qaadi?'
  );
});

test('buildPrompt rejects unsupported inquiry language', () => {
  expect(() => buildPrompt('inquiry', 'other', 'Hello', null)).toThrow(/unsupported_inquiry_lang/);
});
