import { test } from '@jest/globals';
import assert from 'node:assert';
import { buildPrompt } from '@/lib/buildPrompt';

test('buildPrompt handles wide in English', () => {
  const { prompt } = buildPrompt('wide', 'en', 'Hello world', null);
  assert.strictEqual(
    prompt,
    'WIDE/EN: You are the Qaadi engine. Edit a wide English text intended for the paper (bundle.md). Input:\nHello world'
  );
});

test('buildPrompt handles revtex template in English', () => {
  const { prompt } = buildPrompt('revtex', 'en', 'Hello world', null);
  assert.strictEqual(
    prompt,
    'REVTEX/EN: Produce LaTeX draft body (no \\documentclass) for ReVTeX style in English. Input:\nHello world'
  );
});

test('buildPrompt rejects unsupported template language', () => {
  assert.throws(
    () => buildPrompt('revtex', 'tr' as any, 'Hi', null),
    /unsupported_target_lang:revtex:tr/
  );
});
