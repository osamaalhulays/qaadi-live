import { test, expect } from '@jest/globals';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Editor from '../src/components/Editor';

test('editor has no direct GET export link', () => {
  const markup = renderToStaticMarkup(React.createElement(Editor));
  expect(markup).not.toMatch(/<a[^>]+href="\/api\/export"/);
});
