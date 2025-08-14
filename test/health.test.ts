import test from 'node:test';
import assert from 'node:assert';
import { GET } from '../src/app/api/health/route';

// Ensure the health endpoint exposes additional diagnostic fields.
test('health endpoint includes storage, kv, and capsule.latest', async () => {
  const res = await GET();
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok('storage' in body);
  assert.ok('kv' in body);
  assert.ok(body.capsule && 'latest' in body.capsule);
});
