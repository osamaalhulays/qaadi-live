import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { InputSchema, OutputSchema } from "../../../lib/schema/io";
import { runWithFallback } from "../../../lib/providers/router";

// Uses Node runtime to persist files
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
      "Access-Control-Allow-Headers": "Content-Type, X-OpenAI-Key, X-DeepSeek-Key"
    }
  });
}

export async function POST(req: NextRequest) {
  let input;
  try { input = InputSchema.parse(await req.json()); }
  catch { return new Response(JSON.stringify({ error: "bad_input" }), { status: 400 }); }

  const openaiKey = req.headers.get("x-openai-key") ?? "";
  const deepseekKey = req.headers.get("x-deepseek-key") ?? "";
  if (!openaiKey && !deepseekKey) {
    return new Response(JSON.stringify({ error: "no_keys_provided" }), { status: 400 });
  }

  const prompt = buildPrompt(input.template, input.text);
  try {
    const out = await runWithFallback(
      input.model === "auto" ? "auto" : (input.model as any),
      { openai: openaiKey || undefined, deepseek: deepseekKey || undefined },
      prompt,
      input.max_tokens
    );
    const final = OutputSchema.parse(out);

    // Save generated text and update manifest
    const saved = await persistGeneration(final.text, {
      tokens_in: final.tokens_in,
      tokens_out: final.tokens_out,
      model_used: final.model_used
    });

    return new Response(JSON.stringify({ ...final, id: saved.id, file: saved.file }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: "provider_error", detail: e?.message || String(e) }), { status: 502 });
  }
}

function buildPrompt(template: "WideAR" | "ReVTeX" | "InquiryTR", userText: string) {
  if (template === "WideAR")   return `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n${userText}`;
  if (template === "InquiryTR") return `INQUIRY/TR: Qaadi Inquiry için soru seti üret. Girdi:\n${userText}`;
  return `REVTEX/EN: Produce TeX draft body (no \\documentclass). Input:\n${userText}`;
}

/* ---------- Helpers ---------- */
async function persistGeneration(text: string, meta: any) {
  const base = path.join(process.cwd(), "public", "generated");
  await fs.mkdir(base, { recursive: true });
  const id = Date.now().toString();
  const fileName = `${id}.md`;
  await fs.writeFile(path.join(base, fileName), text, "utf8");

  const manifestPath = path.join(base, "manifest.json");
  let manifest: any = { files: [] };
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {}
  manifest.files.push({ id, file: fileName, created_at: new Date().toISOString(), ...meta });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return { id, file: `/generated/${fileName}` };
}
