import type { NextRequest } from "next/server";
import { accessControl, PermissionError } from "../../../../../../lib/accessControl";

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
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json", version: "v6.1", tracking_id: "" }),
      { status: 400, headers }
    );
  }

  const tracking_id = typeof payload?.tracking_id === "string" ? payload.tracking_id : "";
  const text = typeof payload?.text === "string" ? payload.text : "";
  try {
    accessControl("judge", null, "write");
  } catch (err) {
    if (err instanceof PermissionError) {
      return new Response(
        JSON.stringify({ error: "forbidden", version: "v6.1", tracking_id }),
        { status: 403, headers }
      );
    }
    throw err;
  }

  const score = text.length;

  return new Response(
    JSON.stringify({ result: { score }, version: "v6.1", tracking_id }),
    { status: 200, headers }
  );
}
