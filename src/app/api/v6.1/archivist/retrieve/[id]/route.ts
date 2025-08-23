import type { NextRequest } from "next/server";
import { getCard } from "../../../../../../lib/cardStore";
import { accessControl, PermissionError } from "../../../../../../lib/accessControl";
import { headers } from "@/lib/httpHeaders";

export const runtime = "nodejs";

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
  try {
    const safeCard = accessControl("archivist", card, "read");
    return new Response(
      JSON.stringify({ id: params.id, card: safeCard, version: "v6.1", tracking_id }),
      { status: 200, headers }
    );
  } catch (err) {
    if (err instanceof PermissionError) {
      return new Response(
        JSON.stringify({ error: "forbidden", version: "v6.1", tracking_id }),
        { status: 403, headers }
      );
    }
    throw err;
  }
}
