// Tests run in the default Node environment; no DOM APIs are required.

import { test } from '@jest/globals';
import assert from 'node:assert';

test('editor has no direct GET export link', async () => {
  const { TextEncoder, TextDecoder } = await import('util');
  // @ts-ignore
  global.TextEncoder ??= TextEncoder;
  // @ts-ignore
  global.TextDecoder ??= TextDecoder;

  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const Editor = (await import('../src/components/Editor')).default;

  const markup = renderToStaticMarkup(React.createElement(Editor));
  assert.doesNotMatch(markup, /<a[^>]+href="\/api\/export"/);
});
