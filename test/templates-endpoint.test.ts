import { test, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/templates/route';
const base = 'http://localhost/api/templates';

const files = ['secretary.md', 'judge.json', 'plan.md', 'comparison.md'] as const;

const snippets: Record<(typeof files)[number], string> = {
  'secretary.md': '# ملخص',
  'judge.json': '"judges"',
  'plan.md': '# خطة تطويرية',
  'comparison.md': '# مقارنة مع الأطر المرجعية',
};

for (const name of files) {
  test(`serves ${name} with no-store header`, async () => {
    const req = new NextRequest(`${base}?name=${encodeURIComponent(name)}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
    expect(body).toContain(snippets[name]);
  });
}

test('missing template returns 404', async () => {
  const req = new NextRequest(`${base}?name=missing.md`);
  const res = await GET(req);
  expect(res.status).toBe(404);
});
