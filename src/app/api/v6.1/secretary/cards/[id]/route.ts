import type { NextRequest } from "next/server";
import { updateCard } from "../../../../../../lib/cardStore";
import { CardSchema, type Card } from "../../../../../../lib/schema/card";

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
      "Access-Control-Allow-Methods": "PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
  let card: Card;
  try {
    card = CardSchema.parse(payload?.card);
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_card", version: "v6.1", tracking_id }),
      { status: 400, headers }
    );
  }

  const ok = updateCard(params.id, card);
  if (!ok) {
    return new Response(
      JSON.stringify({ error: "not_found", version: "v6.1", tracking_id }),
      { status: 404, headers }
    );
  }

  return new Response(
    JSON.stringify({ id: params.id, version: "v6.1", tracking_id }),
    { status: 200, headers }
  );
}
