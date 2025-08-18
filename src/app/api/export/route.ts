import { NextRequest } from "next/server";
import { makeZip, type ZipFile } from "../../../lib/utils/zip";
import { generateText } from "../../../lib/generationService";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { checkIdempotency } from "../../../lib/utils/idempotency";
import { sanitizeSlug, type SnapshotEntry } from "../../../lib/utils/snapshot";
import { runGates, gateQn21, type FieldKey } from "../../../lib/workflow";

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

function tsFolder(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function saveSnapshot(
  files: ZipFile[],
  target: string,
  lang: string,
  slug: string,
  v: string,
  ctx: { card_id: string; user: string; nonce: string } = {
    card_id: "",
    user: "",
    nonce: ""
  }
) {
  const safeSlug = sanitizeSlug(slug);
  const safeV = sanitizeSlug(v);
  const now = new Date();
  const tsDir = tsFolder(now);
  const timestamp = now.toISOString();
  const entries: SnapshotEntry[] = [];
  const session_id = sha256Hex(ctx.card_id + ctx.user + ctx.nonce);

  for (const f of files) {
    const data = typeof f.content === "string" ? Buffer.from(f.content) : Buffer.from(f.content);
    const rel = path.join("snapshots", safeSlug, safeV, tsDir, "paper", target, lang, f.path.replace(/^paper\//, ""));
    const full = path.join(process.cwd(), "public", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    entries.push({
      path: rel.replace(/\\/g, "/"),
      sha256: sha256Hex(data),
      target,
      lang,
      slug: safeSlug,
      v: safeV,
      timestamp,
      type: "paper",
      card_id: ctx.card_id,
      session_id
    });
  }

  const roleNames = ["secretary.md", "judge.json", "plan.md", "notes.txt", "comparison.md"];
  for (const name of roleNames) {
    try {
      const data = await readFile(path.join(process.cwd(), "paper", name));
      const rel = path.join("snapshots", safeSlug, safeV, tsDir, "paper", target, lang, name);
      const full = path.join(process.cwd(), "public", rel);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, data);
      entries.push({
        path: rel.replace(/\\/g, "/"),
        sha256: sha256Hex(data),
        target,
        lang,
        slug: safeSlug,
        v: safeV,
        timestamp,
        type: "role",
        card_id: ctx.card_id,
        session_id
      });
    } catch {}
  }

  const manifestPath = path.join(process.cwd(), "public", "snapshots", "manifest.json");
  let manifest: SnapshotEntry[] = [];
  try {
    const existing = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(existing);
  } catch {}
  manifest.push(...entries);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return { session_id };
}

async function buildTreeFromCompose(payload: any) {
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

  // secretary.md (human-readable gate report)
  if (typeof payload?.secretary?.markdown === "string") {
    files.push({ path: "paper/secretary.md", content: payload.secretary.markdown });
  }

  // 20_secretary_audit.json
  if (payload?.secretary?.audit !== undefined) {
    files.push({
      path: "paper/20_secretary_audit.json",
      content: JSON.stringify(payload.secretary.audit, null, 2)
    });
  }

  // 30_judge_report.json
  if (payload?.judge?.report !== undefined) {
    const report = payload.judge.report;
    let percentage = 0;
    let classification: "accepted" | "needs_improvement" | "weak" = "weak";
    if (Array.isArray(report?.criteria) && typeof report?.score_total === "number") {
      const max = report.criteria.length * 10;
      percentage = max > 0 ? (report.score_total / max) * 100 : 0;
      if (percentage >= 80) classification = "accepted";
      else if (percentage >= 60) classification = "needs_improvement";
    }
    const enriched = { ...report, percentage, classification };
    files.push({
      path: "paper/30_judge_report.json",
      content: JSON.stringify(enriched, null, 2)
    });
    try {
      const root = process.cwd();
      await mkdir(path.join(root, "paper"), { recursive: true });
      await writeFile(path.join(root, "paper", "judge.json"), JSON.stringify(enriched, null, 2));
      await mkdir(path.join(root, "public", "paper"), { recursive: true });
      await writeFile(path.join(root, "public", "paper", "judge.json"), JSON.stringify(enriched, null, 2));
    } catch {}
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
  const v = typeof body?.v === "string" ? body.v : "default";

  // Mode A: raw → same as old behavior (accept ready files[])
  if (mode === "raw") {
    const files = Array.isArray(body?.files) ? (body.files as ZipFile[]) : null;
    const name = (body?.name && typeof body.name === "string") ? body.name : "qaadi_export.zip";
    if (!files || !files.length) {
      return new Response(JSON.stringify({ error: "no_files" }), { status: 400, headers: headersJSON() });
    }
    await saveSnapshot(files, target, lang, slug, v);
    const zip = makeZip(files);
    const shaHex = sha256Hex(zip);
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  }

  // Mode B: compose → client provides unit outputs; server builds canonical tree
  if (mode === "compose") {
    const { name, files } = await buildTreeFromCompose(body);
    if (!files.length) {
      return new Response(JSON.stringify({ error: "compose_empty" }), { status: 400, headers: headersJSON() });
    }
    await saveSnapshot(files, target, lang, slug, v);
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
    const providerOpts = { openai: openaiKey || undefined, deepseek: deepseekKey || undefined };

    // Secretary first
    const sec = await generateText(selection, providerOpts, prompts.secretary, max_tokens).catch(() => ({ text: "" }));
    const secretaryText = sec?.text ?? "";
    const tryJSON = (s: string) => { try { return JSON.parse(s); } catch { return s; } };
    const secretaryAudit = tryJSON(secretaryText);
    const gate = runGates({ secretary: { audit: secretaryAudit } });

    // Write secretary.md with gate results
    const missingText = gate.missing.length
      ? `\nMissing Fields:\n${gate.missing.map((f: FieldKey) => `- ${f}`).join("\n")}\n`
      : "";
    const secretaryMd = `Ready%: ${gate.ready_percent}${missingText}`;
    try {
      const secPath = path.join(process.cwd(), "paper", "secretary.md");
      await mkdir(path.dirname(secPath), { recursive: true });
      await writeFile(secPath, secretaryMd, "utf8");
    } catch {}

    // Judge: run only if gates pass
    let judgeReport: any;
    if (gate.missing.length === 0) {
      const jud = await generateText(selection, providerOpts, prompts.judge, max_tokens).catch(() => ({ text: "" }));
      const judgeText = jud?.text ?? "";
      judgeReport = tryJSON(judgeText);
    } else {
      judgeReport = {
        score_total: 0,
        criteria: gate.missing.map((m: FieldKey, i) => ({ id: i + 1, name: m, score: 0, notes: "missing required field" })),
        notes: "Missing required fields in secretary output"
      };
    }

    const qnGate = gateQn21(judgeReport);
    let consultantText = "";
    let journalistText = "";
    if (qnGate.allowed) {
      const [con, jour] = await Promise.allSettled([
        generateText(selection, providerOpts, prompts.consultant, max_tokens),
        generateText(selection, providerOpts, prompts.journalist, max_tokens)
      ]);
      const getText = (r: PromiseSettledResult<any>) => (r.status === "fulfilled" ? (r.value?.text ?? "") : "");
      consultantText = getText(con);
      journalistText = getText(jour);
    }

    const composePayload = {
      name: typeof body?.name === "string" ? body.name : "qaadi_export.zip",
      input: { text: inputText },
      secretary: { audit: secretaryAudit, markdown: secretaryMd },
      judge: { report: judgeReport },
      consultant: { plan: consultantText },
      journalist: { summary: journalistText },
      meta: { model: selection, max_tokens }
    };

    const { name, files } = await buildTreeFromCompose(composePayload);
    await saveSnapshot(files, target, lang, slug, v);
    const zip = makeZip(files);
    const shaHex = sha256Hex(zip);
    return new Response(zip, { status: 200, headers: headersZip(name, zip.byteLength, shaHex) });
  }

  // Unknown mode
  return new Response(JSON.stringify({ error: "unknown_mode" }), { status: 400, headers: headersJSON() });
}
