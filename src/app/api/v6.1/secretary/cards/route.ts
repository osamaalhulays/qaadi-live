import type { NextRequest } from "next/server";
import { createCard } from "../../../../../lib/cardStore";
import { parseCardPayload } from "../../../../../lib/parseCardPayload";

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
  const result = await parseCardPayload(req);
  if ("error" in result) {
    return new Response(
      JSON.stringify({ error: result.error, version: "v6.1", tracking_id: result.tracking_id }),
      { status: 400, headers }
    );
  }

  const { card, tracking_id } = result;

  const stored = createCard(card);

  return new Response(
    JSON.stringify({ id: stored.id, card: stored, version: "v6.1", tracking_id }),
    { status: 200, headers }
  );
}
