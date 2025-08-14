import { NextRequest } from "next/server";
import { InputSchema, OutputSchema } from "../../../lib/schema/io";
import { runWithFallback } from "../../../lib/providers/router";
import { freezeText, restoreText, countEquations } from "../../../lib/utils/freeze";

export const runtime = "edge";

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

  const frozen = freezeText(input.text);
  const eqBefore = frozen.equations.length;

  const glossary = await loadGlossary(req);

  let prompt;
  try { prompt = buildPrompt(input.target, input.lang, frozen.text, glossary); }
  catch { return new Response(JSON.stringify({ error: "unsupported_target_lang" }), { status: 400 }); }

  try {
    const out = await runWithFallback(
      input.model === "auto" ? "auto" : (input.model as any),
      { openai: openaiKey || undefined, deepseek: deepseekKey || undefined },
      prompt,
      input.max_tokens
    );
    let text = restoreText(out.text, frozen.equations, frozen.dois);
    const eqAfter = countEquations(text);
    const final = OutputSchema.parse({
      ...out,
      text,
      checks: {
        eq_before: eqBefore,
        eq_after: eqAfter,
        eq_match: eqBefore === eqAfter,
        glossary_entries: glossary ? Object.keys(glossary).length : 0
      }
    });
    return new Response(JSON.stringify(final), {
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

function buildPrompt(
  target: "wide" | "revtex" | "inquiry",
  lang: "ar" | "en" | "tr",
  userText: string,
  glossary: Record<string, string> | null
) {
  const gloss = glossary && Object.keys(glossary).length
    ? "\nGlossary:\n" + Object.entries(glossary).map(([k,v])=>`${k} = ${v}`).join("\n")
    : "";
  if (target === "wide" && lang === "ar")
    return `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n${userText}${gloss}`;
  if (target === "inquiry" && lang === "tr")
    return `INQUIRY/TR: Qaadi Inquiry için soru seti üret. Girdi:\n${userText}${gloss}`;
  if (target === "revtex" && lang === "en")
    return `REVTEX/EN: Produce TeX draft body (no \\documentclass). Input:\n${userText}${gloss}`;
  throw new Error("unsupported_target_lang");
}

async function loadGlossary(req: NextRequest): Promise<Record<string, string> | null> {
  try {
    const url = new URL("/glossary.json", req.url);
    const r = await fetch(url.toString());
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    if (j && typeof j === "object") return j as Record<string, string>;
  } catch {}
  return null;
}
