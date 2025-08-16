import { test, expect } from '@jest/globals';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runSecretary, runResearchSecretary } from '../src/lib/workers/index.ts';

const sampleSecretary = {
  summary: 'Project overview',
  keywords: ['analysis', 'physics'],
  tokens: ['c: speed of light', 'm: mass'],
  equations: ['E=mc^2', 'a^2 + b^2 = c^2'],
  boundary: ['t=0', 'x->∞'],
  post_analysis: 'dimensionless',
  risks: ['oversimplification'],
  predictions: ['growth'],
  testability: 'lab experiments',
  references: ['Einstein 1905', 'Pythagoras'],
};

const samplePlan = [
  { item: 'استكمال الاشتقاق', priority: 'P0', qn: 'QN-21-1' },
  { item: 'تحسين الواجهة', priority: 'P2', qn: 'QN-21-8' },
];

test('runSecretary generates a complete secretary.md', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const content = await runSecretary(sampleSecretary);
    const filePath = path.join(dir, 'paper', 'secretary.md');
    const fileContent = await readFile(filePath, 'utf8');
    expect(fileContent).toBe(content);
    expect(fileContent).toMatch(/Ready%: 100/);
    expect(fileContent).toMatch(/## Summary\nProject overview/);
    expect(fileContent).toMatch(/## Keywords\n- analysis\n- physics/);
    expect(fileContent).toMatch(/## Tokens and Definitions\n- c: speed of light\n- m: mass/);
    expect(fileContent).toMatch(/## Equations\n- E=mc\^2\n- a\^2 \+ b\^2 = c\^2/);
    expect(fileContent).toMatch(/## Boundary Conditions\n- t=0\n- x->∞/);
    expect(fileContent).toMatch(/## Post-Analysis\ndimensionless/);
    expect(fileContent).toMatch(/## Risks\n- oversimplification/);
    expect(fileContent).toMatch(/## Predictions\n- growth/);
    expect(fileContent).toMatch(/## Testability\nlab experiments/);
    expect(fileContent).toMatch(/## References\n- Einstein 1905\n- Pythagoras/);
    expect(fileContent).toMatch(/## Issues\n\s*$/);
  } finally {
    process.chdir(prev);
  }
});

test('runResearchSecretary writes plan files with QN-21 table', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const { name, content } = await runResearchSecretary('alpha', samplePlan);
    const filePath = path.join(dir, 'paper', `plan-${name}.md`);
    const fileContent = await readFile(filePath, 'utf8');
    expect(fileContent).toBe(content);
    expect(fileContent).toMatch(/# Plan for alpha/);
    expect(fileContent).toMatch(/\| Item \| Priority \| QN-21 Criterion \|\n\|------\|----------\|-----------------\|/);
    expect(fileContent).toMatch(/\| استكمال الاشتقاق \| P0 \| \[QN-21-1\]\(https:\/\/example.com\/qn-21#1\) \|/);
    expect(fileContent).toMatch(/\| تحسين الواجهة \| P2 \| \[QN-21-8\]\(https:\/\/example.com\/qn-21#8\) \|/);
  } finally {
    process.chdir(prev);
  }
});
