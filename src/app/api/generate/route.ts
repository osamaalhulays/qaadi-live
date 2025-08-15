import { NextRequest } from "next/server";
import { InputSchema, OutputSchema } from "../../../lib/schema/io";
import { runWithFallback } from "../../../lib/providers/router";
import { freezeText, restoreText, countEquations, FrozenText } from "../../../lib/utils/freeze";
import { checkIdempotency } from "../../../lib/utils/idempotency";
import { saveSnapshot } from "../../../lib/utils/snapshot";
import fs from "fs/promises";
import path from "path";
import {
  runSecretary,
  runResearchSecretary,
  runJudge,
  runConsultant,
  runLead,
  runJournalist
} from "../../../lib/workers";

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

function detectDir(s: string): "rtl" | "ltr" | "mixed" {
  const hasRTL = /[\u0600-\u06FF]/.test(s);
  const hasLTR = /[A-Za-z]/.test(s);
  if (hasRTL && hasLTR) return "mixed";
  if (hasRTL) return "rtl";
  return "ltr";
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("workflow") === "orchestrator") {
    const body: any = await req.json().catch(() => ({}));
    const cards = Array.isArray(body.cards) ? body.cards.slice(0, 10) : [];
    const names = cards.map((c: any) => String(c?.name || "card"));
    const target = body.target || "workflow";
    const lang = body.lang || "en";
    const slug = body.slug || "demo";
    const v = body.v || "v1";

    const sec = await runSecretary();
    await saveSnapshot([{ path: "paper/secretary.md", content: sec }], target, lang, slug, v);

    for (const name of names) {
      const plan = await runResearchSecretary(name);
      await saveSnapshot(
        [{ path: `paper/plan-${plan.name}.md`, content: plan.content }],
        target,
        lang,
        slug,
        v
      );
    }

    const judge = await runJudge();
    await saveSnapshot(
      [{ path: "paper/judge.json", content: JSON.stringify(judge, null, 2) }],
      target,
      lang,
      slug,
      v
    );

    const notes = await runConsultant();
    await saveSnapshot(
      [{ path: "paper/notes.txt", content: notes }],
      target,
      lang,
      slug,
      v
    );

    const comparison = await runLead(names);
    await saveSnapshot(
      [{ path: "paper/comparison.md", content: comparison }],
      target,
      lang,
      slug,
      v
    );

    const summary = await runJournalist();
    await saveSnapshot(
      [{ path: "paper/summary.md", content: summary }],
      target,
      lang,
      slug,
      v
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  let input;
  try { input = InputSchema.parse(await req.json()); }
  catch { return new Response(JSON.stringify({ error: "bad_input" }), { status: 400 }); }
  const { slug, v } = input;

  const idemKey = req.headers.get("Idempotency-Key");
  if (idemKey && !checkIdempotency(`generate:${idemKey}`, input)) {
    return new Response(JSON.stringify({ error: "idempotency_conflict" }), { status: 409 });
  }

  const openaiKey = req.headers.get("x-openai-key") ?? "";
  const deepseekKey = req.headers.get("x-deepseek-key") ?? "";
  if (!openaiKey && !deepseekKey) {
    return new Response(JSON.stringify({ error: "no_keys_provided" }), { status: 400 });
  }

  const glossary = await loadGlossary(req);

  let prompt: string;
  let frozen: FrozenText;
  try {
    ({ prompt, frozen } = buildPrompt(
      input.target,
      input.lang,
      input.text,
      glossary
    ));
  } catch (e: any) {
    if (e?.message === "unsupported_inquiry_lang") {
      return new Response(
        JSON.stringify({ error: "unsupported_inquiry_lang", detail: input.lang }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: e?.message || "unsupported_target_lang" }),
      { status: 400 }
    );
  }

  const eqBefore = frozen.equations.length;

  try {
    const out = await runWithFallback(
      input.model === "auto" ? "auto" : (input.model as any),
      { openai: openaiKey || undefined, deepseek: deepseekKey || undefined },
      prompt,
      input.max_tokens
    );
    let text = restoreText(out.text, frozen.equations, frozen.dois, frozen.codes);
    const eqAfter = countEquations(text);
    const frozenOut = freezeText(text);
    const restored = restoreText(
      frozenOut.text,
      frozenOut.equations,
      frozenOut.dois,
      frozenOut.codes
    );
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

    const fileName =
      input.target === "wide"
        ? "bundle.md"
        : input.target === "inquiry"
        ? "inquiry.md"
        : "draft.tex";
    const files = [{ path: `paper/${fileName}`, content: final.text }];
    let saved: string[] = [];
    let covers: string[] = [];
    try {
      const res = await saveSnapshot(files, input.target, input.lang, slug, v);
      saved = res.files;
      covers = res.covers;
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "snapshot_failed", detail: e?.message || String(e) }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ ...final, files: saved, covers }), {
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

export { saveSnapshot };

export function buildPrompt(
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
    | "es"
    | "de"
    | "ru"
    | "zh-Hans"
    | "ja"
    | "other",
  userText: string,
  glossary: Record<string, string> | null
): { prompt: string; frozen: FrozenText } {
  const frozen = freezeText(userText);
  const gloss =
    glossary && Object.keys(glossary).length
      ? "\nGlossary:\n" +
        Object.entries(glossary)
          .map(([k, v]) => `${k} = ${v}`)
          .join("\n")
      : "";

  if (target === "wide") {
    if (lang === "ar")
      return { prompt: `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n${frozen.text}${gloss}`, frozen };
    if (lang === "en")
      return { prompt: `WIDE/EN: You are the Qaadi engine. Edit a wide English text intended for the paper (bundle.md). Input:\n${frozen.text}${gloss}`, frozen };
    if (lang === "tr")
      return { prompt: `WIDE/TR: Qaadi motorusun. Makale için geniş Türkçe metni düzenle (bundle.md). Girdi:\n${frozen.text}${gloss}`, frozen };
    if (lang === "fr")
      return { prompt: `WIDE/FR: Tu es le moteur Qaadi. Édite un texte français étendu destiné au papier (bundle.md). Entrée :\n${frozen.text}${gloss}`, frozen };
    if (lang === "de")
      return { prompt: `WIDE/DE: Du bist der Qaadi-Motor. Bearbeite einen ausführlichen deutschen Text für das Papier (bundle.md). Eingabe:\n${frozen.text}${gloss}`, frozen };
    if (lang === "es")
      return { prompt: `WIDE/ES: Eres el motor Qaadi. Edita texto español amplio dirigido al artículo (bundle.md). Entrada:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ru")
      return { prompt: `WIDE/RU: Ты движок Qaadi. Редактируй широкий русский текст для статьи (bundle.md). Ввод:\n${frozen.text}${gloss}`, frozen };
    if (lang === "zh-Hans")
      return { prompt: `WIDE/ZH-HANS: 你是 Qaadi 引擎。编辑面向论文的中文长文 (bundle.md)。输入:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ja")
      return { prompt: `WIDE/JA: あなたは Qaadi エンジンです。論文用の日本語の長文を編集してください (bundle.md)。入力:\n${frozen.text}${gloss}`, frozen };
    if (lang === "other")
      return { prompt: `WIDE/OTHER: You are the Qaadi engine. Edit a long text in its original language intended for the paper (bundle.md). Input:\n${frozen.text}${gloss}`, frozen };
  }
  if (target === "inquiry") {
    if (lang === "ar")
      return { prompt: `INQUIRY/AR: أنت محرّك Qaadi. أجب على استفسار عربي موجه للورقة (inquiry.md). المدخل:\n${frozen.text}${gloss}`, frozen };
    if (lang === "en")
      return { prompt: `INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\n${frozen.text}${gloss}`, frozen };
    if (lang === "tr")
      return { prompt: `INQUIRY/TR: Qaadi motorusun. Makale için Türkçe bir soruyu yanıtla (inquiry.md). Girdi:\n${frozen.text}${gloss}`, frozen };
    if (lang === "fr")
      return { prompt: `INQUIRY/FR: Tu es le moteur Qaadi. Réponds à une requête française destinée à l'article (inquiry.md). Entrée :\n${frozen.text}${gloss}`, frozen };
    if (lang === "de")
      return { prompt: `INQUIRY/DE: Du bist der Qaadi-Motor. Beantworte eine deutsche Anfrage für den Artikel (inquiry.md). Eingabe:\n${frozen.text}${gloss}`, frozen };
    if (lang === "es")
      return { prompt: `INQUIRY/ES: Eres el motor Qaadi. Responde una consulta en español destinada al artículo (inquiry.md). Entrada:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ru")
      return { prompt: `INQUIRY/RU: Ты движок Qaadi. Ответь на русский запрос для статьи (inquiry.md). Ввод:\n${frozen.text}${gloss}`, frozen };
    if (lang === "zh-Hans")
      return { prompt: `INQUIRY/ZH-HANS: 你是 Qaadi 引擎。用中文回答一个面向论文的询问 (inquiry.md)。输入:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ja")
      return { prompt: `INQUIRY/JA: あなたは Qaadi エンジンです。論文用の日本語の問いに答えてください (inquiry.md)。入力:\n${frozen.text}${gloss}`, frozen };
    throw new Error("unsupported_inquiry_lang");
  }
  const templateTargets = new Set(["revtex", "iop", "sn-jnl", "elsevier", "ieee", "arxiv"]);
  if (templateTargets.has(target)) {
    if (lang === "other") throw new Error(`unsupported_template_lang:${target}:${lang}`);
    const langNames: Record<string, string> = {
      ar: "Arabic",
      en: "English",
      tr: "Turkish",
      fr: "French",
      es: "Spanish",
      de: "German",
      ru: "Russian",
      "zh-Hans": "Chinese (Simplified)",
      ja: "Japanese"
    };
    const targetNames: Record<string, string> = {
      revtex: "ReVTeX",
      iop: "IOP",
      "sn-jnl": "Springer Nature Journal",
      elsevier: "Elsevier",
      ieee: "IEEE",
      arxiv: "arXiv"
    };
    const langName = langNames[lang];
    const tName = targetNames[target];
    if (!langName || !tName)
      throw new Error(`unsupported_target_lang:${target}:${lang}`);
    return {
      prompt: `${target.toUpperCase()}/${lang.toUpperCase()}: Produce LaTeX draft body (no \\documentclass) for ${tName} style in ${langName}. Input:\n${frozen.text}${gloss}`,
      frozen
    };
  }
  throw new Error(`unsupported_target_lang:${target}:${lang}`);
}

async function loadGlossary(req: NextRequest): Promise<Record<string, string> | null> {
  const combined: Record<string, string> = {};
  try {
    const defsPath = path.join(process.cwd(), "docs", "definitions.json");
    const data = await fs.readFile(defsPath, "utf8").catch(() => null);
    if (data) {
      const j = JSON.parse(data);
      const g = (j as any)?.Glossary || (j as any)?.glossary;
      if (g && typeof g === "object") Object.assign(combined, g);
    }
  } catch {}

  try {
    const url = new URL("/glossary.json", req.url);
    const r = await fetch(url.toString());
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j && typeof j === "object") Object.assign(combined, j as Record<string, string>);
    }
  } catch {}

  return Object.keys(combined).length ? combined : null;
}

/**
 * Orchestrates all worker roles sequentially.
 */
export async function orchestrate() {
  const audit = await runSecretary();
  const report = await runJudge();
  const plan = await runConsultant();
  const comparison = await runLead([]);
  const summary = await runJournalist();
  return { audit, report, plan, comparison, summary };
}
