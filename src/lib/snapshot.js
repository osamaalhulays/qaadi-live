import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

/**
 * Create snapshot files on disk.
 * @param {Array<{target:string, lang:string, content:string}>} files
 * @param {string=} ts optional timestamp (ISO-like, sanitized) for deterministic paths
 * @returns {Promise<{timestamp:string, files:Array<{path:string, sha256:string, target:string, lang:string, timestamp:string}>}>}
 */
export async function createSnapshot(files, ts) {
  const timestamp = ts || new Date().toISOString().replace(/[:.]/g, '-');
  const baseDir = join(process.cwd(), 'snapshots', timestamp);
  const manifest = [];
  for (const f of files) {
    const relPath = `paper/${f.target}/${f.lang}/draft.tex`;
    const absPath = join(baseDir, relPath);
    await fs.mkdir(dirname(absPath), { recursive: true });
    const data = Buffer.from(f.content);
    await fs.writeFile(absPath, data);
    const sha256 = createHash('sha256').update(data).digest('hex');
    manifest.push({ path: relPath, sha256, target: f.target, lang: f.lang, timestamp });
  }
  await fs.writeFile(join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { timestamp, files: manifest };
}
