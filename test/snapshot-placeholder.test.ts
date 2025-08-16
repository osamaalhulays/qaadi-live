import assert from 'node:assert';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { saveSnapshot } from '../src/lib/saveSnapshot';

function fakeDates() {
  const realDate = Date;
  const dates = [
    new realDate('2024-01-01T00:00:00Z'),
    new realDate('2024-01-01T00:01:00Z')
  ];
  let idx = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Date = class extends realDate {
    constructor() { super(); return dates[idx++]; }
    static now() { return dates[Math.min(idx, dates.length - 1)].getTime(); }
  } as any;
  return () => { (global as any).Date = realDate; };
}

test('placeholder files have stable fingerprints on regeneration', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  const restore = fakeDates();
  try {
    await saveSnapshot([{ path: 'paper/draft.tex', content: 'a' }], 'revtex', 'en', 'demo', 'v1');
    await saveSnapshot([{ path: 'paper/draft.tex', content: 'b' }], 'revtex', 'en', 'demo', 'v1');
  } finally {
    restore();
    process.chdir(prev);
  }
  const manifestPath = path.join(dir, 'public', 'snapshots', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const biblio = manifest.filter((e: any) => e.path.endsWith('biblio.bib') && e.slug === 'demo' && e.v === 'v1');
  const figs = manifest.filter((e: any) => e.path.endsWith('figs/') && e.slug === 'demo' && e.v === 'v1');
  assert.strictEqual(biblio.length, 2);
  assert.strictEqual(figs.length, 2);
  assert.strictEqual(new Set(biblio.map((e: any) => e.sha256)).size, 1);
  assert.strictEqual(new Set(figs.map((e: any) => e.sha256)).size, 1);
});

test('saves role files with type role', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  await mkdir('paper', { recursive: true });
  await writeFile('paper/secretary.md', 'sec');
  try {
    await saveSnapshot([{ path: 'paper/draft.tex', content: 'x' }], 'revtex', 'en', 'demo', 'v1');
  } finally {
    process.chdir(prev);
  }
  const manifestPath = path.join(dir, 'public', 'snapshots', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const role = manifest.find((e: any) => e.path.endsWith('secretary.md'));
  assert.ok(role && role.type === 'role');
});
