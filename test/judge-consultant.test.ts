import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { runJudge, runConsultant } from '../src/lib/utils/review';
import { saveSnapshot } from '../src/lib/utils/snapshot';

test('judge and consultant workflow saves artifacts', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    await mkdir('paper', { recursive: true });
    await runJudge([
      { category: 'internal', score: 3, gap: 'Missing references' },
      { category: 'external', score: 2, gap: 'Need experiments' },
      { category: 'internal', score: 5 }
    ]);
    await runConsultant();
    const judge = JSON.parse(await readFile(path.join('paper', 'judge.json'), 'utf-8'));
    assert.strictEqual(judge.score_total, 10);
    assert.deepStrictEqual(judge.gaps, {
      internal: ['Missing references'],
      external: ['Need experiments']
    });
    const plan = await readFile(path.join('paper', 'plan.md'), 'utf-8');
    assert(plan.includes('[P0] Missing references'));
    assert(plan.includes('[P1] Need experiments'));
    assert(plan.includes('[P2]'));
    await saveSnapshot([
      { path: 'paper/inquiry.md', content: 'hello' }
    ], 'inquiry', 'en', 'demo', 'v1');
    const manifestPath = path.join('public', 'snapshots', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const paths = manifest.map((e: any) => e.path);
    assert(paths.some((p: string) => p.endsWith('/plan.md')));
    assert(paths.some((p: string) => p.endsWith('/judge.json')));
  } finally {
    process.chdir(prev);
  }
});
