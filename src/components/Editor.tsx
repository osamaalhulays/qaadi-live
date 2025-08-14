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
  const [target, setTarget] = useState("");
  const [language, setLanguage] = useState("");

  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [zipUrl, setZipUrl] = useState("");
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [paths, setPaths] = useState<string[]>([]);
  const [checks, setChecks] = useState({
    equations_count: 0,
    glossary_applied: false,
    rtl_ltr: "",
    idempotency: false
  });

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
    setBusy(true); setMsg(""); setZipUrl(""); setSnapshotUrl(""); setPaths([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ template, model, max_tokens: maxTokens, text, target, language })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "generate_failed");
      setOut(j?.text || "");
      setChecks({
        equations_count: j?.equations_count ?? 0,
        glossary_applied: j?.glossary_applied ?? false,
        rtl_ltr: j?.rtl_ltr ?? "",
        idempotency: j?.idempotency ?? false
      });
      const p = j?.paths || {};
      const zu = p.zip || p.zip_path || p.zipPath || "";
      const su = p.snapshot || p.snapshot_path || p.snapshotPath || "";
      setZipUrl(zu);
      setSnapshotUrl(su);
      const list: string[] = [];
      if (zu) list.push(zu);
      if (su) list.push(su);
      setPaths(list);
      setMsg(`OK • model=${j?.model_used} • in=${j?.tokens_in} • out=${j?.tokens_out} • ${j?.latency_ms}ms`);
    } catch (e:any) {
      setMsg(`ERROR: ${e?.message || e}`);
    } finally { setBusy(false); }
  }

  async function exportZip() {
    if (!zipUrl) return;
    setZipBusy(true); setMsg("");
    try {
      const res = await fetch(zipUrl, { headers });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `status_${res.status}`);
      }
      const blob = await res.blob();
      const name = zipUrl.split("/").pop() || "qaadi_export.zip";
      downloadBlob(blob, name);
      setMsg("ZIP جاهز.");
    } catch (e:any) {
      setMsg(`EXPORT ERROR: ${e?.message || e}`);
    } finally { setZipBusy(false); }
  }

  function openSnapshot() {
    if (snapshotUrl) window.open(snapshotUrl, "_blank");
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

      <div className="card grid grid-2" style={{marginBottom:12}}>
        <div>
          <label>Target</label>
          <select value={target} onChange={e=>setTarget(e.target.value)}>
            <option value="">اختر الهدف…</option>
            <option value="paper">paper</option>
            <option value="article">article</option>
          </select>
        </div>
        <div>
          <label>Language</label>
          <select value={language} onChange={e=>setLanguage(e.target.value)}>
            <option value="">اختر اللغة…</option>
            <option value="ar">Arabic</option>
            <option value="en">English</option>
            <option value="tr">Turkish</option>
          </select>
        </div>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <label>النص</label>
        <textarea rows={12} placeholder="ألصق هنا النص المبعثر…" value={text} onChange={e=>setText(e.target.value)} />
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div className="actions">
          <button className="btn" onClick={exportZip} disabled={zipBusy || !zipUrl}>{zipBusy ? "..." : "Export ZIP"}</button>
          <button className="btn" onClick={openSnapshot} disabled={!snapshotUrl}>Open Snapshot</button>
          <button className="btn btn-primary" onClick={doGenerate} disabled={busy || !target || !language}>{busy ? "جارٍ…" : "Generate"}</button>
        </div>
        {msg && <div className="note">{msg}</div>}
      </div>

      <div className="card grid grid-4" style={{marginBottom:12}}>
        <div>
          <label>equations_count</label>
          <div>{checks.equations_count}</div>
        </div>
        <div>
          <label>glossary_applied</label>
          <div>{checks.glossary_applied ? "yes" : "no"}</div>
        </div>
        <div>
          <label>rtl_ltr</label>
          <div>{checks.rtl_ltr || "-"}</div>
        </div>
        <div>
          <label>idempotency</label>
          <div>{checks.idempotency ? "yes" : "no"}</div>
        </div>
      </div>

      {paths.length > 0 && (
        <div className="card" style={{marginBottom:12}}>
          <label>Paths</label>
          <ul>
            {paths.map(p => (
              <li key={p}><code>{p}</code></li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <label>Output</label>
        <textarea className="output" value={out} readOnly />
      </div>
    </>
  );
}
