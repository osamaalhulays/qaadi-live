import * as assert from 'assert';
import { createSnapshot, SnapshotInput } from '../src/lib/snapshot';

async function main() {
  const files: SnapshotInput[] = [
    { target: 'demo', lang: 'en', path: 'hello.txt', content: 'hello world' },
    { target: 'demo', lang: 'ar', path: 'salam.txt', content: 'مرحبا' }
  ];
  const a = await createSnapshot(files);
  const b = await createSnapshot(files);
  const hashesA = a.manifest.map(f => f.sha256);
  const hashesB = b.manifest.map(f => f.sha256);
  assert.deepStrictEqual(hashesA, hashesB);
  console.log('idempotent hashes:', hashesA);
}

main();
