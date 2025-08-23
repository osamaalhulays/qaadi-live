import { test } from '@jest/globals';
import assert from 'node:assert';
import { accessControl, PermissionError } from '@/lib/accessControl';

test('secretary can write', () => {
  const card = { id: '1', data: { a: 1 } };
  const result = accessControl('secretary', card, 'write');
  assert.strictEqual(result, card);
});

test('archivist read returns frozen copy', () => {
  const card = { id: '2', data: { a: 1 } };
  const copy = accessControl('archivist', card, 'read') as any;
  assert.deepStrictEqual(copy, card);
  assert.notStrictEqual(copy, card);
  assert.ok(Object.isFrozen(copy));
});

test('archivist cannot write', () => {
  const card = { id: '3', data: { a: 1 } };
  assert.throws(() => accessControl('archivist', card, 'write'), PermissionError);
});

test('judge invalid action throws', () => {
  const card = { id: '4', data: {} };
  assert.throws(() => accessControl('judge', card, 'delete'), PermissionError);
});
