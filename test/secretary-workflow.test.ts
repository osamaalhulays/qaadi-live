import { describe, it, expect } from '@jest/globals';
import { mkdtemp, readFile } from 'node:fs/promises';
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

describe('secretary workflow', () => {
  it('runSecretary generates a complete secretary.md', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
    const prev = process.cwd();
    process.chdir(dir);
    try {
      const content = await runSecretary(sampleSecretary);
      const filePath = path.join(dir, 'paper', 'secretary.md');
      const fileContent = await readFile(filePath, 'utf8');
      expect(fileContent).toBe(content);
      expect(fileContent).toMatch(/## Summary\nProject overview/);
      expect(fileContent).toMatch(/## Conditions\nAll prerequisites must be met/);
      expect(fileContent).toMatch(/## Equations\n- E=mc\^2\n- a\^2 \+ b\^2 = c\^2/);
    } finally {
      process.chdir(prev);
    }
  });

  it('runResearchSecretary writes plan files with criteria sections', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
    const prev = process.cwd();
    process.chdir(dir);
    try {
      const { name, content } = await runResearchSecretary('alpha', sampleCriteria);
      const filePath = path.join(dir, 'paper', `plan-${name}.md`);
      const fileContent = await readFile(filePath, 'utf8');
      expect(fileContent).toBe(content);
      expect(fileContent).toMatch(/# Plan for alpha/);
      expect(fileContent).toMatch(/## performance\nOptimize algorithms/);
      expect(fileContent).toMatch(/## usability\nImprove interface/);
    } finally {
      process.chdir(prev);
    }
  });
});
