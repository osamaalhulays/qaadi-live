import assert from 'node:assert';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { runJudge } from '../src/lib/workers/judge';
import { evaluateQN21 } from '../src/lib/q21';
import { loadCriteria, evaluateCriteria } from '../src/lib/criteria';

test('runJudge computes scores, gaps, and classification', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const text = 'The equation F = ma was derived with rigorous analysis but safety was ignored.';

    const qn21 = evaluateQN21(text);
    const custom = await loadCriteria();
    const customResults = evaluateCriteria(text, custom);
    const all = [...qn21, ...customResults];
    const expectedTotal = all.reduce((s, c) => s + c.score, 0);
    const expectedMax = all.reduce((s, c) => s + c.weight, 0);
    const expectedPercentage = expectedMax === 0 ? 0 : (expectedTotal / expectedMax) * 100;
    let expectedClassification: 'accepted' | 'needs_improvement' | 'weak' = 'weak';
    if (expectedPercentage >= 80) expectedClassification = 'accepted';
    else if (expectedPercentage >= 60) expectedClassification = 'needs_improvement';

    const result = await runJudge(text);

    assert.strictEqual(result.score.total, expectedTotal);
    assert.strictEqual(result.score.max, expectedMax);
    assert.strictEqual(result.percentage, expectedPercentage);
    assert.strictEqual(result.classification, expectedClassification);
    const safety = result.criteria.find((c: any) => c.name === 'Safety compliance');
    assert.ok(safety);
    assert.strictEqual(safety.gap, 0);

    const raw = await readFile(path.join(dir, 'paper', 'judge.json'), 'utf8');
    const saved = JSON.parse(raw);
    assert.strictEqual(saved.classification, expectedClassification);
    assert.deepStrictEqual(saved.score, result.score);
    assert.ok(Array.isArray(saved.gaps));
    assert.ok(!saved.gaps.some((g: any) => g.name === 'Safety compliance'));
  } finally {
    process.chdir(prev);
  }
});

