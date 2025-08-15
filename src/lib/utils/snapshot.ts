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
  type: "paper" | "role";
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

export const ROLE_FILES = ["secretary.md", "judge.json", "plan.md", "notes.txt", "comparison.md"];

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

  const safeSlug = sanitizeSlug(slug);

  const roleData: Record<string, Buffer> = {};
  for (const name of ROLE_FILES) {
    try {
      roleData[name] = await readFile(path.join(process.cwd(), "paper", name));
    } catch {}
  }

  if (target === "inquiry") {
    if (roleData["plan.md"]) covers.push(sha256Hex(roleData["plan.md"]));
    if (roleData["judge.json"]) covers.push(sha256Hex(roleData["judge.json"]));
    files.push({ path: "paper/inquiry.json", content: JSON.stringify({ covers }, null, 2) });
  }

  const vaultBase = path.join(process.cwd(), `QaadiVault/theory-${safeSlug}`);

  for (const f of files) {
    const name = f.path.replace(/^paper\//, "");
    const data = typeof f.content === "string" ? Buffer.from(f.content) : Buffer.from(f.content);
    const rel = path.join("snapshots", safeSlug, tsDir, "paper", target, lang, name);
    const full = path.join(process.cwd(), "public", rel);
    const vaultFull = path.join(vaultBase, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await mkdir(path.dirname(vaultFull), { recursive: true });
    await writeFile(full, data);
    await writeFile(vaultFull, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      slug: safeSlug,
      v,
      timestamp,
      type: ROLE_FILES.includes(name) ? "role" : "paper"
    });
  }

  const missingRoles = ROLE_FILES.filter((n) => !files.some((f) => f.path.replace(/^paper\//, "") === n));
  for (const name of missingRoles) {
    const data = roleData[name];
    if (!data) continue;
    const rel = path.join("snapshots", safeSlug, tsDir, "paper", target, lang, name);
    const full = path.join(process.cwd(), "public", rel);
    const vaultFull = path.join(vaultBase, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await mkdir(path.dirname(vaultFull), { recursive: true });
    await writeFile(full, data);
    await writeFile(vaultFull, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      slug: safeSlug,
      v,
      timestamp,
      type: "role"
    });
  }

  if (target !== "wide" && target !== "inquiry") {
    const base = path.join("snapshots", safeSlug, tsDir, "paper", target, lang);

    const relBib = path.join(base, "biblio.bib");
    const fullBib = path.join(process.cwd(), "public", relBib);
    const vaultBib = path.join(vaultBase, relBib);
    await mkdir(path.dirname(fullBib), { recursive: true });
    await mkdir(path.dirname(vaultBib), { recursive: true });
    await writeFile(fullBib, "");
    await writeFile(vaultBib, "");
    entries.push({
      path: relBib.replace(/\\/g, "/"),
      sha256: sha256Hex(""),
      target,
      lang,
      slug: safeSlug,
      v,
      timestamp,
      type: "paper"
    });

    const relFigs = path.join(base, "figs");
    const fullFigs = path.join(process.cwd(), "public", relFigs);
    const vaultFigs = path.join(vaultBase, relFigs);
    await mkdir(fullFigs, { recursive: true });
    await mkdir(vaultFigs, { recursive: true });
    entries.push({
      path: (relFigs + "/").replace(/\\/g, "/"),
      sha256: sha256Hex(""),
      target,
      lang,
      slug: safeSlug,
      v,
      timestamp,
      type: "paper"
    });
  }

  const manifestPath = path.join(process.cwd(), "public", "snapshots", "manifest.json");
  const vaultManifestPath = path.join(vaultBase, "snapshots", "manifest.json");
  let manifest: SnapshotEntry[] = [];
  let vaultManifest: SnapshotEntry[] = [];
  try {
    const existing = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(existing);
  } catch {}
  try {
    const existingV = await readFile(vaultManifestPath, "utf-8");
    vaultManifest = JSON.parse(existingV);
  } catch {}
  manifest.push(...entries);
  vaultManifest.push(...entries);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await mkdir(path.dirname(vaultManifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  await writeFile(vaultManifestPath, JSON.stringify(vaultManifest, null, 2));
  return { files: entries.map((e) => e.path), covers };
}
