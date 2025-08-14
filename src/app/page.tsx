"use client";
import { useEffect, useMemo, useState } from "react";

type Template = "WideAR" | "ReVTeX" | "InquiryTR";
type ModelSel = "openai" | "deepseek" | "auto";

export default function Page() {
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
  const [progress, setProgress] = useState(0);

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
    setBusy(true); setMsg(""); setOut(""); setProgress(0);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ template, model, max_tokens: maxTokens, text })
      });
      if (!res.body) throw new Error("no_body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let meta:any = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const j = JSON.parse(line);
          if (j.type === "meta") {
            meta = j;
          } else if (j.type === "chunk") {
            setOut(o => o + j.data);
            if (meta?.total) setProgress((j.sent / meta.total) * 100);
          } else if (j.type === "error") {
            throw new Error(j.error || "stream_error");
          }
        }
      }
      if (!res.ok) {
        throw new Error(meta?.error || "generate_failed");
      }
      if (meta) {
        setMsg(`OK • model=${meta.model_used} • in=${meta.tokens_in} • out=${meta.tokens_out} • ${meta.latency_ms}ms`);
        setProgress(100);
      }
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
      <h1 className="h1"><span className="badge">⚖️</span> Qaadi Live</h1>

      <div className="card grid grid-2" style={{marginBottom:12}}>
        <div>
          <label>DeepSeek Key</label>
          <input value={deepseekKey} onChange={e=>setDeepseekKey(e.target.value)} placeholder="...ds" />
        </div>
        <div>
          <label>OpenAI Key</label>
          <input value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)} placeholder="...sk" />
        </div>
      </div>

      <div className="card grid grid-3" style={{marginBottom:12}}>
        <div>
          <label>max_tokens</label>
          <input type="number" value={maxTokens} min={256} max={8192} onChange={e=>setMaxTokens(parseInt(e.target.value||"2048"))} />
        </div>
        <div>
          <label>Model</label>
          <select value={model} onChange={e=>setModel(e.target.value as ModelSel)}>
            <option value="auto">auto (OpenAI→DeepSeek)</option>
            <option value="openai">openai</option>
            <option value="deepseek">deepseek</option>
          </select>
        </div>
        <div>
          <label>Template</label>
          <select value={template} onChange={e=>setTemplate(e.target.value as Template)}>
            <option value="ReVTeX">ReVTeX (EN)</option>
            <option value="WideAR">Wide/AR (AR)</option>
            <option value="InquiryTR">Inquiry (TR)</option>
          </select>
        </div>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <label>النص</label>
        <textarea rows={12} placeholder="ألصق هنا النص المبعثر…" value={text} onChange={e=>setText(e.target.value)} />
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div className="actions">
          <button className="btn" onClick={exportCompose} disabled={zipBusy}>{zipBusy ? "..." : "Export (compose demo)"}</button>
          <button className="btn btn-primary" onClick={exportOrchestrate} disabled={zipBusy}>{zipBusy ? "..." : "Export (orchestrate)"}</button>
          <button className="btn" onClick={doGenerate} disabled={busy}>{busy ? "جارٍ…" : "Generate"}</button>
        </div>
        {msg && <div className="note">{msg}</div>}
      </div>

      <div className="card">
        <label>Output</label>
        {busy && <progress value={progress} max={100} style={{width:"100%", marginBottom:8}} />}
        <textarea className="output" value={out} readOnly />
      </div>
    </>
  );
}
