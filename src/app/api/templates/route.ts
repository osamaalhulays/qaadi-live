import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { headers } from "@/lib/httpHeaders";

export const runtime = "nodejs";

const ALLOWED = new Set(["secretary.md", "judge.json", "plan.md", "comparison.md"]);

function buildHeaders(contentType: string) {
  return {
    ...headers,
    "Content-Type": contentType,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: buildHeaders("text/plain") });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name || !ALLOWED.has(name)) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: buildHeaders("application/json"),
    });
  }

  try {
    const filePath = path.join(process.cwd(), "templates", name);
    const data = await readFile(filePath);
    const contentType = name.endsWith(".json") ? "application/json" : "text/markdown";
    return new Response(data, { status: 200, headers: buildHeaders(contentType) });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: buildHeaders("application/json"),
    });
  }
}
