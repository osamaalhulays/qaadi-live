import type { NextRequest } from "next/server";
import { createCard } from "../../../../../lib/cardStore";
import { z } from "zod";
import { headers } from "@/lib/httpHeaders";

export const runtime = "nodejs";

const PayloadSchema = z.object({
  tracking_id: z.string().optional(),
  card: z.unknown().optional(),
});

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

  const result = PayloadSchema.safeParse(payload);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "invalid_payload", version: "v6.1", tracking_id: "" }),
      { status: 400, headers }
    );
  }

  const { tracking_id = "", card: cardData } = result.data;

  const card = createCard(cardData);

  return new Response(
    JSON.stringify({ id: card.id, card, version: "v6.1", tracking_id }),
    { status: 200, headers }
  );
}
