import type { Target, Lang } from "../schema/io";

export interface SnapshotEntry {
  path: string;
  sha256: string;
  target: Target;
  lang: Lang;
  timestamp: string;
  slug?: string;
}

const slugRe = /^[a-zA-Z0-9_-]+$/;

export function sanitizeSlug(slug: string): string {
  if (!slugRe.test(slug) || slug.includes("..")) {
    throw new Error("invalid_slug");
  }
  return slug;
}
