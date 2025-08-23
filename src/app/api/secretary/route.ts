import type { NextRequest } from "next/server";
import { runSecretary } from "@/lib/workers";
import { accessControl, PermissionError } from "@/lib/accessControl";

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

  try {
    accessControl("secretary", null, "write");
  } catch (err) {
    if (err instanceof PermissionError) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers,
      });
    }
    throw err;
  }

  const content = await runSecretary({
    abstract: typeof data?.abstract === "string" ? data.abstract : "",
    keywords: Array.isArray(data?.keywords) ? data.keywords : [],
    nomenclature: Array.isArray(data?.nomenclature) ? data.nomenclature : [],
    boundary_conditions: Array.isArray(data?.boundary_conditions)
      ? data.boundary_conditions
      : [],
    core_equations: Array.isArray(data?.core_equations)
      ? data.core_equations
      : [],
    dimensional_analysis:
      typeof data?.dimensional_analysis === "string"
        ? data.dimensional_analysis
        : "",
    limitations_risks:
      typeof data?.limitations_risks === "string" ? data.limitations_risks : "",
    preliminary_references: Array.isArray(data?.preliminary_references)
      ? data.preliminary_references
      : [],
    overflow_log: Array.isArray(data?.overflow_log) ? data.overflow_log : [],
  });
  const match = content.match(/## Identity\n([0-9a-f]{8})/);
  return new Response(JSON.stringify({ identity: match ? match[1] : "" }), {
    status: 200,
    headers,
  });
}
