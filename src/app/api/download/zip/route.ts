import { NextRequest } from "next/server";
import { makeZip, type ZipFile } from "@/lib/utils/zip";
import { readFile } from "fs/promises";
import { type SnapshotEntry } from "@/lib/utils/snapshot";
import path from "path";
import crypto from "crypto";
import { headers } from "@/lib/httpHeaders";

export const runtime = "nodejs";

function headersZip(name: string, size: number, shaHex: string) {
  return {
    ...headers,
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename=\"${name}\"`,
    "ETag": `\"sha256:${shaHex}\"`,
    "Content-Length": String(size),
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function headersJSON() {
  return {
    ...headers,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: headersJSON() });
}

function tsNow() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const v = searchParams.get("v");
  if (!slug || !v) {
    return new Response(JSON.stringify({ error: "missing_params" }), { status: 400, headers: headersJSON() });
  }

  try {
    const root = process.cwd();
    const regPath = path.join(root, "QaadiDB", `theory-${slug}`, "registry.json");
    const registry = await readFile(regPath, "utf-8");
    const registrySha = crypto.createHash("sha256").update(registry).digest("hex");
    const canonicalPath = path.join(root, "QaadiDB", `theory-${slug}`, "canonical", v, "canonical.json");
    const canonical = await readFile(canonicalPath, "utf-8");
    const canonicalSha = crypto.createHash("sha256").update(canonical).digest("hex");
    const builtAt = new Date().toISOString();
    const manifest = JSON.stringify({ kind: "qaadi-ga", slug, version: v, built_at: builtAt }, null, 2);
    let snapEntries: SnapshotEntry[] = [];
    try {
      const snapPath = path.join(root, "public", "snapshots", "manifest.json");
      const snapRaw = await readFile(snapPath, "utf-8");
      snapEntries = (JSON.parse(snapRaw) as SnapshotEntry[]).filter(
        (e) => e.slug === slug && e.v === v
      );
    } catch {}

    let matrix: number[][] = [];
    if (snapEntries.length === 0) {
      matrix = [[1]];
    } else {
      const groups: Record<string, Record<string, string>> = {};
      for (const e of snapEntries) {
        if (!groups[e.timestamp]) groups[e.timestamp] = {};
        groups[e.timestamp][e.path] = e.sha256;
      }
      const stamps = Object.keys(groups).sort();
      matrix = stamps.map((a) =>
        stamps.map((b) => {
          const A = groups[a];
          const B = groups[b];
          const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
          for (const k of keys) {
            if (A[k] !== B[k]) return 0;
          }
          return 1;
        })
      );
    }
    const determinism = JSON.stringify({ version: 1, matrix }, null, 2);
    const provenance = JSON.stringify(
      {
        built_at: builtAt,
        sources: [
          { path: `QaadiDB/theory-${slug}/registry.json`, sha256: registrySha },
          { path: `QaadiDB/theory-${slug}/canonical/${v}/canonical.json`, sha256: canonicalSha }
        ]
      },
      null,
      2
    );

    const files: ZipFile[] = [
      { path: `QaadiDB/theory-${slug}/registry.json`, content: registry },
      { path: `QaadiDB/theory-${slug}/canonical/${v}/canonical.json`, content: canonical }
    ];

    if (snapEntries.length) {
      const latest = snapEntries.reduce((a, b) =>
        a.timestamp > b.timestamp ? a : b
      );
      const tsDir = latest.path.split("/")[2];
      const prefix = `snapshots/${slug}/${tsDir}/`;
      for (const e of snapEntries.filter((s) => s.path.startsWith(prefix))) {
        if (e.path.endsWith("/")) continue;
        try {
          const data = await readFile(path.join(root, "public", e.path));
          const rel = e.path.slice(prefix.length);
          files.push({ path: rel, content: data });
        } catch {}
      }
    }

    files.push({ path: "manifest.json", content: manifest });
    files.push({ path: "determinism_matrix.json", content: determinism });
    files.push({ path: "provenance.json", content: provenance });
    const zip = makeZip(files);
    const shaHex = crypto.createHash("sha256").update(zip).digest("hex");
    const name = `qaadi_v6_${slug}_${v}_${tsNow()}.zip`;
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: headersJSON() });
  }
}
