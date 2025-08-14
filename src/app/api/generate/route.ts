import { NextRequest } from "next/server";
import { InputSchema, OutputSchema } from "../../../lib/schema/io";
import { runWithFallback } from "../../../lib/providers/router";
import { freezeText, restoreText, countEquations } from "../../../lib/utils/freeze";
import { checkIdempotency } from "../../../lib/utils/idempotency";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

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

    const fileName =
      input.target === "wide"
        ? "bundle.md"
        : input.target === "inquiry"
        ? "inquiry.md"
        : "draft.tex";
    let saved: string[] = [];
    let covers: string[] = [];
    try {
      const files =
        input.target === "inquiry"
          ? (() => {
              covers = Array.from(
                final.text.match(/^#\s+(.+)$/gm)?.map((h) => h.replace(/^#\s+/, "").trim()) || []
              );
              return [
                { path: `paper/${fileName}`, content: final.text },
                {
                  path: `paper/inquiry.json`,
                  content: JSON.stringify({ covers }, null, 2)
                }
              ];
            })()
          : [{ path: `paper/${fileName}`, content: final.text }];
      saved = await saveSnapshot(files, input.target, input.lang);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "snapshot_failed", detail: e?.message || String(e) }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ ...final, ...(covers.length ? { covers } : {}), files: saved }), {
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

function sha256Hex(data: Uint8Array | string) {
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function tsFolder(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function saveSnapshot(files: { path: string; content: string | Uint8Array }[], target: string, lang: string) {
  const now = new Date();
  const tsDir = tsFolder(now);
  const timestamp = now.toISOString();
  const entries: any[] = [];

  for (const f of files) {
    const data = typeof f.content === "string" ? Buffer.from(f.content) : Buffer.from(f.content);
    const rel = path.join("snapshots", tsDir, "paper", target, lang, f.path.replace(/^paper\//, ""));
    const full = path.join(process.cwd(), "public", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      timestamp
    });
  }

  const manifestPath = path.join(process.cwd(), "public", "snapshots", "manifest.json");
  let manifest: any[] = [];
  try {
    const existing = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(existing);
  } catch {}
  manifest.push(...entries);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return entries.map((e) => e.path);
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
    | "es"
    | "de"
    | "ru"
    | "zh-Hans"
    | "ja"
    | "other",
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
    if (lang === "zh-Hans")
      return `WIDE/ZH-HANS: 你是 Qaadi 引擎。编辑面向论文的中文长文 (bundle.md)。输入:\n${userText}${gloss}`;
    if (lang === "ja")
      return `WIDE/JA: あなたは Qaadi エンジンです。論文用の日本語の長文を編集してください (bundle.md)。入力:\n${userText}${gloss}`;
    if (lang === "other")
      return `WIDE/OTHER: You are the Qaadi engine. Edit a long text in its original language intended for the paper (bundle.md). Input:\n${userText}${gloss}`;
  }
  if (target === "inquiry") {
    if (lang === "ar")
      return `INQUIRY/AR: أنت محرّك Qaadi Inquiry. أنشئ مجموعة من الأسئلة للاستفسار. المدخل:\n${userText}${gloss}`;
    if (lang === "en")
      return `INQUIRY/EN: You are the Qaadi Inquiry engine. Generate a set of questions. Input:\n${userText}${gloss}`;
    if (lang === "tr")
      return `INQUIRY/TR: Qaadi Inquiry için soru seti üret. Girdi:\n${userText}${gloss}`;
    if (lang === "fr")
      return `INQUIRY/FR: Tu es le moteur Qaadi Inquiry. Génère un ensemble de questions. Entrée :\n${userText}${gloss}`;
    if (lang === "es")
      return `INQUIRY/ES: Eres el motor Qaadi Inquiry. Genera un conjunto de preguntas. Entrada:\n${userText}${gloss}`;
    if (lang === "de")
      return `INQUIRY/DE: Du bist der Qaadi-Inquiry-Motor. Erstelle einen Fragenkatalog. Eingabe:\n${userText}${gloss}`;
    if (lang === "ru")
      return `INQUIRY/RU: Ты движок Qaadi Inquiry. Сформируй набор вопросов. Ввод:\n${userText}${gloss}`;
    if (lang === "zh-Hans")
      return `INQUIRY/ZH-HANS: 你是 Qaadi Inquiry 引擎。生成一组问题。输入:\n${userText}${gloss}`;
    if (lang === "ja")
      return `INQUIRY/JA: あなたは Qaadi Inquiry エンジンです。質問セットを生成してください。入力:\n${userText}${gloss}`;
    if (lang === "other")
      return `INQUIRY/OTHER: You are the Qaadi Inquiry engine. Generate a set of questions in its original language. Input:\n${userText}${gloss}`;
    throw new Error(`unsupported_inquiry_lang:${lang}`);
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
    return `${target.toUpperCase()}/${lang.toUpperCase()}: Produce LaTeX draft body (no \\documentclass) for ${tName} style in ${langName}. Input:\n${userText}${gloss}`;
  }
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
