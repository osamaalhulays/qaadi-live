import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from './route.ts';

test('health route includes storage, kv and capsule.latest', async () => {
  const res = await GET();
  const body = await res.json();

  assert.ok(body.storage, 'storage field is missing');
  assert.ok(body.kv, 'kv field is missing');
  assert.ok(body.capsule, 'capsule field is missing');
  assert.ok('latest' in body.capsule, 'capsule.latest missing');

  // When env vars are absent, ensure a message is provided
  if (body.storage.status !== 'ok') {
    assert.ok(body.storage.message, 'storage message missing');
  }
  if (body.kv.status !== 'ok') {
    assert.ok(body.kv.message, 'kv message missing');
  }
});
