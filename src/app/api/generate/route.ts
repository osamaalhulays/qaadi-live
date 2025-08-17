import { NextRequest } from "next/server";
import { InputSchema, OutputSchema } from "../../../lib/schema/io";
import { generateText } from "../../../lib/generationService";
import { freezeText, restoreText, countEquations, FrozenText } from "../../../lib/utils/freeze";
import { checkIdempotency } from "../../../lib/utils/idempotency";
import { saveSnapshot } from "../../../lib/saveSnapshot";
import { buildPrompt, buildTranslationPrompts } from "../../../lib/buildPrompt";
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

  if (url.searchParams.get("translate") === "1") {
    const body: any = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text : "";
    const langs = Array.isArray(body.langs) ? body.langs : [];
    const model =
      body.model === "openai" || body.model === "deepseek" ? body.model : "auto";
    const maxTokens =
      typeof body.max_tokens === "number" ? body.max_tokens : 2048;
    if (!text || !langs.length) {
      return new Response(JSON.stringify({ error: "bad_input" }), { status: 400 });
    }
    const openaiKey = req.headers.get("x-openai-key") ?? "";
    const deepseekKey = req.headers.get("x-deepseek-key") ?? "";
    if (!openaiKey && !deepseekKey) {
      return new Response(JSON.stringify({ error: "no_keys_provided" }), { status: 400 });
    }
    const { prompts, frozen } = buildTranslationPrompts(langs, text);
    const translations: Record<
      string,
      { text: string; dir: "rtl" | "ltr" | "mixed" }
    > = {};
    for (const l of langs) {
      const out = await generateText(
        model,
        { openai: openaiKey || undefined, deepseek: deepseekKey || undefined },
        prompts[l],
        maxTokens
      );
      const restored = restoreText(
        out.text,
        frozen.equations,
        frozen.dois,
        frozen.codes
      );
      translations[l] = { text: restored, dir: detectDir(restored) };
    }
    return new Response(JSON.stringify({ translations }), { status: 200 });
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
    const out = await generateText(
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
