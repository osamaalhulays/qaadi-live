import type { NextRequest } from "next/server";
import { updateCard } from "../../../../../../lib/cardStore";
import { API_VERSION } from "../../../../../../lib/constants";
import { z } from "zod";

export const runtime = "nodejs";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
};

const PayloadSchema = z.object({
  tracking_id: z.string().optional(),
  card: z.unknown().optional(),
});

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
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json", version: API_VERSION, tracking_id: "" }),
      { status: 400, headers }
    );
  }

  const result = PayloadSchema.safeParse(payload);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "invalid_payload", version: API_VERSION, tracking_id: "" }),
      { status: 400, headers }
    );
  }

  const { tracking_id = "", card: cardData } = result.data;

  const card = updateCard(params.id, cardData as any);
  if (!card) {
    return new Response(
      JSON.stringify({ error: "not_found", version: API_VERSION, tracking_id }),
      { status: 404, headers }
    );
  }

  return new Response(
    JSON.stringify({ id: card.id, card, version: API_VERSION, tracking_id }),
    { status: 200, headers }
  );
}
