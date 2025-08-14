export interface SnapshotEntry {
  path: string;
  sha256: string;
  target: string;
  lang: string;
  timestamp: string;
  slug?: string;
}
