import type { NextRequest } from "next/server";
import { readFile, mkdir, readdir } from "fs/promises";
import path from "path";
import { performSelfVerification } from "@/lib/selfVerificationService";

export const runtime = "nodejs";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*"
};

export async function POST(req: NextRequest) {
  try {
    const { slug, sample } = await req.json();
    if (!slug || typeof sample !== "string") {
      return new Response(JSON.stringify({ error: "invalid_params" }), { status: 400, headers });
    }
    const log = await performSelfVerification(slug, sample);
    return new Response(JSON.stringify(log), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "fingerprints_not_found" }), { status: 500, headers });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return new Response(JSON.stringify({ error: "missing_slug" }), { status: 400, headers });
  try {
    const testsDir = path.join(process.cwd(), "QaadiVault", `theory-${slug}`, "tests");
    const files = (await readdir(testsDir)).filter((f) => f.endsWith(".json")).sort();
    const last = files[files.length - 1];
    if (!last) throw new Error("none");
    const raw = await readFile(path.join(testsDir, last), "utf-8");
    return new Response(raw, { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  }
}
