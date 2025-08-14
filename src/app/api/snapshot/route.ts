import { NextRequest } from "next/server";
import { createSnapshot, SnapshotInput } from "../../../lib/snapshot";

export const runtime = "nodejs";

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

  const files = Array.isArray(body?.files) ? (body.files as SnapshotInput[]) : null;
  if (!files || !files.length) {
    return new Response(JSON.stringify({ error: "no_files" }), { status: 400, headers: headersJSON() });
  }

  try {
    const snap = await createSnapshot(files);
    return new Response(JSON.stringify({ manifest: snap.manifest, timestamp: snap.timestamp }), {
      status: 200,
      headers: headersJSON()
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "snapshot_failed", detail: e?.message || String(e) }), {
      status: 500,
      headers: headersJSON()
    });
  }
}
