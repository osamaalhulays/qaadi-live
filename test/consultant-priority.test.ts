import { test } from '@jest/globals';
import assert from 'node:assert';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runConsultant } from '@/lib/workers/index.ts';

test('runConsultant builds priority table with QN-21 links', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const paperDir = path.join(dir, 'paper');
    await mkdir(paperDir, { recursive: true });
    const judgeData = {
      criteria: [
        { id: 1, name: 'Method', score: 2 },
        { id: 2, name: 'Data', score: 5 },
        { id: 3, name: 'Results', score: 8 },
      ],
    };
    await writeFile(path.join(paperDir, 'judge.json'), JSON.stringify(judgeData), 'utf8');
    await runConsultant();
    const content = await readFile(path.join(paperDir, 'notes.txt'), 'utf8');
    assert.match(content, /\| Method \| P0 \| \[QN-21-1\]\(https:\/\/example.com\/qn-21#1\) \|/);
    assert.match(content, /\| Data \| P1 \| \[QN-21-2\]\(https:\/\/example.com\/qn-21#2\) \|/);
    assert.match(content, /\| Results \| P2 \| \[QN-21-3\]\(https:\/\/example.com\/qn-21#3\) \|/);
  } finally {
    process.chdir(prev);
  }
});
