import { test } from '@jest/globals';
import assert from 'node:assert';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runJournalist } from '../src/lib/workers/index.ts';

test('runJournalist inserts identity, wraps math, and sets direction', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const paperDir = path.join(dir, 'paper');
    await mkdir(paperDir, { recursive: true });
    const base = 'Energy $E=mc^2$';
    await writeFile(path.join(paperDir, 'comparison.md'), base, 'utf8');
    await runJournalist();
    const en = await readFile(path.join(paperDir, 'summary.md'), 'utf8');
    const ar = await readFile(path.join(paperDir, 'summary.ar.md'), 'utf8');
    const enId = en.match(/Theory ID: (.+)/)?.[1];
    const arId = ar.match(/Theory ID: (.+)/)?.[1];
    assert.ok(enId && arId && enId === arId);
    assert.match(ar, /<div dir="rtl">/);
    assert.match(en, /<div dir="ltr">/);
    assert.match(en, /\\\(E=mc\^2\\\)/);
  } finally {
    process.chdir(prev);
  }
});
