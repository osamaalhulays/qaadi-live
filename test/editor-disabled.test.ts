import test from 'node:test';
import assert from 'node:assert';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Editor from '../src/components/Editor';

test('generate button requires target and lang', () => {
  // initial render without target/lang -> button disabled
  const initial = renderToStaticMarkup(React.createElement(Editor));
  assert.match(initial, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);
  // render with target and lang preset -> button enabled
  const withValues = renderToStaticMarkup(
    React.createElement(Editor, { initialTarget: 'revtex', initialLang: 'en' })
  );
  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);
});
