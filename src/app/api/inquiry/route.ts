import { NextRequest } from "next/server";
import { z } from "zod";
import { generateInquiryFromPlan, Lang } from "@/lib/utils/inquiry";
import { saveSnapshot } from "@/lib/utils/snapshot";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

const InputSchema = z.object({
  lang: z.enum(["ar", "en"]),
  plan: z.string().optional(),
  slug: z.string().default("default"),
  v: z.string().default("default")
});

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "bad_input" }), { status: 400 }); }

  let input;
  try { input = InputSchema.parse(body); }
  catch { return new Response(JSON.stringify({ error: "bad_input" }), { status: 400 }); }

  let planText = input.plan;
  if (!planText) {
    try {
      planText = await readFile(path.join(process.cwd(), "paper", "plan.md"), "utf8");
    } catch {
      planText = "";
    }
  }

  const { markdown, questions } = generateInquiryFromPlan(planText, input.lang as Lang);

  const files = [
    { path: "paper/inquiry.md", content: markdown },
    { path: "paper/inquiry.json", content: JSON.stringify({ questions }, null, 2) }
  ];

  let saved;
  try {
    saved = await saveSnapshot(files, "inquiry", input.lang, input.slug, input.v);
  } catch (e:any) {
    return new Response(JSON.stringify({ error: "snapshot_failed", detail: e?.message || String(e) }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ text: markdown, questions, files: saved.files, covers: saved.covers }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
