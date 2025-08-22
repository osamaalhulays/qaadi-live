import type { NextRequest } from "next/server";
import { runSecretary } from "../../../lib/workers";

export const runtime = "nodejs";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...headers,
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  let data: any;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers,
    });
  }

  const content = await runSecretary(data);
  const match = content.match(/## Identity\n([0-9a-f]{8})/);
  return new Response(JSON.stringify({ identity: match ? match[1] : "" }), {
    status: 200,
    headers,
  });
}
