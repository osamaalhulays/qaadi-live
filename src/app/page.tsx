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

  // حمّلي المفاتيح من localStorage
  useEffect(() => {
    try {
      setOpenaiKey(localStorage.getItem("OPENAI_KEY") || "");
      setDeepseekKey(localStorage.getItem("DEEPSEEK_KEY") || "");
    } catch {}
  }, []);

  // خزّني المفاتيح محليًا
  useEffect(() => {
    try { localStorage.setItem("OPENAI_KEY", openaiKey); } catch {}
  }, [openaiKey]);
  useEffect(() => {
    try { localStorage.setItem("DEEPSEEK_KEY", deepseekKey); } catch {}
  }, [deepseekKey]);

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
    } finally {
      setBusy(false);
    }
  }

  // تصدير — orchestrate: يولّد كل الوحدات ويُرجع ZIP قياسي
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
      setMsg("ZIP ready (orchestrate).");
    } catch (e:any) {
      setMsg(`EXPORT ERROR: ${e?.message || e}`);
    } finally {
      setZipBusy(false);
    }
  }

  // تصدير — compose: يبني ZIP من مخرجاتك الحالية يدويًا (اختياري)
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
      setMsg("ZIP ready (compose).");
    } catch (e:any) {
      setMsg(`EXPORT ERROR: ${e?.message || e}`);
    } finally {
      setZipBusy(false);
    }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Qaadi Live</h1>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label>OpenAI Key</label>
          <input value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)}
                 placeholder="sk-..." style={{ width:"100%", padding:8, marginTop:4 }} />
        </div>
        <div>
          <label>DeepSeek Key</label>
          <input value={deepseekKey} onChange={e=>setDeepseekKey(e.target.value)}
                 placeholder="ds-..." style={{ width:"100%", padding:8, marginTop:4 }} />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label>Template</label>
          <select value={template} onChange={e=>setTemplate(e.target.value as Template)} style={{ width:"100%", padding:8, marginTop:4 }}>
            <option value="ReVTeX">ReVTeX (EN)</option>
            <option value="WideAR">Wide/AR (AR)</option>
            <option value="InquiryTR">Inquiry (TR)</option>
          </select>
        </div>
        <div>
          <label>Model</label>
          <select value={model} onChange={e=>setModel(e.target.value as ModelSel)} style={{ width:"100%", padding:8, marginTop:4 }}>
            <option value="auto">auto (OpenAI→DeepSeek)</option>
            <option value="openai">openai</option>
            <option value="deepseek">deepseek</option>
          </select>
        </div>
        <div>
          <label>max_tokens</label>
          <input type="number" value={maxTokens} min={256} max={8192}
                 onChange={e=>setMaxTokens(parseInt(e.target.value||"2048"))}
                 style={{ width:"100%", padding:8, marginTop:4 }} />
        </div>
      </section>

      <section style={{ marginBottom: 12 }}>
        <label>النص</label>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={12}
                  placeholder="ألصقي هنا النص المبعثر…"
                  style={{ width:"100%", padding:8, marginTop:4 }} />
      </section>

      <section style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom: 12 }}>
        <button onClick={doGenerate} disabled={busy} style={{ padding:"8px 12px" }}>
          {busy ? "جارٍ التوليد…" : "Generate"}
        </button>
        <button onClick={exportOrchestrate} disabled={zipBusy} style={{ padding:"8px 12px" }}>
          {zipBusy ? "Preparing ZIP…" : "Export (orchestrate)"}
        </button>
        <button onClick={exportCompose} disabled={zipBusy} style={{ padding:"8px 12px" }}>
          Export (compose demo)
        </button>
      </section>

      {msg && <div style={{ margin: "8px 0" }}>{msg}</div>}

      <section>
        <label>Output</label>
        <textarea value={out} readOnly rows={10} style={{ width:"100%", padding:8, marginTop:4 }} />
      </section>
    </main>
  );
}
