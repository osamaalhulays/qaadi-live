import { test } from '@jest/globals';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { GET } from '@/app/api/templates/route';
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
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
      const body = await res.text();
      assert.ok(body.length > 0);
      assert.ok(body.includes(snippets[name]));
      if (name === 'plan.md') {
        assert.ok(body.includes('الأولوية (P0/P1/P2)'));
        assert.ok(body.includes('example.com/qn-21#'));
      }
    });
  }

test('missing template returns 404', async () => {
  const req = new NextRequest(`${base}?name=missing.md`);
  const res = await GET(req);
  assert.strictEqual(res.status, 404);
});

test('documentation files exist', () => {
  const root = process.cwd();
  const qn21 = readFileSync(path.join(root, 'docs', 'qn21-criteria.md'), 'utf8');
  const gate = readFileSync(path.join(root, 'docs', 'gate-stack.md'), 'utf8');
  assert.ok(qn21.includes('QN21 Criteria'));
  assert.ok(gate.includes('Gate Stack'));
});
