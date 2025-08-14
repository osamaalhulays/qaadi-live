import test from 'node:test';
import assert from 'node:assert';
import { POST } from '../src/app/api/generate/route';
import { NextRequest } from 'next/server';

const base = {
  target: 'wide',
  lang: 'en',
  model: 'openai',
  max_tokens: 256,
  text: 'hello'
};

async function makeReq(body: any) {
  return await POST(new NextRequest('http://localhost/api/generate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'X-OpenAI-Key': 'test' }
  } as any));
}

test('rejects when slug missing', async () => {
  const res = await makeReq({ ...base, v: 'v1' });
  assert.strictEqual(res.status, 400);
});

test('rejects when v missing', async () => {
  const res = await makeReq({ ...base, slug: 'demo' });
  assert.strictEqual(res.status, 400);
});
