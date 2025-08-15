import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface SnapshotEntry {
  path: string;
  sha256: string;
  target: string;
  lang: string;
  timestamp: string;
  slug: string;
  v: string;
}

const slugRe = /^[a-zA-Z0-9_-]+$/;

export function sanitizeSlug(slug: string): string {
  if (!slugRe.test(slug) || slug.includes("..")) {
    throw new Error("invalid_slug");
  }
  return slug;
}

function sha256Hex(data: Uint8Array | string) {
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function tsFolder(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function saveSnapshot(
  files: { path: string; content: string | Uint8Array }[],
  target: string,
  lang: string,
  slug: string,
  v: string
) {
  const now = new Date();
  const tsDir = tsFolder(now);
  const timestamp = now.toISOString();
  const entries: SnapshotEntry[] = [];
  const covers: string[] = [];

  if (target === "inquiry") {
    try {
      const planData = await readFile(path.join(process.cwd(), "paper", "plan.md"));
      covers.push(sha256Hex(planData));
      files.push({ path: "paper/plan.md", content: planData });
    } catch {}
    try {
      const judgeData = await readFile(path.join(process.cwd(), "paper", "judge.json"));
      covers.push(sha256Hex(judgeData));
      files.push({ path: "paper/judge.json", content: judgeData });
    } catch {}
    files.push({
      path: "paper/inquiry.json",
      content: JSON.stringify({ covers }, null, 2)
    });
  }

  const safeSlug = sanitizeSlug(slug);

  for (const f of files) {
    const data = typeof f.content === "string" ? Buffer.from(f.content) : Buffer.from(f.content);
    const rel = path.join("snapshots", safeSlug, tsDir, "paper", target, lang, f.path.replace(/^paper\//, ""));
    const full = path.join(process.cwd(), "public", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      slug: safeSlug,
      v,
      timestamp
    });
  }

  if (target !== "wide" && target !== "inquiry") {
    const base = path.join("snapshots", safeSlug, tsDir, "paper", target, lang);

    const relBib = path.join(base, "biblio.bib");
    const fullBib = path.join(process.cwd(), "public", relBib);
    await mkdir(path.dirname(fullBib), { recursive: true });
    await writeFile(fullBib, "");
    entries.push({
      path: relBib.replace(/\\/g, "/"),
      sha256: sha256Hex(""),
      target,
      lang,
      slug: safeSlug,
      v,
      timestamp
    });

    const relFigs = path.join(base, "figs");
    const fullFigs = path.join(process.cwd(), "public", relFigs);
    await mkdir(fullFigs, { recursive: true });
    entries.push({
      path: (relFigs + "/").replace(/\\/g, "/"),
      sha256: sha256Hex(""),
      target,
      lang,
      slug: safeSlug,
      v,
      timestamp
    });
  }

  const manifestPath = path.join(process.cwd(), "public", "snapshots", "manifest.json");
  let manifest: SnapshotEntry[] = [];
  try {
    const existing = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(existing);
  } catch {}
  manifest.push(...entries);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return { files: entries.map((e) => e.path), covers };
}
