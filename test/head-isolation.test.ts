import { test, expect } from '@jest/globals';
import {
  runHead,
  resetHead,
  runResearchCenter,
  activeHeadSessions,
} from '../src/lib/workers';
import { stat, rm, readFile, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

test('AT-1/AT-5 vector store isolation', async () => {
  resetHead();
  const base = await mkdtemp(path.join(tmpdir(), 'vector-'));
  process.env.VECTOR_DB = base;
  const s1 = await runHead({ card_id: 'a1', user: 'u', nonce: 'n1' });
  const s2 = await runHead({ card_id: 'a2', user: 'u', nonce: 'n1' });
  const dir1 = path.join(base, 'qaadi_sec_a1');
  const dir2 = path.join(base, 'qaadi_sec_a2');
  await stat(dir1);
  await stat(dir2);
  expect(dir1).not.toBe(dir2);
  expect(s1.session_id).not.toBe(s2.session_id);
  for (let i = 3; i <= 10; i++) {
    await runHead({ card_id: `a${i}`, user: 'u', nonce: 'n1' });
  }
  await expect(runHead({ card_id: 'a11', user: 'u', nonce: 'n1' })).rejects.toThrow();
  for (let i = 1; i <= 10; i++) {
    await rm(path.join(base, `qaadi_sec_a${i}`), { recursive: true, force: true });
  }
  await rm(base, { recursive: true, force: true });
  delete process.env.VECTOR_DB;
  resetHead();
});

test('research center prevents data leakage between cards', async () => {
  resetHead();
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const plans = {
    alpha: [{ item: 'Alpha item', priority: 'P0', qn: 'QN-21-A1' }],
    beta: [{ item: 'Beta item', priority: 'P1', qn: 'QN-21-B1' }],
  } as const;
  await runResearchCenter(plans, dir);
  const alphaPlan = await readFile(path.join(dir, 'paper', 'plan-alpha.md'), 'utf8');
  const betaPlan = await readFile(path.join(dir, 'paper', 'plan-beta.md'), 'utf8');
  expect(alphaPlan).toContain('Alpha item');
  expect(alphaPlan).not.toContain('Beta item');
  expect(betaPlan).toContain('Beta item');
  expect(betaPlan).not.toContain('Alpha item');
  const cmp = await readFile(path.join(dir, 'paper', 'comparison.md'), 'utf8');
  expect(cmp).toContain('Alpha item');
  expect(cmp).toContain('Beta item');
  expect(activeHeadSessions()).toEqual([]);
  await rm(dir, { recursive: true, force: true });
});

