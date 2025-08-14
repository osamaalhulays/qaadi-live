import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export type SnapshotFile = { name: string; content: string | Uint8Array };
export type ManifestEntry = { path: string; sha256: string; target: string; lang: string; timestamp: string };

function pad(n: number) { return n.toString().padStart(2, '0'); }
export function formatTimestamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function writeSnapshot(files: SnapshotFile[], target: string, lang: string, timestamp = formatTimestamp()) {
  const root = path.join('snapshots', timestamp);
  const manifest: ManifestEntry[] = [];
  await mkdir(root, { recursive: true });

  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
  for (const file of sorted) {
    const relPath = path.join('paper', target, lang, file.name).replace(/\\/g, '/');
    const fullPath = path.join(root, relPath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    const data = typeof file.content === 'string' ? Buffer.from(file.content) : Buffer.from(file.content);
    await writeFile(fullPath, data);
    const sha256 = createHash('sha256').update(data).digest('hex');
    manifest.push({ path: relPath, sha256, target, lang, timestamp });
  }

  await writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { root, manifest };
}
