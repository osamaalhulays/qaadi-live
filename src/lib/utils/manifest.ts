export interface ManifestEntry {
  slug: string;
  v: string;
  timestamp: string;
  path: string;
  [key: string]: any;
}

export function latestFilesFor(list: ManifestEntry[], slug: string, v: string): string[] {
  const scoped = list.filter((f) => f.slug === slug && f.v === v);
  if (!scoped.length) return [];
  const latest = scoped.reduce((m, c) => (c.timestamp > m ? c.timestamp : m), "");
  return scoped.filter((f) => f.timestamp === latest).map((f) => f.path);
}
