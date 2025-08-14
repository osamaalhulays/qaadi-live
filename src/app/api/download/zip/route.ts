import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file");
  if (!file) {
    return new Response(JSON.stringify({ error: "file_required" }), { status: 400, headers: headersJSON() });
  }
  const filePath = path.join(process.cwd(), "public", file);
  let data: Uint8Array;
  try {
    data = await fs.readFile(filePath);
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: headersJSON() });
  }
  const shaHex = await sha256Hex(data);
  const name = path.basename(filePath);
  return new Response(data, { status: 200, headers: headersZip(name, data.byteLength, shaHex) });
}
