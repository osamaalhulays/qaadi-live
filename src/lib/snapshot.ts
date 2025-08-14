import { promises as fs } from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

export type SnapshotInput = {
  target: string;
  lang: string;
  path: string;
  content: string;
};

export type ManifestEntry = {
  path: string;
  sha256: string;
  target: string;
  lang: string;
  timestamp: string;
};

export async function createSnapshot(files: SnapshotInput[]) {
  const timestamp = new Date().toISOString();
  const baseDir = path.join(process.cwd(), 'snapshots', timestamp);
  await fs.mkdir(baseDir, { recursive: true });

  const manifest: ManifestEntry[] = [];

  for (const f of files) {
    const relPath = path.join('paper', f.target, f.lang, f.path).replace(/\\/g, '/');
    const outPath = path.join(baseDir, relPath);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, f.content, 'utf8');
    const sha256 = createHash('sha256').update(f.content).digest('hex');
    manifest.push({ path: relPath, sha256, target: f.target, lang: f.lang, timestamp });
  }

  await fs.writeFile(path.join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { dir: baseDir, manifest, timestamp };
}
