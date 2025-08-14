import test from 'node:test';
import assert from 'node:assert';
import { saveSnapshot } from '../src/lib/utils/snapshot';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const baseDir = path.join(process.cwd(), 'public', 'snapshots');

test('saveSnapshot writes manifest and returns paths', async () => {
  await rm(baseDir, { recursive: true, force: true });
  const files = [{ path: 'paper/foo.txt', content: 'hello' }];
  const paths = await saveSnapshot(files, 'wide', 'en', 'demo');
  assert.strictEqual(paths.length, 1);
  assert.ok(paths[0].includes('snapshots/demo'));
  assert.ok(paths[0].endsWith('paper/wide/en/foo.txt'));
  const manifest = JSON.parse(await readFile(path.join(baseDir, 'manifest.json'), 'utf-8'));
  assert.strictEqual(manifest.length, 1);
  assert.strictEqual(manifest[0].path, paths[0]);
  assert.strictEqual(manifest[0].slug, 'demo');
  await rm(baseDir, { recursive: true, force: true });
});
