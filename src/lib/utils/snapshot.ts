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
  card_id: string;
  session_id: string;
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
  v: string,
  ctx: { card_id: string; user: string; nonce: string } = {
    card_id: "",
    user: "",
    nonce: ""
  }
) {
  const now = new Date();
  const tsDir = tsFolder(now);
  const timestamp = now.toISOString();
  const entries: SnapshotEntry[] = [];
  const covers: string[] = [];

  const safeSlug = sanitizeSlug(slug);
  const safeV = sanitizeSlug(v);
  const session_id = sha256Hex(ctx.card_id + ctx.user + ctx.nonce);

  const roleNames = [
    "secretary.md",
    "judge.json",
    "plan.md",
    "notes.txt",
    "comparison.md",
    "summary.md"
  ];
  const roleData: Record<string, Buffer> = {};
  for (const name of roleNames) {
    try {
      roleData[name] = await readFile(path.join(process.cwd(), "paper", name));
    } catch {}
  }

  if (target === "inquiry") {
    const coverSet = new Set<string>();
    if (roleData["plan.md"]) coverSet.add(sha256Hex(roleData["plan.md"]));
    if (roleData["judge.json"]) coverSet.add(sha256Hex(roleData["judge.json"]));

    const inquiryFile = files.find((f) => f.path === "paper/inquiry.json");
    if (inquiryFile) {
      try {
        const raw =
          typeof inquiryFile.content === "string"
            ? inquiryFile.content
            : Buffer.from(inquiryFile.content).toString("utf8");
        const j = JSON.parse(raw);
        if (Array.isArray(j?.questions)) {
          for (const q of j.questions) {
            if (Array.isArray(q?.covers)) {
              for (const c of q.covers) coverSet.add(c);
            }
          }
        }
      } catch {}
    }

    covers.push(...coverSet);
  }

  for (const f of files) {
    const data = typeof f.content === "string" ? Buffer.from(f.content) : Buffer.from(f.content);
    const rel = path.join("snapshots", safeSlug, safeV, tsDir, "paper", target, lang, f.path.replace(/^paper\//, ""));
    const full = path.join(process.cwd(), "public", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      slug: safeSlug,
      v: safeV,
      timestamp,
      type: "paper",
      card_id: ctx.card_id,
      session_id
    });
  }

  for (const name of roleNames) {
    const data = roleData[name];
    if (!data) continue;
    const rel = path.join("snapshots", safeSlug, safeV, tsDir, "paper", target, lang, name);
    const full = path.join(process.cwd(), "public", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      slug: safeSlug,
      v: safeV,
      timestamp,
      type: "role",
      card_id: ctx.card_id,
      session_id
    });
  }

  if (target !== "wide" && target !== "inquiry") {
    const base = path.join("snapshots", safeSlug, safeV, tsDir, "paper", target, lang);

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
      v: safeV,
      timestamp,
      type: "paper",
      card_id: ctx.card_id,
      session_id
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
      v: safeV,
      timestamp,
      type: "paper",
      card_id: ctx.card_id,
      session_id
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
  return { files: entries.map((e) => e.path), covers, session_id };
}
