import { test } from '@jest/globals';
import assert from 'node:assert';
import { runGates, type SecretaryReport } from '@/lib/workflow/gates.ts';

const base: SecretaryReport = {
  abstract: 'a',
  keywords: ['k'],
  nomenclature: ['n'],
  core_equations: ['e'],
  boundary_conditions: ['b'],
  dimensional_analysis: 'd',
  limitations_risks: 'l',
  preliminary_references: ['p'],
  overflow_log: [],
  identity: 'id',
};

test('ready_percent reflects weights for missing fields', () => {
  const full = runGates({ secretary: { audit: base } });
  assert.strictEqual(full.ready_percent, 100);

  const noAbstract = runGates({ secretary: { audit: { ...base, abstract: '' } } });
  assert.strictEqual(noAbstract.ready_percent, 79);

  const noAbstractCore = runGates({
    secretary: { audit: { ...base, abstract: '', core_equations: [] } },
  });
  assert.strictEqual(noAbstractCore.ready_percent, 63);
});
