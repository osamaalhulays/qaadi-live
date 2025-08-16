import test from 'node:test';
import assert from 'node:assert';
import { mkdtemp } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runSecretary, runResearchSecretary } from '../src/lib/workers';

const sampleSecretary = {
  summary: 'Project overview',
  conditions: 'All prerequisites must be met',
  equations: ['E=mc^2', 'a^2 + b^2 = c^2']
};

const sampleCriteria = [
  { criterion: 'performance', plan: 'Optimize algorithms' },
  { criterion: 'usability', plan: 'Improve interface' }
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
    assert.match(fileContent, /## Conditions\nAll prerequisites must be met/);
    assert.match(fileContent, /## Equations\n- E=mc\^2\n- a\^2 \+ b\^2 = c\^2/);
  } finally {
    process.chdir(prev);
  }
});

test('runResearchSecretary writes plan files with criteria sections', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const { name, content } = await runResearchSecretary('alpha', sampleCriteria);
    const filePath = path.join(dir, 'paper', `plan-${name}.md`);
    const fileContent = await readFile(filePath, 'utf8');
    assert.strictEqual(fileContent, content);
    assert.match(fileContent, /# Plan for alpha/);
    assert.match(fileContent, /## performance\nOptimize algorithms/);
    assert.match(fileContent, /## usability\nImprove interface/);
  } finally {
    process.chdir(prev);
  }
});
