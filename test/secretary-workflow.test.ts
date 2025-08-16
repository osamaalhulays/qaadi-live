import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runSecretary, runResearchSecretary } from '../src/lib/workers/index.ts';

const sampleSecretary = {
  summary: 'Project overview',
  conditions: ['All prerequisites must be met', 'Environment ready'],
  equations: ['E=mc^2', 'a^2 + b^2 = c^2'],
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
    assert.strictEqual(fileContent, content);
    assert.match(fileContent, /## Summary\nProject overview/);
    assert.match(
      fileContent,
      /## Conditions\n- All prerequisites must be met\n- Environment ready/
    );
    assert.match(
      fileContent,
      /## Equations\n- E=mc\^2\n- a\^2 \+ b\^2 = c\^2/
    );
    assert.match(
      fileContent,
      /## References\n- Einstein 1905\n- Pythagoras/
    );
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
    assert.strictEqual(fileContent, content);
    assert.match(fileContent, /# Plan for alpha/);
    assert.match(
      fileContent,
      /\| Item \| Priority \| QN-21 Criterion \|\n\|------\|----------\|-----------------\|/
    );
    assert.match(
      fileContent,
      /\| استكمال الاشتقاق \| P0 \| \[QN-21-1\]\(https:\/\/example.com\/qn-21#1\) \|/
    );
    assert.match(
      fileContent,
      /\| تحسين الواجهة \| P2 \| \[QN-21-8\]\(https:\/\/example.com\/qn-21#8\) \|/
    );
  } finally {
    process.chdir(prev);
  }
});
