import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';
import { runJudge } from '../src/lib/workers';

test('runJudge computes scores and writes judge.json', async () => {
  const paperDir = path.join(process.cwd(), 'paper');
  const criteriaDir = path.join(process.cwd(), 'QaadiVault', 'criteria');
  await fs.rm(paperDir, { recursive: true, force: true });
  await fs.rm(path.join(process.cwd(), 'QaadiVault'), { recursive: true, force: true });
  await fs.mkdir(paperDir, { recursive: true });
  await fs.mkdir(criteriaDir, { recursive: true });
  await fs.writeFile(path.join(paperDir, 'draft.md'), 'This experiment used foo.');
  const custom = [
    { id: 'C1', description: 'mentions foo', weight: 2, keywords: ['foo'], enabled: true, version: 1 },
    { id: 'C2', description: 'mentions bar', weight: 3, keywords: ['bar'], enabled: true, version: 1 }
  ];
  await fs.writeFile(path.join(criteriaDir, 'latest.json'), JSON.stringify(custom));

  const res = await runJudge();

  const experiment = res.qn21.results.find((r: any) => r.code === 'experiment');
  assert.ok(experiment);
  assert.strictEqual(experiment.score, 6);
  assert.strictEqual(res.qn21.summary.classification, 'weak');

  const c1 = res.criteria.results.find((r: any) => r.id === 'C1');
  const c2 = res.criteria.results.find((r: any) => r.id === 'C2');
  assert.ok(c1 && c2);
  assert.strictEqual(c1.score, 2);
  assert.strictEqual(c2.score, 0);
  assert.strictEqual(res.criteria.summary.total, 2);
  assert.strictEqual(res.criteria.summary.classification, 'weak');

  const judgePath = path.join(paperDir, 'judge.json');
  const file = await fs.readFile(judgePath, 'utf8');
  const json = JSON.parse(file);
  assert.deepStrictEqual(json.criteria.summary, res.criteria.summary);
});
