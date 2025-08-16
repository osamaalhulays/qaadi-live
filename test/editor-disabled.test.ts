/** @jest-environment jsdom */

import { test, expect } from '@jest/globals';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Editor from '../src/components/Editor';

test('export and generate buttons require target and lang', () => {
  // initial render without target/lang -> buttons disabled
  const initial = renderToStaticMarkup(React.createElement(Editor));
  expect(initial).toMatch(/<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  expect(initial).toMatch(/<button class="btn btn-primary"[^>]*disabled[^>]*>Export ZIP<\/button>/);
  expect(initial).toMatch(/<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);

  // render with target and lang preset -> buttons enabled
  const origUseState = React.useState;
  let calls = 0;
  (React as any).useState = (init: any) => {
    calls++;
    if (calls === 3) return ['revtex', () => {}]; // target
    if (calls === 4) return ['en', () => {}]; // lang
    return origUseState(init);
  };
  const withValues = renderToStaticMarkup(React.createElement(Editor));
  (React as any).useState = origUseState;

  expect(withValues).not.toMatch(/<button class="btn"[^>]*disabled[^>]*>Export \(compose demo\)<\/button>/);
  expect(withValues).not.toMatch(/<button class="btn btn-primary"[^>]*disabled[^>]*>Export ZIP<\/button>/);
  expect(withValues).not.toMatch(/<button class="btn"[^>]*disabled[^>]*>Generate<\/button>/);
});
