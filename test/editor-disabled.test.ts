// Tests run in the default Node environment; no DOM APIs are required.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test, jest } from '@jest/globals';
import assert from 'node:assert';

test('export and generate buttons require target and lang', async () => {
  const { TextEncoder, TextDecoder } = await import('util');
  // @ts-ignore
  if (!global.TextEncoder) global.TextEncoder = TextEncoder;
  // @ts-ignore
  if (!global.TextDecoder) global.TextDecoder = TextDecoder;

  // initial render without target/lang -> buttons disabled
  let { default: Editor } = await import('../src/components/Editor');
  const initial = renderToStaticMarkup(<Editor />);
  assert.match(initial, /<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  assert.match(initial, /<button class="btn btn-primary"[^>]*disabled[^>]*>Export ZIP<\/button>/);
  assert.match(initial, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);

  // render with target and lang preset -> buttons enabled
  const origUseState = React.useState;
  let calls = 0;
  jest.spyOn(React, 'useState').mockImplementation((init: any) => {
    calls++;
    if (calls === 3) return ['revtex', () => {}]; // target
    if (calls === 4) return ['en', () => {}]; // lang
    return origUseState(init);
  });
  jest.resetModules();
  ({ default: Editor } = await import('../src/components/Editor'));
  const withValues = renderToStaticMarkup(<Editor />);
  (React.useState as any).mockRestore();

  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  assert.doesNotMatch(withValues, /<button class="btn btn-primary"[^>]*disabled[^>]*>Export ZIP<\/button>/);
  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);
});
