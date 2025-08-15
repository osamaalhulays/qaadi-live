import test from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/templates/route';

const base = 'http://localhost/api/templates';

const files = ['secretary.md', 'judge.json', 'plan.md', 'comparison.md'];

for (const name of files) {
  test(`serves ${name} with no-store header`, async () => {
    const req = new NextRequest(`${base}?name=${encodeURIComponent(name)}`);
    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
    const body = await res.text();
    assert.strictEqual(body, '');
  });
}

test('missing template returns 404', async () => {
  const req = new NextRequest(`${base}?name=missing.md`);
  const res = await GET(req);
  assert.strictEqual(res.status, 404);
});
