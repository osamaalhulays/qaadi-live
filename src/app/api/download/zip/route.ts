import { NextRequest } from "next/server";
import { makeZip, type ZipFile } from "../../../../lib/utils/zip";
import { readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

function headersZip(name: string, size: number, shaHex: string) {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename=\"${name}\"`,
    "X-Content-Type-Options": "nosniff",
    "ETag": `\"sha256:${shaHex}\"`,
    "Content-Length": String(size),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function headersJSON() {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
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
    const regPath = path.join(root, "QaadiDB", "registry.json");
    const registry = await readFile(regPath, "utf-8");
    const registrySha = crypto.createHash("sha256").update(registry).digest("hex");
    const canonicalPath = path.join(root, "QaadiDB", `theory-${slug}`, "canonical", v, "canonical.json");
    const canonical = await readFile(canonicalPath, "utf-8");
    const canonicalSha = crypto.createHash("sha256").update(canonical).digest("hex");
    const builtAt = new Date().toISOString();
    const manifest = JSON.stringify({ kind: "qaadi-ga", slug, version: v, built_at: builtAt }, null, 2);
    let matrix: number[][] = [];
    try {
      const snapPath = path.join(root, "public", "snapshots", "manifest.json");
      const snapRaw = await readFile(snapPath, "utf-8");
      const snapEntries = JSON.parse(snapRaw) as Array<{ timestamp: string; path: string; sha256: string }>;
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
    } catch {
      matrix = [[1]];
    }
    const determinism = JSON.stringify({ version: 1, matrix }, null, 2);
    const provenance = JSON.stringify(
      {
        built_at: builtAt,
        sources: [
          { path: "registry.json", sha256: registrySha },
          { path: `QaadiDB/theory-${slug}/canonical/${v}/canonical.json`, sha256: canonicalSha }
        ]
      },
      null,
      2
    );

    const files: ZipFile[] = [
      { path: "registry.json", content: registry },
      { path: `QaadiDB/theory-${slug}/canonical/${v}/canonical.json`, content: canonical },
      { path: "manifest.json", content: manifest },
      { path: "determinism_matrix.json", content: determinism },
      { path: "provenance.json", content: provenance }
    ];
    const zip = makeZip(files);
    const shaHex = crypto.createHash("sha256").update(zip).digest("hex");
    const name = `qaadi_v6_${slug}_${v}_${tsNow()}.zip`;
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: headersJSON() });
  }
}
