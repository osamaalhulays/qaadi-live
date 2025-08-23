import { test } from '@jest/globals';
import assert from 'node:assert';
import { accessControl, PermissionError } from '@/lib/accessControl';
import type { Card } from '@/lib/schema/card';

test('secretary can write', () => {
  const card: Card = { id: '1', data: { a: 1 }, version: '1.0', status: 'open', parent_id: null, date_created: '', last_modified: '' };
  const result = accessControl('secretary', card, 'write');
  assert.strictEqual(result, card);
});

test('archivist read returns frozen copy', () => {
  const card: Card = { id: '2', data: { a: 1 }, version: '1.0', status: 'open', parent_id: null, date_created: '', last_modified: '' };
  const copy = accessControl('archivist', card, 'read') as Card;
  assert.deepStrictEqual(copy, card);
  assert.notStrictEqual(copy, card);
  assert.ok(Object.isFrozen(copy));
});

test('archivist cannot write', () => {
  const card: Card = { id: '3', data: { a: 1 }, version: '1.0', status: 'open', parent_id: null, date_created: '', last_modified: '' };
  assert.throws(() => accessControl('archivist', card, 'write'), PermissionError);
});

test('judge invalid action throws', () => {
  const card: Card = { id: '4', data: {}, version: '1.0', status: 'open', parent_id: null, date_created: '', last_modified: '' };
  assert.throws(() => accessControl('judge', card, 'delete'), PermissionError);
});
