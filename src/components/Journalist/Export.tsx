"use client";
import { mergeBlob } from "../DepartmentHead/Merge";

export async function exportOrchestrate(opts: {
  target: string | "";
  lang: string | "";
  model: string;
  maxTokens: number;
  text: string;
  slug: string;
  v: string;
  headers: any;
  setMsg: (s: string) => void;
  setZipBusy: (b: boolean) => void;
  refreshFiles: () => Promise<void>;
}) {
  const {
    target,
    lang,
    model,
    maxTokens,
    text,
    slug,
    v,
    headers,
    setMsg,
    setZipBusy,
    refreshFiles
  } = opts;
  setZipBusy(true);
  setMsg("");
  try {
    if (!target || !lang) throw new Error("missing_target_lang");
    const res = await fetch("/api/export", {
      method: "POST",
      headers,
      body: JSON.stringify({
        mode: "orchestrate",
        model,
        max_tokens: maxTokens,
        name: "qaadi_export.zip",
        target,
        lang,
        slug,
        v,
        input: { text }
      })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `status_${res.status}`);
    }
    const blob = await res.blob();
    mergeBlob(blob, "qaadi_export.zip");
    setMsg("ZIP جاهز (orchestrate).");
    await refreshFiles();
  } catch (e: any) {
    setMsg(e?.message === "missing_target_lang" ? "يرجى اختيار الهدف واللغة" : `EXPORT ERROR: ${e?.message || e}`);
  } finally {
    setZipBusy(false);
  }
}

export async function exportCompose(opts: {
  target: string | "";
  lang: string | "";
  model: string;
  maxTokens: number;
  text: string;
  slug: string;
  v: string;
  out: string;
  headers: any;
  setMsg: (s: string) => void;
  setZipBusy: (b: boolean) => void;
  refreshFiles: () => Promise<void>;
}) {
  const {
    target,
    lang,
    model,
    maxTokens,
    text,
    slug,
    v,
    out,
    headers,
    setMsg,
    setZipBusy,
    refreshFiles
  } = opts;
  setZipBusy(true);
  setMsg("");
  try {
    if (!target || !lang) throw new Error("missing_target_lang");
    const res = await fetch("/api/export", {
      method: "POST",
      headers,
      body: JSON.stringify({
        mode: "compose",
        name: "qaadi_export.zip",
        slug,
        v,
        input: { text },
        secretary: { audit: { ready_percent: 50, issues: [{ type: "demo", note: "example only" }] } },
        judge: { report: { score_total: 110, criteria: [], notes: "demo" } },
        consultant: { plan: out || "plan(demo)" },
        journalist: { summary: (out && out.slice(0, 400)) || "summary(demo)" },
        meta: { target, lang, model, max_tokens: maxTokens }
      })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `status_${res.status}`);
    }
    const blob = await res.blob();
    mergeBlob(blob, "qaadi_export.zip");
    setMsg("ZIP جاهز (compose).");
    await refreshFiles();
  } catch (e: any) {
    setMsg(e?.message === "missing_target_lang" ? "يرجى اختيار الهدف واللغة" : `EXPORT ERROR: ${e?.message || e}`);
  } finally {
    setZipBusy(false);
  }
}

export default function Journalist() {
  return (
    <div>
      <h2>Journalist</h2>
      <p>Exports results.</p>
    </div>
  );
}
