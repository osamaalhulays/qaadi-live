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
    const canonicalPath = path.join(root, "QaadiDB", `theory-${slug}`, "canonical", v, "canonical.json");
    const canonical = await readFile(canonicalPath, "utf-8");
    const builtAt = new Date().toISOString();
    const manifest = JSON.stringify({ kind: "qaadi-ga", slug, version: v, built_at: builtAt }, null, 2);
    const determinism = JSON.stringify({ version: 1, matrix: [] }, null, 2);
    const provenance = JSON.stringify({ sources: [], built_at: builtAt }, null, 2);

    const files: ZipFile[] = [
      { path: "registry.json", content: registry },
      { path: `QaadiDB/theory-${slug}/canonical/${v}/canonical.json`, content: canonical },
      { path: "manifest.json", content: manifest },
      { path: "determinism_matrix.json", content: determinism },
      { path: "provenance.json", content: provenance }
    ];
    const zip = makeZip(files);
    const shaHex = crypto.createHash("sha256").update(zip).digest("hex");
    const name = `qaadi_v5_${slug}_${v}_${tsNow()}.zip`;
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: headersJSON() });
  }
}
