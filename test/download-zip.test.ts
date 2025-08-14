import test from 'node:test';
import assert from 'node:assert';
import { GET } from '../src/app/api/download/zip/route';
import { NextRequest } from 'next/server';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

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

test('determinism and provenance non-empty', async () => {
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

test('reads snapshots manifest and uses v6 archive name', async () => {
  const dir = path.join(process.cwd(), 'public', 'snapshots');
  await mkdir(dir, { recursive: true });
  const manifest = [
    { timestamp: '20240101T000000', path: 'file', sha256: 'aaa' },
    { timestamp: '20240102T000000', path: 'file', sha256: 'bbb' }
  ];
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');
  const req = new NextRequest('http://localhost/api/download/zip?slug=demo&v=v1.0');
  const res = await GET(req);
  assert.strictEqual(res.status, 200);
  const disp = res.headers.get('Content-Disposition');
  assert.ok(disp && /attachment; filename="qaadi_v6_demo_v1\.0_\d{14}\.zip"/.test(disp));
  const buf = Buffer.from(await res.arrayBuffer());
  const files = unzipStore(buf);
  const determinism = JSON.parse(Buffer.from(files['determinism_matrix.json']).toString());
  assert.deepStrictEqual(determinism.matrix, [
    [1, 0],
    [0, 1]
  ]);
  await rm(path.join(dir, 'manifest.json'));
});

test('rejects path traversal attempts', async () => {
  const req = new NextRequest('http://localhost/api/download/zip?slug=../demo&v=v1.0');
  const res = await GET(req);
  assert.strictEqual(res.status, 400);
});

test('rejects path traversal in version', async () => {
  const req = new NextRequest('http://localhost/api/download/zip?slug=demo&v=../v1.0');
  const res = await GET(req);
  assert.strictEqual(res.status, 400);
});
