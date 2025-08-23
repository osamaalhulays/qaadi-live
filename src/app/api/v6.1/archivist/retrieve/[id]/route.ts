import type { NextRequest } from "next/server";
import { getCard } from "../../../../../../lib/cardStore";

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
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tracking_id = req.nextUrl.searchParams.get("tracking_id") || "";
  const card = getCard(params.id);
  if (!card) {
    return new Response(
      JSON.stringify({ error: "not_found", version: "v6.1", tracking_id }),
      { status: 404, headers }
    );
  }
  return new Response(
    JSON.stringify({ id: params.id, card, version: "v6.1", tracking_id }),
    { status: 200, headers }
  );
}
