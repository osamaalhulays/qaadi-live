import { test, afterAll } from '@jest/globals';
import assert from 'node:assert';
import { POST } from '../src/app/api/export/route';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

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

const root = process.cwd();

afterAll(async () => {
  await rm(path.join(root, 'QaadiDB'), { recursive: true, force: true });
  await rm(path.join(root, 'public'), { recursive: true, force: true });
  await rm(path.join(root, 'paper'), { recursive: true, force: true });
});

test('compose export includes identity and sha signatures', async () => {
  const theoryDir = path.join(root, 'QaadiDB', 'theory-demo');
  await mkdir(theoryDir, { recursive: true });
  const identity = { slug: 'demo', name: 'Demo' };
  await writeFile(path.join(theoryDir, 'identity.json'), JSON.stringify(identity), 'utf-8');

  const body = {
    mode: 'compose',
    name: 't.zip',
    input: { text: 'hello' },
    secretary: { audit: { ready_percent: 100, issues: [] } },
    judge: { report: { score_total: 0, criteria: [] } },
    consultant: { plan: 'plan' },
    target: 'revtex',
    lang: 'en',
    slug: 'demo',
    v: 'v1'
  };
  const req = { json: async () => body, headers: new Headers() } as any;
  const res = await POST(req);
  assert.strictEqual(res.status, 200);
  const buf = Buffer.from(await res.arrayBuffer());
  const files = unzipStore(buf);
  const manifest = JSON.parse(Buffer.from(files['paper/00_manifest.json']).toString());
  const expected = [
    'paper/10_identity.json',
    'paper/20_input.md',
    'paper/30_secretary_audit.json',
    'paper/40_judge_report.json',
    'paper/50_consultant_plan.md',
    'paper/90_build_info.json'
  ];
  for (const p of expected) {
    assert.ok(files[p]);
    const sha = crypto.createHash('sha256').update(files[p]).digest('hex');
    const entry = manifest.files.find((f: any) => f.path === p);
    assert.ok(entry);
    assert.strictEqual(entry.sha256, sha);
  }

  const snapPath = path.join(root, 'public', 'snapshots', 'manifest.json');
  const snap = JSON.parse(await readFile(snapPath, 'utf-8'));
  const idEntry = snap.find((e: any) => e.path.endsWith('10_identity.json'));
  const idSha = crypto.createHash('sha256').update(files['paper/10_identity.json']).digest('hex');
  assert.ok(idEntry && idEntry.sha256 === idSha);
});
