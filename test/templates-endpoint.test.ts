import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/templates/route';

const base = 'http://localhost/api/templates';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const files = ['secretary.md', 'judge.json', 'plan.md', 'comparison.md'] as const;

const snippets: Record<(typeof files)[number], string> = {
  'secretary.md': '# ملخص',
  'judge.json': '"judges"',
  'plan.md': '# خطة تطويرية',
  'comparison.md': '# مقارنة مع الأطر المرجعية',
};

for (const name of files) {
  test(`serves ${name} with no-store header`, async () => {
    const prev = process.cwd();
    process.chdir(repoRoot);
    try {
      const req = new NextRequest(`${base}?name=${encodeURIComponent(name)}`);
      const res = await GET(req);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
      const body = await res.text();
      assert.ok(body.length > 0);
      assert.ok(body.includes(snippets[name]));
      if (name === 'plan.md') {
        assert.ok(body.includes('الأولوية (P0/P1/P2)'));
        assert.ok(body.includes('example.com/qn-21#'));
      }
    } finally {
      process.chdir(prev);
    }
  });
}

test('missing template returns 404', async () => {
  const prev = process.cwd();
  process.chdir(repoRoot);
  try {
    const req = new NextRequest(`${base}?name=missing.md`);
    const res = await GET(req);
    assert.strictEqual(res.status, 404);
  } finally {
    process.chdir(prev);
  }
});
