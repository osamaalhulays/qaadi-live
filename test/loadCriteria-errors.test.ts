import { loadCriteria } from '@/lib/criteria';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

describe('loadCriteria error handling', () => {
  test('warns and returns defaults when file missing', async () => {
    const orig = process.cwd();
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'criteria-missing-'));
    process.chdir(tmp);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = await loadCriteria();
      expect(result).toEqual([
        {
          id: 'SAFE',
          description: 'Safety compliance',
          weight: 5,
          keywords: ['safety', 'compliance'],
          enabled: true,
          category: 'internal',
          version: 1,
        },
      ]);
      expect(warn).toHaveBeenCalled();
      expect(warn.mock.calls[0][0]).toMatch(/not found/i);
    } finally {
      warn.mockRestore();
      process.chdir(orig);
      await rm(tmp, { recursive: true, force: true });
    }
  });

  test('throws with context on invalid JSON', async () => {
    const orig = process.cwd();
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'criteria-invalid-'));
    const critDir = path.join(tmp, 'QaadiVault', 'criteria');
    await mkdir(critDir, { recursive: true });
    await writeFile(path.join(critDir, 'latest.json'), '{invalid');
    process.chdir(tmp);
    try {
      await expect(loadCriteria()).rejects.toThrow(/Failed to parse criteria file/);
    } finally {
      process.chdir(orig);
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
