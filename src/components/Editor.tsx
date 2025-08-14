"use client";
import { useEffect, useMemo, useState } from "react";

type Template = "WideAR" | "ReVTeX" | "InquiryTR";
type ModelSel = "openai" | "deepseek" | "auto";

export default function Editor() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");

  const [template, setTemplate] = useState<Template>("ReVTeX");
  const [model, setModel] = useState<ModelSel>("auto");
  const [maxTokens, setMaxTokens] = useState(2048);
  const [text, setText] = useState("");

  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    try {
      setOpenaiKey(localStorage.getItem("OPENAI_KEY") || "");
      setDeepseekKey(localStorage.getItem("DEEPSEEK_KEY") || "");
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("OPENAI_KEY", openaiKey); } catch {} }, [openaiKey]);
  useEffect(() => { try { localStorage.setItem("DEEPSEEK_KEY", deepseekKey); } catch {} }, [deepseekKey]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "X-OpenAI-Key": openaiKey || "",
    "X-DeepSeek-Key": deepseekKey || ""
  }), [openaiKey, deepseekKey]);

  async function doGenerate() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ template, model, max_tokens: maxTokens, text })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "generate_failed");
      setOut(j?.text || "");
      setMsg(`OK • model=${j?.model_used} • in=${j?.tokens_in} • out=${j?.tokens_out} • ${j?.latency_ms}ms`);
    } catch (e:any) {
      setMsg(`ERROR: ${e?.message || e}`);
    } finally { setBusy(false); }
  }

  async function exportOrchestrate() {
    setZipBusy(true); setMsg("");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "orchestrate",
          model,
          max_tokens: maxTokens,
          name: "qaadi_export.zip",
          input: { text }
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `status_${res.status}`);
      }
      const blob = await res.blob();
      downloadBlob(blob, "qaadi_export.zip");
      setMsg("ZIP جاهز (orchestrate).");
    } catch (e:any) {
      setMsg(`EXPORT ERROR: ${e?.message || e}`);
    } finally { setZipBusy(false); }
  }

  async function exportCompose() {
    setZipBusy(true); setMsg("");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "compose",
          name: "qaadi_export.zip",
          input: { text },
          secretary: { audit: { ready_percent: 50, issues: [{ type: "demo", note: "example only" }] } },
          judge: { report: { score_total: 110, criteria: [], notes: "demo" } },
          consultant: { plan: out || "plan(demo)" },
          journalist: { summary: (out && out.slice(0, 400)) || "summary(demo)" },
          meta: { template, model, max_tokens: maxTokens }
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `status_${res.status}`);
      }
      const blob = await res.blob();
      downloadBlob(blob, "qaadi_export.zip");
      setMsg("ZIP جاهز (compose).");
    } catch (e:any) {
      setMsg(`EXPORT ERROR: ${e?.message || e}`);
    } finally { setZipBusy(false); }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-3 grid gap-3 md:grid-cols-2 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
        <div>
          <label className="mb-1 block text-xs text-gray-400">DeepSeek Key</label>
          <input
            className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={deepseekKey}
            onChange={e=>setDeepseekKey(e.target.value)}
            placeholder="...ds"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">OpenAI Key</label>
          <input
            className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={openaiKey}
            onChange={e=>setOpenaiKey(e.target.value)}
            placeholder="...sk"
          />
        </div>
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-3 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
        <div>
          <label className="mb-1 block text-xs text-gray-400">max_tokens</label>
          <input
            type="number"
            value={maxTokens}
            min={256}
            max={8192}
            onChange={e=>setMaxTokens(parseInt(e.target.value||"2048"))}
            className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Model</label>
          <select
            value={model}
            onChange={e=>setModel(e.target.value as ModelSel)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="auto">auto (OpenAI→DeepSeek)</option>
            <option value="openai">openai</option>
            <option value="deepseek">deepseek</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Template</label>
          <select
            value={template}
            onChange={e=>setTemplate(e.target.value as Template)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="ReVTeX">ReVTeX (EN)</option>
            <option value="WideAR">Wide/AR (AR)</option>
            <option value="InquiryTR">Inquiry (TR)</option>
          </select>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
        <label className="mb-1 block text-xs text-gray-400">النص</label>
        <textarea
          rows={12}
          placeholder="ألصق هنا النص المبعثر…"
          value={text}
          onChange={e=>setText(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mb-3 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            onClick={exportCompose}
            disabled={zipBusy}
          >
            {zipBusy ? "..." : "Export (compose demo)"}
          </button>
          <button
            className="rounded-lg border border-yellow-300 bg-yellow-300 px-3 py-2 font-semibold text-black hover:brightness-105 disabled:opacity-50"
            onClick={exportOrchestrate}
            disabled={zipBusy}
          >
            {zipBusy ? "..." : "Export (orchestrate)"}
          </button>
          <button
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            onClick={doGenerate}
            disabled={busy}
          >
            {busy ? "جارٍ…" : "Generate"}
          </button>
        </div>
        {msg && <div className="mt-2 text-sm text-gray-400">{msg}</div>}
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
        <label className="mb-1 block text-xs text-gray-400">Output</label>
        <textarea
          className="min-h-[160px] w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 outline-none"
          value={out}
          readOnly
        />
      </div>
    </>
  );
}
