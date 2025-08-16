// Tests run in the default Node environment; no DOM APIs are required.

import { test, jest } from '@jest/globals';
import assert from 'node:assert';

test('export and generate buttons require target and lang', async () => {
  const { TextEncoder, TextDecoder } = await import('util');
  // @ts-ignore
  global.TextEncoder ??= TextEncoder;
  // @ts-ignore
  global.TextDecoder ??= TextDecoder;

  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');

  // initial render without target/lang -> buttons disabled
  let Editor = (await import('../src/components/Editor')).default;
  let initial = renderToStaticMarkup(React.createElement(Editor));
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
  Editor = (await import('../src/components/Editor')).default;
  const withValues = renderToStaticMarkup(React.createElement(Editor));
  (React.useState as any).mockRestore();

  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  assert.doesNotMatch(withValues, /<button class="btn btn-primary"[^>]*disabled[^>]*>Export ZIP<\/button>/);
  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);
});
