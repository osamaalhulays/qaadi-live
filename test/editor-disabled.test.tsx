// Tests run in the default Node environment; no DOM APIs are required.

import { test, jest } from '@jest/globals';
import assert from 'node:assert';

test('export and generate buttons require api key, target, lang, and text', async () => {
  const { TextEncoder, TextDecoder } = await import('util');
  // @ts-ignore
  if (!global.TextEncoder) global.TextEncoder = TextEncoder;
  // @ts-ignore
  if (!global.TextDecoder) global.TextDecoder = TextDecoder;

  // initial render without required fields -> buttons disabled
  let React = (await import('react')).default;
  let { renderToStaticMarkup } = await import('react-dom/server');
  let { default: Editor } = await import('../src/components/Editor');
  const initial = renderToStaticMarkup(<Editor />);
  assert.match(initial, /<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  assert.match(initial, /<button class="btn btn-primary"[^>]*disabled[^>]*>Export ZIP<\/button>/);
  assert.match(initial, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);

  // render with api key, target, lang, and text preset -> buttons enabled
  jest.resetModules();
  React = (await import('react')).default;
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  const origUseState = React.useState;
  let calls = 0;
  jest.spyOn(React, 'useState').mockImplementation((init: any) => {
    calls++;
    if (calls === 1) return ['sk-abc', () => {}]; // openaiKey
    if (calls === 3) return ['revtex', () => {}]; // target
    if (calls === 4) return ['en', () => {}]; // lang
    if (calls === 7) return ['sample text', () => {}]; // text
    return origUseState(init);
  });
  ({ default: Editor } = await import('../src/components/Editor'));
  const withValues = renderToStaticMarkup(<Editor />);
  (React.useState as any).mockRestore();

  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  assert.doesNotMatch(withValues, /<button class="btn btn-primary"[^>]*disabled[^>]*>Export ZIP<\/button>/);
  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);
});
