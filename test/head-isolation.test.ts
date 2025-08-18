import { test, expect } from '@jest/globals';
import { runHead, resetHead } from '../src/lib/workers';
import { stat, rm } from 'node:fs/promises';
import path from 'node:path';

test('AT-1/AT-5 vector store isolation', async () => {
  resetHead();
  const s1 = await runHead({ card_id: 'a1', user: 'u', nonce: 'n1' });
  const s2 = await runHead({ card_id: 'a2', user: 'u', nonce: 'n1' });
  const dir1 = path.join('/vector_db', 'qaadi_sec_a1');
  const dir2 = path.join('/vector_db', 'qaadi_sec_a2');
  await stat(dir1);
  await stat(dir2);
  expect(dir1).not.toBe(dir2);
  expect(s1.session_id).not.toBe(s2.session_id);
  for (let i = 3; i <= 10; i++) {
    await runHead({ card_id: `a${i}`, user: 'u', nonce: 'n1' });
  }
  await expect(runHead({ card_id: 'a11', user: 'u', nonce: 'n1' })).rejects.toThrow();
  for (let i = 1; i <= 10; i++) {
    await rm(path.join('/vector_db', `qaadi_sec_a${i}`), { recursive: true, force: true });
  }
  resetHead();
});

