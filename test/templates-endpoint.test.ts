import { test, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/templates/route';

const base = 'http://localhost/api/templates';

const files = ['secretary.md', 'judge.json', 'plan.md', 'comparison.md'];

for (const name of files) {
  test(`serves ${name} with no-store header`, async () => {
    const req = new NextRequest(`${base}?name=${encodeURIComponent(name)}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = await res.text();
    expect(body).toBe('');
  });
}

test('missing template returns 404', async () => {
  const req = new NextRequest(`${base}?name=missing.md`);
  const res = await GET(req);
  expect(res.status).toBe(404);
});
