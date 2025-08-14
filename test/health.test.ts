import test from 'node:test';
import assert from 'node:assert';
import { GET } from '../src/app/api/health/route';

// Ensure the health endpoint exposes the complete diagnostic schema.
test('health endpoint exposes policies, storage, kv, and capsule fields', async () => {
  const res = await GET();
  assert.strictEqual(res.status, 200);
  const body = await res.json();

  assert.deepStrictEqual(body.policies, {
    byok: true,
    storage_public_read_capsules: true,
    storage_public_read_theory_zips: true
  });

  assert.ok('storage' in body);
  assert.ok('kv' in body);
  assert.ok(
    body.capsule &&
      'latest' in body.capsule &&
      'sha256' in body.capsule &&
      'ts' in body.capsule
  );
});
