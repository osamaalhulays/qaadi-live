import type { NextRequest } from "next/server";
import { createCard } from "../../../../../lib/cardStore";
import { CardSchema } from "@/lib/schema/card";

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
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json", version: "v6.1", tracking_id: "" }),
      { status: 400, headers }
    );
  }

  const tracking_id =
    typeof (payload as any)?.tracking_id === "string" ? (payload as any).tracking_id : "";

  const parsed = CardSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "invalid_request",
        details: parsed.error.issues,
        version: "v6.1",
        tracking_id,
      }),
      { status: 400, headers }
    );
  }

  const card = createCard(parsed.data.card);

  return new Response(
    JSON.stringify({ id: card.id, card, version: "v6.1", tracking_id }),
    { status: 200, headers }
  );
}
