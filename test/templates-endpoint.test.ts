import test from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/templates/route';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = 'http://localhost/api/templates';

const files = ['secretary.md', 'judge.json', 'plan.md', 'comparison.md'];
const templatesDir = path.join(process.cwd(), 'templates');

for (const name of files) {
  test(`serves ${name} with no-store header`, async () => {
    const req = new NextRequest(`${base}?name=${encodeURIComponent(name)}`);
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
    const body = await res.text();
    assert.ok(body.length > 0);
    const expected = await readFile(path.join(templatesDir, name), 'utf8');
    assert.strictEqual(body, expected);
  });
}

test('missing template returns 404', async () => {
  const req = new NextRequest(`${base}?name=missing.md`);
  const res = await GET(req);
  assert.strictEqual(res.status, 404);
});
