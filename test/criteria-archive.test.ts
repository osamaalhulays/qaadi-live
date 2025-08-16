import assert from 'node:assert';
import {
  loadCriteria,
  addCriterion,
  updateCriterion,
  listArchivedCriteria,
  restoreCriteria,
  deleteCriterion
} from '../src/lib/criteria';

// Tests that archived criteria snapshots can be restored
// without affecting the permanent QN-21 specification.
test('restoreCriteria reverts to archived snapshot', async () => {
  const start = await loadCriteria();
  const beforeArchives = await listArchivedCriteria();

  await addCriterion({
    id: 'ARCH',
    description: 'Archive test',
    weight: 1,
    keywords: ['arch'],
    category: 'advisory',
    enabled: true
  });
  const afterAdd = await loadCriteria();

  await updateCriterion('ARCH', { description: 'Archive updated' });
  await loadCriteria();

  const archives = await listArchivedCriteria();
  const newArchives = archives.slice(beforeArchives.length);
  assert.ok(newArchives.length >= 2);

  // restore to state after addition (first new archive)
  await restoreCriteria(newArchives[0]);
  const restored = await loadCriteria();
  assert.deepStrictEqual(restored, afterAdd);

  await deleteCriterion('ARCH');
  const final = await loadCriteria();
  assert.deepStrictEqual(final, start);
});
