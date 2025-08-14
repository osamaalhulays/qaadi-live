import test from 'node:test';
import assert from 'node:assert';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Editor from '../src/components/Editor';

test('generate and compose export buttons require slug/version, target and lang', () => {
  // initial render without slug/v/target/lang -> buttons disabled
  const initial = renderToStaticMarkup(React.createElement(Editor));
  assert.match(initial, /<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  assert.match(initial, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);

  // render with slug, v, target and lang preset -> buttons enabled
  const origUseState = React.useState;
  let calls = 0;
  (React as any).useState = (init: any) => {
    calls++;
    if (calls === 3) return ['demo', () => {}]; // slug
    if (calls === 4) return ['v1', () => {}]; // version
    if (calls === 5) return ['revtex', () => {}]; // target
    if (calls === 6) return ['en', () => {}]; // lang
    return origUseState(init);
  };
  const withValues = renderToStaticMarkup(React.createElement(Editor));
  (React as any).useState = origUseState;

  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  assert.doesNotMatch(withValues, /<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);
});
