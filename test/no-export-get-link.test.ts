import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Editor from '../src/components/Editor';

describe('Editor', () => {
  it('has no direct GET export link', () => {
    const markup = renderToStaticMarkup(React.createElement(Editor));
    assert.doesNotMatch(markup, /<a[^>]+href="\/api\/export"/);
  });
});
