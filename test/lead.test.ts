import { test, expect } from '@jest/globals';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runLead } from '../src/lib/workers/index.ts';

test('runLead merges plans and highlights best items', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const paperDir = path.join(dir, 'paper');
    await mkdir(paperDir, { recursive: true });

    const planAlpha = `# Plan for alpha\n| Item | Priority | QN-21 Criterion |\n|------|----------|-----------------|\n| Task A | P0 | Q1 |\n| Task B | P2 | Q2 |`;
    const planBeta = `# Plan for beta\n| Item | Priority | QN-21 Criterion |\n|------|----------|-----------------|\n| Task A | P1 | Q3 |\n| Task C | P0 | Q4 |`;

    await writeFile(path.join(paperDir, 'plan-alpha.md'), planAlpha, 'utf8');
    await writeFile(path.join(paperDir, 'plan-beta.md'), planBeta, 'utf8');

    const content = await runLead(['alpha', 'beta']);
    const cmpPath = path.join(paperDir, 'comparison.md');
    const fileContent = await readFile(cmpPath, 'utf8');
    expect(content).toBe(fileContent);
    expect(fileContent).toMatch(/# Comparison/);
    expect(fileContent).toMatch(/## Best Items\n- Task A \(alpha, beta\)\n- Task C \(beta\)/);
    expect(fileContent).toMatch(/## alpha/);
    expect(fileContent).toMatch(/## beta/);
  } finally {
    process.chdir(prev);
  }
});

