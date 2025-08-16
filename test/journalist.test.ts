import { test, expect } from '@jest/globals';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runJournalist } from '../src/lib/workers/index.ts';

test('runJournalist creates multilingual summaries and reports', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const paperDir = path.join(dir, 'paper');
    await mkdir(paperDir, { recursive: true });
    const comparison = 'Result with equation $E=mc^2$.';
    await writeFile(path.join(paperDir, 'comparison.md'), comparison, 'utf8');

    const content = await runJournalist();

    const files = [
      'summary.md',
      'summary.en.md',
      'summary.ar.md',
      'report.en.md',
      'report.ar.md',
    ];
    for (const f of files) {
      const fc = await readFile(path.join(paperDir, f), 'utf8');
      expect(fc).toMatch(/E=mc\^2/);
    }
    expect(content).toBe(await readFile(path.join(paperDir, 'summary.md'), 'utf8'));
  } finally {
    process.chdir(prev);
  }
});

