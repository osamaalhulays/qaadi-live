import { test } from '@jest/globals';
import assert from 'node:assert';
import { mkdtemp, cp } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { performSelfVerification } from '../src/lib/selfVerificationService.ts';

test('performSelfVerification matches stored fingerprints', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const src = path.join(prev, 'docs', 'examples', 'QaadiVault');
    await cp(src, path.join(dir, 'QaadiVault'), { recursive: true });
    const log = await performSelfVerification('demo', '');
    assert.strictEqual(log.ratio, 1);
    assert.deepStrictEqual(log.deviations, []);
  } finally {
    process.chdir(prev);
  }
});
