import type { NextRequest } from "next/server";
import {
  loadCriteria,
  addCriterion,
  updateCriterion,
  deleteCriterion,
} from "../../../lib/criteria";

export const runtime = "nodejs";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
};

export async function GET() {
  const criteria = await loadCriteria();
  return new Response(JSON.stringify(criteria), { status: 200, headers });
}

export async function POST(req: NextRequest) {
  try {
    const { id, description, weight, keywords, category, enabled = true } = await req.json();
    if (
      !id ||
      typeof description !== "string" ||
      typeof weight !== "number" ||
      !Array.isArray(keywords) ||
      (category !== "internal" && category !== "external" && category !== "advisory")
    ) {
      return new Response(JSON.stringify({ error: "invalid_params" }), {
        status: 400,
        headers,
      });
    }
    const criteria = await addCriterion({ id, description, weight, keywords, category, enabled });
    const added = criteria.find((c) => c.id === id);
    return new Response(JSON.stringify(added), { status: 201, headers });
  } catch {
    return new Response(JSON.stringify({ error: "invalid_params" }), {
      status: 400,
      headers,
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "missing_id" }), {
        status: 400,
        headers,
      });
    }
    const criteria = await updateCriterion(id, updates);
    const updated = criteria.find((c) => c.id === id);
    return new Response(JSON.stringify(updated), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers,
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "missing_id" }), {
        status: 400,
        headers,
      });
    }
    await deleteCriterion(id);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers,
    });
  }
}

