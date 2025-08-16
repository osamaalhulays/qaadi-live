/** @jest-environment jsdom */

import { test } from '@jest/globals';
import assert from 'node:assert';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Editor from '../src/components/Editor';

test('editor has no direct GET export link', () => {
  const markup = renderToStaticMarkup(React.createElement(Editor));
  assert.doesNotMatch(markup, /<a[^>]+href="\/api\/export"/);
});
