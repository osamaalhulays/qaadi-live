import { NextRequest } from "next/server";
import { InputSchema, OutputSchema } from "../../../lib/schema/io";
import { runWithFallback } from "../../../lib/providers/router";
import { freezeText, restoreText, countEquations } from "../../../lib/utils/freeze";
import { checkIdempotency } from "../../../lib/utils/idempotency";

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

function detectDir(s: string): "rtl" | "ltr" | "mixed" {
  const hasRTL = /[\u0600-\u06FF]/.test(s);
  const hasLTR = /[A-Za-z]/.test(s);
  if (hasRTL && hasLTR) return "mixed";
  if (hasRTL) return "rtl";
  return "ltr";
}

export async function POST(req: NextRequest) {
  let input;
  try { input = InputSchema.parse(await req.json()); }
  catch { return new Response(JSON.stringify({ error: "bad_input" }), { status: 400 }); }

  const idemKey = req.headers.get("Idempotency-Key");
  if (idemKey && !checkIdempotency(`generate:${idemKey}`, input)) {
    return new Response(JSON.stringify({ error: "idempotency_conflict" }), { status: 409 });
  }

  const openaiKey = req.headers.get("x-openai-key") ?? "";
  const deepseekKey = req.headers.get("x-deepseek-key") ?? "";
  if (!openaiKey && !deepseekKey) {
    return new Response(JSON.stringify({ error: "no_keys_provided" }), { status: 400 });
  }

  const frozen = freezeText(input.text);
  const eqBefore = frozen.equations.length;

  const glossary = await loadGlossary(req);

  let prompt;
  try {
    prompt = buildPrompt(input.target, input.lang, frozen.text, glossary);
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "unsupported_target_lang" }),
      { status: 400 }
    );
  }

  try {
    const out = await runWithFallback(
      input.model === "auto" ? "auto" : (input.model as any),
      { openai: openaiKey || undefined, deepseek: deepseekKey || undefined },
      prompt,
      input.max_tokens
    );
    let text = restoreText(out.text, frozen.equations, frozen.dois);
    const eqAfter = countEquations(text);
    const frozenOut = freezeText(text);
    const restored = restoreText(frozenOut.text, frozenOut.equations, frozenOut.dois);
    const final = OutputSchema.parse({
      ...out,
      text,
      checks: {
        eq_before: eqBefore,
        eq_after: eqAfter,
        eq_match: eqBefore === eqAfter,
        glossary_entries: glossary ? Object.keys(glossary).length : 0,
        rtl_ltr: detectDir(text),
        idempotency: restored === text
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
  target:
    | "wide"
    | "revtex"
    | "inquiry"
    | "iop"
    | "sn-jnl"
    | "elsevier"
    | "ieee"
    | "arxiv",
  lang:
    | "ar"
    | "en"
    | "tr"
    | "fr"
    | "de"
    | "es"
    | "ru"
    | "fa"
    | "zh",
  userText: string,
  glossary: Record<string, string> | null
) {
  const gloss =
    glossary && Object.keys(glossary).length
      ? "\nGlossary:\n" +
        Object.entries(glossary)
          .map(([k, v]) => `${k} = ${v}`)
          .join("\n")
      : "";

  if (target === "wide") {
    if (lang === "ar")
      return `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n${userText}${gloss}`;
    if (lang === "en")
      return `WIDE/EN: You are the Qaadi engine. Edit a wide English text intended for the paper (bundle.md). Input:\n${userText}${gloss}`;
    if (lang === "tr")
      return `WIDE/TR: Qaadi motorusun. Makale için geniş Türkçe metni düzenle (bundle.md). Girdi:\n${userText}${gloss}`;
    if (lang === "fr")
      return `WIDE/FR: Tu es le moteur Qaadi. Édite un texte français étendu destiné au papier (bundle.md). Entrée :\n${userText}${gloss}`;
    if (lang === "de")
      return `WIDE/DE: Du bist der Qaadi-Motor. Bearbeite einen ausführlichen deutschen Text für das Papier (bundle.md). Eingabe:\n${userText}${gloss}`;
    if (lang === "es")
      return `WIDE/ES: Eres el motor Qaadi. Edita texto español amplio dirigido al artículo (bundle.md). Entrada:\n${userText}${gloss}`;
    if (lang === "ru")
      return `WIDE/RU: Ты движок Qaadi. Редактируй широкий русский текст для статьи (bundle.md). Ввод:\n${userText}${gloss}`;
    if (lang === "fa")
      return `WIDE/FA: شما موتور Qaadi هستید. متن فارسی گسترده برای مقاله (bundle.md) را ویرایش کنید. ورودی:\n${userText}${gloss}`;
    if (lang === "zh")
      return `WIDE/ZH: 你是 Qaadi 引擎。编辑面向论文的中文长文 (bundle.md)。输入:\n${userText}${gloss}`;
  }
  if (target === "inquiry" && lang === "tr")
    return `INQUIRY/TR: Qaadi Inquiry için soru seti üret. Girdi:\n${userText}${gloss}`;
  if (target === "revtex" && lang === "en")
    return `REVTEX/EN: Produce TeX draft body (no \\documentclass). Input:\n${userText}${gloss}`;
  if (target === "iop" && lang === "en")
    return `IOP/EN: Produce LaTeX draft body (no \\documentclass) for IOP style. Input:\n${userText}${gloss}`;
  if (target === "sn-jnl" && lang === "en")
    return `SN-JNL/EN: Produce LaTeX draft body (no \\documentclass) for Springer Nature Journal style. Input:\n${userText}${gloss}`;
  if (target === "elsevier" && lang === "en")
    return `ELSEVIER/EN: Produce LaTeX draft body (no \\documentclass) for Elsevier class. Input:\n${userText}${gloss}`;
  if (target === "ieee" && lang === "en")
    return `IEEE/EN: Produce LaTeX draft body (no \\documentclass) for IEEE style. Input:\n${userText}${gloss}`;
  if (target === "arxiv" && lang === "en")
    return `ARXIV/EN: Produce LaTeX draft body (no \\documentclass) for arXiv submission. Input:\n${userText}${gloss}`;
  throw new Error(`unsupported_target_lang:${target}:${lang}`);
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
