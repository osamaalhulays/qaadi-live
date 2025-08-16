import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/app/api/download/zip/route';
import { NextRequest } from 'next/server';
import { mkdir, writeFile, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();

before(async () => {
  const srcDB = path.join(root, 'test', 'data', 'QaadiDB');
  const destDB = path.join(root, 'QaadiDB');
  await cp(srcDB, destDB, { recursive: true });

  const srcVault = path.join(root, 'test', 'data', 'QaadiVault');
  const destVault = path.join(root, 'QaadiVault');
  await cp(srcVault, destVault, { recursive: true });
});

after(async () => {
  await rm(path.join(root, 'QaadiDB'), { recursive: true, force: true });
  await rm(path.join(root, 'QaadiVault'), { recursive: true, force: true });
});

function unzipStore(u8: Uint8Array): Record<string, Uint8Array> {
  const view32 = (i: number) => new DataView(u8.buffer, u8.byteOffset + i, 4).getUint32(0, true);
  const view16 = (i: number) => new DataView(u8.buffer, u8.byteOffset + i, 2).getUint16(0, true);
  let p = 0;
  const out: Record<string, Uint8Array> = {};
  while (p + 4 <= u8.length && view32(p) === 0x04034b50) {
    const nameLen = view16(p + 26);
    const extraLen = view16(p + 28);
    const size = view32(p + 18);
    const nameBytes = u8.slice(p + 30, p + 30 + nameLen);
    const name = Buffer.from(nameBytes).toString();
    const start = p + 30 + nameLen + extraLen;
    out[name] = u8.slice(start, start + size);
    p = start + size;
  }
  return out;
}

describe('download zip', () => {
  it('determinism and provenance non-empty', async () => {
    const req = new NextRequest('http://localhost/api/download/zip?slug=demo&v=v1.0');
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const buf = Buffer.from(await res.arrayBuffer());
    const files = unzipStore(buf);
    const determinism = JSON.parse(Buffer.from(files['determinism_matrix.json']).toString());
    const provenance = JSON.parse(Buffer.from(files['provenance.json']).toString());
    assert.ok(Array.isArray(determinism.matrix) && determinism.matrix.length > 0);
    assert.ok(Array.isArray(provenance.sources) && provenance.sources.length > 0);
  });

  it('reads snapshots manifest, filters by slug/version and uses v6 archive name', async () => {
    const dir = path.join(root, 'public', 'snapshots');
    await mkdir(dir, { recursive: true });
    const manifest = [
      { slug: 'demo', v: 'v1.0', timestamp: '20240101T000000', path: 'file', sha256: 'aaa' },
      { slug: 'demo', v: 'v1.0', timestamp: '20240102T000000', path: 'file', sha256: 'bbb' },
      { slug: 'demo', v: 'v2.0', timestamp: '20240101T000000', path: 'file', sha256: 'ccc' },
      { slug: 'other', v: 'v1.0', timestamp: '20240101T000000', path: 'file', sha256: 'ddd' }
    ];
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const req1 = new NextRequest('http://localhost/api/download/zip?slug=demo&v=v1.0');
    const res1 = await GET(req1);
    assert.strictEqual(res1.status, 200);
    const disp = res1.headers.get('Content-Disposition');
    assert.ok(disp && /attachment; filename="qaadi_v6_demo_v1\.0_\d{14}\.zip"/.test(disp));
    const buf1 = Buffer.from(await res1.arrayBuffer());
    const files1 = unzipStore(buf1);
    const determinism1 = JSON.parse(Buffer.from(files1['determinism_matrix.json']).toString());
    assert.deepStrictEqual(determinism1.matrix, [
      [1, 0],
      [0, 1]
    ]);

    const req2 = new NextRequest('http://localhost/api/download/zip?slug=demo&v=v2.0');
    const res2 = await GET(req2);
    assert.strictEqual(res2.status, 200);
    const buf2 = Buffer.from(await res2.arrayBuffer());
    const files2 = unzipStore(buf2);
    const determinism2 = JSON.parse(Buffer.from(files2['determinism_matrix.json']).toString());
    assert.deepStrictEqual(determinism2.matrix, [[1]]);

    await rm(path.join(dir, 'manifest.json'));
  });

  it('includes latest snapshot files in archive', async () => {
    const snapDir = path.join(root, 'public', 'snapshots', 'demo', '2024-01-01_0000', 'paper', 'revtex', 'en');
    await mkdir(snapDir, { recursive: true });
    const draft = Buffer.from('draft');
    const secretary = Buffer.from('secretary');
    await writeFile(path.join(snapDir, 'draft.tex'), draft);
    await writeFile(path.join(snapDir, 'secretary.md'), secretary);
    const manifest = [
      {
        path: 'snapshots/demo/2024-01-01_0000/paper/revtex/en/draft.tex',
        sha256: crypto.createHash('sha256').update(draft).digest('hex'),
        target: 'revtex',
        lang: 'en',
        slug: 'demo',
        v: 'v1.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        type: 'paper'
      },
      {
        path: 'snapshots/demo/2024-01-01_0000/paper/revtex/en/secretary.md',
        sha256: crypto.createHash('sha256').update(secretary).digest('hex'),
        target: 'revtex',
        lang: 'en',
        slug: 'demo',
        v: 'v1.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        type: 'role'
      }
    ];
    await writeFile(path.join(root, 'public', 'snapshots', 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const req = new NextRequest('http://localhost/api/download/zip?slug=demo&v=v1.0');
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const buf = Buffer.from(await res.arrayBuffer());
    const files = unzipStore(buf);
    assert.ok(files['paper/revtex/en/draft.tex']);
    assert.ok(files['paper/revtex/en/secretary.md']);

    await rm(path.join(root, 'public', 'snapshots'), { recursive: true, force: true });
  });
});
