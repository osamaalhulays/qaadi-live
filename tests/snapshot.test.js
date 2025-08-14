import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnapshot } from '../src/lib/snapshot.js';
import { rm } from 'fs/promises';
import { join } from 'path';

test('snapshot generation is idempotent', async () => {
  const files = [{ target: 'demo', lang: 'en', content: 'hello world' }];
  const first = await createSnapshot(files);
  const second = await createSnapshot(files);
  assert.equal(first.files[0].sha256, second.files[0].sha256);
  // cleanup
  await rm(join('snapshots', first.timestamp), { recursive: true, force: true });
  await rm(join('snapshots', second.timestamp), { recursive: true, force: true });
});
