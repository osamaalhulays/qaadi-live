import { NextRequest } from "next/server";
import { makeZip, type ZipFile } from "../../../../lib/utils/zip";

export const runtime = "edge";

function headersZip(name: string, size: number, shaHex: string) {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${name}"`,
    "X-Content-Type-Options": "nosniff",
    "ETag": `"sha256:${shaHex}"`,
    "Content-Length": String(size),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function headersJSON() {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

async function sha256Hex(u8: Uint8Array) {
  const d = await crypto.subtle.digest("SHA-256", u8);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: headersJSON() });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad_input" }), { status: 400, headers: headersJSON() });
  }

  const files = Array.isArray(body?.files) ? (body.files as ZipFile[]) : null;
  const name = typeof body?.name === "string" ? body.name : "snapshot.zip";
  if (!files || !files.length) {
    return new Response(JSON.stringify({ error: "no_files" }), { status: 400, headers: headersJSON() });
  }
  const zip = makeZip(files);
  const shaHex = await sha256Hex(zip);
  return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
}
