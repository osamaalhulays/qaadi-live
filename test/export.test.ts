import test from 'node:test';
import assert from 'node:assert';
import { POST } from '../src/app/api/export/route';
import { NextRequest } from 'next/server';

// Ensure malformed slugs with path traversal are rejected
// even before files are processed.
test('rejects path traversal in slug', async () => {
  const body = {
    mode: 'raw',
    slug: '../bad',
    files: [{ path: 'paper/dummy.txt', content: '' }]
  };
  const req = new NextRequest('http://localhost/api/export', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
  const res = await POST(req);
  assert.strictEqual(res.status, 400);
});
