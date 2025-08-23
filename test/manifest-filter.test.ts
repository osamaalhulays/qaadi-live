import { test } from '@jest/globals';
import assert from 'node:assert';
import { latestFilesFor, ManifestEntry } from '@/lib/utils/manifest';

test('returns only files from requested version', () => {
  const manifest: ManifestEntry[] = [
    { slug: 'demo', v: 'v1', timestamp: '20240101T000000', path: 'v1/old.md' },
    { slug: 'demo', v: 'v1', timestamp: '20240102T000000', path: 'v1/newer.md' },
    { slug: 'demo', v: 'v2', timestamp: '20240103T000000', path: 'v2/only.md' },
    { slug: 'demo', v: 'v2', timestamp: '20240104T000000', path: 'v2/latest.md' },
  ];
  const files = latestFilesFor(manifest, 'demo', 'v2');
  assert.deepStrictEqual(files, ['v2/latest.md']);
});
