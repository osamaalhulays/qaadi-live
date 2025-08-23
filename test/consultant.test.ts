import { test } from '@jest/globals';
import assert from 'node:assert';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runConsultant } from '@/lib/workers/index.ts';

test('runConsultant summarizes judge strengths and gaps', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const paperDir = path.join(dir, 'paper');
    await mkdir(paperDir, { recursive: true });
    const judgeData = {
      criteria: [
        { id: 1, name: 'Method', score: 5 },
        { id: 2, name: 'Data', score: 2 },
      ],
    };
    await writeFile(path.join(paperDir, 'judge.json'), JSON.stringify(judgeData), 'utf8');

    const content = await runConsultant();
    const notesPath = path.join(paperDir, 'notes.txt');
    const fileContent = await readFile(notesPath, 'utf8');
    assert.strictEqual(content, fileContent);
    assert.match(fileContent, /## Strengths\n- Method/);
    assert.match(fileContent, /## Gaps\n- Data/);
  } finally {
    process.chdir(prev);
  }
});

