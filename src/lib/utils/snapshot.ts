import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { sha256Hex } from "./crypto";

function tsFolder(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function saveSnapshot(
  files: { path: string; content: string | Uint8Array }[],
  target: string,
  lang: string
) {
  const now = new Date();
  const tsDir = tsFolder(now);
  const timestamp = now.toISOString();
  const entries: any[] = [];

  if (target === "inquiry") {
    const covers: Record<string, string> = {};
    try {
      const planData = await readFile(path.join(process.cwd(), "paper", "plan.md"));
      covers.plan = sha256Hex(planData);
    } catch {}
    try {
      const judgeData = await readFile(path.join(process.cwd(), "paper", "judge.json"));
      covers.judge = sha256Hex(judgeData);
    } catch {}
    files.push({
      path: "paper/inquiry.json",
      content: JSON.stringify({ covers }, null, 2)
    });
  }

  for (const f of files) {
    const data = typeof f.content === "string" ? Buffer.from(f.content) : Buffer.from(f.content);
    const rel = path.join("snapshots", tsDir, "paper", target, lang, f.path.replace(/^paper\\//, ""));
    const full = path.join(process.cwd(), "public", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      timestamp
    });
  }

  if (target !== "wide" && target !== "inquiry") {
    const base = path.join("snapshots", tsDir, "paper", target, lang);

    const relBib = path.join(base, "biblio.bib");
    const fullBib = path.join(process.cwd(), "public", relBib);
    await mkdir(path.dirname(fullBib), { recursive: true });
    await writeFile(fullBib, "");
    entries.push({
      path: relBib.replace(/\\/g, "/"),
      sha256: sha256Hex(""),
      target,
      lang,
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
      timestamp
    });
  }

  const manifestPath = path.join(process.cwd(), "public", "snapshots", "manifest.json");
  let manifest: any[] = [];
  try {
    const existing = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(existing);
  } catch {}
  manifest.push(...entries);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return entries.map((e) => e.path);
}

