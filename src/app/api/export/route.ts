import { NextRequest } from "next/server";
import { makeZip, type ZipFile } from "../../../lib/utils/zip";
import { runWithFallback } from "../../../lib/providers/router";
import crypto from "crypto";
import { checkIdempotency } from "../../../lib/utils/idempotency";
import { saveSnapshot } from "../../../lib/utils/snapshot";

export const runtime = "nodejs";

/* ---------- Common headers ---------- */
function headersZip(name: string, size: number, shaHex: string) {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${name}"`,
    "X-Content-Type-Options": "nosniff",
    "ETag": `"sha256:${shaHex}"`,
    "Content-Length": String(size),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-OpenAI-Key, X-DeepSeek-Key"
  };
}

function headersJSON() {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-OpenAI-Key, X-DeepSeek-Key"
  };
}

/* ---------- CORS preflight ---------- */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: headersJSON() });
}

/* ---------- Helpers ---------- */
function sha256Hex(data: Uint8Array | string) {
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function isoNow() { return new Date().toISOString(); }


function buildTreeFromCompose(payload: any) {
  // EXPECTS:
  // {
  //   name?: "qaadi_export.zip",
  //   input: { text: string },
  //   secretary?: { audit: any },
  //   judge?: { report: any },
  //   consultant?: { plan: string },
  //   journalist?: { summary: string },
  //   meta?: { target?: string, lang?: string, model?: string, max_tokens?: number }
  // }
  const files: ZipFile[] = [];
  const name = typeof payload?.name === "string" ? payload.name : "qaadi_export.zip";

  const manifest = {
    kind: "qaadi-export",
    version: 1,
    created_at: isoNow(),
    build: {
      tag: (process.env.NEXT_PUBLIC_BUILD_TAG ?? "qaadi-fast-track"),
      byok: true
    },
    meta: payload?.meta ?? {}
  };

  // 00_manifest.json + 90_build_info.json
  files.push({ path: "paper/00_manifest.json", content: JSON.stringify(manifest, null, 2) });
  files.push({
    path: "paper/90_build_info.json",
    content: JSON.stringify({ created_at: isoNow(), env: "edge" }, null, 2)
  });

  // 10_input.md
  const inputText = payload?.input?.text ?? "";
  files.push({ path: "paper/10_input.md", content: inputText });

  // 20_secretary_audit.json
  if (payload?.secretary?.audit !== undefined) {
    files.push({
      path: "paper/20_secretary_audit.json",
      content: JSON.stringify(payload.secretary.audit, null, 2)
    });
  }

  // 30_judge_report.json
  if (payload?.judge?.report !== undefined) {
    files.push({
      path: "paper/30_judge_report.json",
      content: JSON.stringify(payload.judge.report, null, 2)
    });
  }

  // 40_consultant_plan.md
  if (typeof payload?.consultant?.plan === "string") {
    files.push({ path: "paper/40_consultant_plan.md", content: payload.consultant.plan });
  }

  // 50_journalist_summary.md
  if (typeof payload?.journalist?.summary === "string") {
    files.push({ path: "paper/50_journalist_summary.md", content: payload.journalist.summary });
  }

  return { name, files };
}

function promptsForOrchestrate(inputText: string) {
  // System/user prompts per unit — lightweight and safe for Edge
  return {
    secretary: `You are Qaadi Secretary. Audit the submission: list missing items, ambiguity, formatting issues. Output strict JSON: { "ready_percent": number, "issues": [ { "type": "...", "note": "..." } ] }.\n\nINPUT:\n${inputText}`,
    judge: `You are Qaadi Judge. Evaluate scientifically against 20 internal criteria. Output strict JSON: { "score_total": number, "criteria": [ { "id": 1, "name": "...", "score": number, "notes": "..." } ], "notes": "..." }.\n\nINPUT:\n${inputText}`,
    consultant: `You are Qaadi Consultant. Merge secretary issues + judge gaps into an action plan. Output a concise Markdown plan (no code fences). INPUT:\n${inputText}`,
    journalist: `You are Qaadi Journalist. Produce a concise, publication-ready summary in Arabic. No code fences. INPUT:\n${inputText}`
  };
}

/* ---------- POST ---------- */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad_input" }), { status: 400, headers: headersJSON() });
  }

  const idemKey = req.headers.get("Idempotency-Key");
  if (idemKey && !checkIdempotency(`export:${idemKey}`, body)) {
    return new Response(JSON.stringify({ error: "idempotency_conflict" }), { status: 409, headers: headersJSON() });
  }

  const mode = (body?.mode ?? "raw") as "raw" | "compose" | "orchestrate";
  const target = typeof body?.target === "string" ? body.target : "default";
  const lang = typeof body?.lang === "string" ? body.lang : "en";
  const slug = typeof body?.slug === "string" ? body.slug : "default";

  // Mode A: raw → same as old behavior (accept ready files[])
  if (mode === "raw") {
    const files = Array.isArray(body?.files) ? (body.files as ZipFile[]) : null;
    const name = (body?.name && typeof body.name === "string") ? body.name : "qaadi_export.zip";
    if (!files || !files.length) {
      return new Response(JSON.stringify({ error: "no_files" }), { status: 400, headers: headersJSON() });
    }
    await saveSnapshot(files, target, lang, slug);
    const zip = makeZip(files);
    const shaHex = sha256Hex(zip);
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  }

  // Mode B: compose → client provides unit outputs; server builds canonical tree
  if (mode === "compose") {
    const { name, files } = buildTreeFromCompose(body);
    if (!files.length) {
      return new Response(JSON.stringify({ error: "compose_empty" }), { status: 400, headers: headersJSON() });
    }
    await saveSnapshot(files, target, lang, slug);
    const zip = makeZip(files);
    const shaHex = sha256Hex(zip);
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  }

  // Mode C: orchestrate → server calls providers (BYOK headers), then exports
  if (mode === "orchestrate") {
    const inputText = String(body?.input?.text ?? "").trim();
    if (!inputText) {
      return new Response(JSON.stringify({ error: "no_input_text" }), { status: 400, headers: headersJSON() });
    }

    // BYOK headers (pass-through, not stored)
    const openaiKey = req.headers.get("x-openai-key") ?? "";
    const deepseekKey = req.headers.get("x-deepseek-key") ?? "";
    if (!openaiKey && !deepseekKey) {
      return new Response(JSON.stringify({ error: "no_keys_provided" }), { status: 400, headers: headersJSON() });
    }

    const prompts = promptsForOrchestrate(inputText);
    const max_tokens = typeof body?.max_tokens === "number" ? body.max_tokens : 2048;
    const selection = (body?.model === "openai" || body?.model === "deepseek") ? body.model : "auto";

    // Run units sequentially to keep memory low (Edge); each with fallback
    const [sec, jud, con, jour] = await Promise.allSettled([
      runWithFallback(selection, { openai: openaiKey || undefined, deepseek: deepseekKey || undefined }, prompts.secretary, max_tokens),
      runWithFallback(selection, { openai: openaiKey || undefined, deepseek: deepseekKey || undefined }, prompts.judge, max_tokens),
      runWithFallback(selection, { openai: openaiKey || undefined, deepseek: deepseekKey || undefined }, prompts.consultant, max_tokens),
      runWithFallback(selection, { openai: openaiKey || undefined, deepseek: deepseekKey || undefined }, prompts.journalist, max_tokens)
    ]);

    // Normalize texts
    const getText = (r: PromiseSettledResult<any>) => (r.status === "fulfilled" ? (r.value?.text ?? "") : "");
    const secretaryText = getText(sec);
    const judgeText = getText(jud);
    const consultantText = getText(con);
    const journalistText = getText(jour);

    // Try to parse secretary/judge JSONs; if fail, keep as text fallback
    const tryJSON = (s: string) => { try { return JSON.parse(s); } catch { return s; } };

    const composePayload = {
      name: typeof body?.name === "string" ? body.name : "qaadi_export.zip",
      input: { text: inputText },
      secretary: { audit: tryJSON(secretaryText) },
      judge: { report: tryJSON(judgeText) },
      consultant: { plan: consultantText },
      journalist: { summary: journalistText },
      meta: { model: selection, max_tokens }
    };

    const { name, files } = buildTreeFromCompose(composePayload);
    await saveSnapshot(files, target, lang, slug);
    const zip = makeZip(files);
    const shaHex = sha256Hex(zip);
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  }

  // Unknown mode
  return new Response(JSON.stringify({ error: "unknown_mode" }), { status: 400, headers: headersJSON() });
}
