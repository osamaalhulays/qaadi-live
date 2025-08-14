"use client";
import { useEffect, useMemo, useState } from "react";

type Target = "Wide" | "ReVTeX" | "Inquiry";
type Language = "AR" | "EN" | "TR";
type ModelSel = "openai" | "deepseek" | "auto";

export default function Editor() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");

  const [target, setTarget] = useState<"" | Target>("");
  const [language, setLanguage] = useState<"" | Language>("");
  const [model, setModel] = useState<ModelSel>("auto");
  const [maxTokens, setMaxTokens] = useState(2048);
  const [text, setText] = useState("");

  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [verify, setVerify] = useState<null | {
    equations_count: number;
    glossary_applied: number;
    rtl_ltr: string;
    idempotency: boolean;
  }>(null);

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

  useEffect(() => {
    if (!language) return;
    const dir = language === "AR" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  async function doGenerate() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ target, language, model, max_tokens: maxTokens, text })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "generate_failed");
      setOut(j?.text || "");
      setVerify(j?.checks || null);
      setMsg(`OK • model=${j?.model_used} • in=${j?.tokens_in} • out=${j?.tokens_out} • ${j?.latency_ms}ms`);
    } catch (e:any) {
      setMsg(`ERROR: ${e?.message || e}`);
      setVerify(null);
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
          meta: { target, language, model, max_tokens: maxTokens }
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

      <div className="card grid grid-4" style={{marginBottom:12}}>
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
          <label>Target</label>
          <select value={target} onChange={e=>setTarget(e.target.value as Target || "")}> 
            <option value="">Select</option>
            <option value="ReVTeX">ReVTeX</option>
            <option value="Wide">Wide</option>
            <option value="Inquiry">Inquiry</option>
          </select>
        </div>
        <div>
          <label>Language</label>
          <select value={language} onChange={e=>setLanguage(e.target.value as Language || "")}> 
            <option value="">Select</option>
            <option value="EN">English</option>
            <option value="AR">العربية</option>
            <option value="TR">Türkçe</option>
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
          <button className="btn" onClick={doGenerate} disabled={busy || !target || !language}>{busy ? "جارٍ…" : "Generate"}</button>
        </div>
          {msg && <div className="note">{msg}</div>}
          {verify && (
            <div className="verify-bar">
              <span>equations_count: {verify.equations_count}</span>
              <span>glossary_applied: {verify.glossary_applied}</span>
              <span>rtl_ltr: {verify.rtl_ltr}</span>
              <span>
                idempotency: {verify.idempotency ? <span className="verify-ok">✓</span> : <span className="verify-warn">⚠️</span>}
              </span>
            </div>
          )}
        </div>

      <div className="card">
        <label>Output</label>
        <textarea className="output" value={out} readOnly />
      </div>
    </>
  );
}
