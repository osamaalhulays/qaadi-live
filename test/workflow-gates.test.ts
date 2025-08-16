import test from 'node:test';
import assert from 'node:assert';
import { runGates, SECRETARY_REQUIRED_FIELDS } from '../src/lib/workflow';

test('reports missing secretary fields with detail', () => {
  const audit: any = { ready_percent: 70, issues: [] };
  const res = runGates({ secretary: { audit } });
  const expectedMissing = SECRETARY_REQUIRED_FIELDS.map((f) => `${f} missing`);
  assert.deepStrictEqual(res.missing, expectedMissing);
});

test('passes when all secretary fields exist', () => {
  const audit: any = {
    ready_percent: 90,
    issues: [],
    summary: 'ok',
    equations: ['E=mc^2'],
    references: ['ref1']
  };
  const res = runGates({ secretary: { audit } });
  assert.strictEqual(res.missing.length, 0);
  assert.strictEqual(res.ready_percent, 90);
});
