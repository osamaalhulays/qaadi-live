"use client";
import { useEffect, useMemo, useState } from "react";
import { latestFilesFor } from "../lib/utils/manifest";
import ScoreCharts from "./ScoreCharts";

type Target =
  | "wide"
  | "revtex"
  | "inquiry"
  | "iop"
  | "sn-jnl"
  | "elsevier"
  | "ieee"
  | "arxiv";
type Lang =
  | "ar"
  | "en"
  | "tr"
  | "fr"
  | "es"
  | "de"
  | "ru"
  | "zh-Hans"
  | "ja"
  | "other";
type ModelSel = "openai" | "deepseek" | "auto";

export default function Editor() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");

  const [target, setTarget] = useState<Target | "">("");
  const [lang, setLang] = useState<Lang | "">("");
  const [model, setModel] = useState<ModelSel>("auto");
  const [maxTokens, setMaxTokens] = useState(2048);
  const [text, setText] = useState("");

  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [verify, setVerify] = useState<null | { eq_before:number; eq_after:number; eq_match:boolean; glossary_entries:number; rtl_ltr:string; idempotency:boolean }>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [judge, setJudge] = useState<any>(null);

  const slug = useMemo(() => {
    if (typeof window !== "undefined") {
      return (
        window.location.pathname.split("/").filter(Boolean)[0] ||
        new URLSearchParams(window.location.search).get("slug") ||
        "default"
      );
    }
    return "default";
  }, []);
  const v = useMemo(() => {
    if (typeof window !== "undefined") {
      return (
        window.location.pathname.split("/").filter(Boolean)[1] ||
        new URLSearchParams(window.location.search).get("v") ||
        "default"
      );
    }
    return "default";
  }, []);

  const snapshotPath = useMemo(() => {
    if (!files.length) return null;
    const latest = files.find(f => f.startsWith(`${v}/`)) || files[0];
    return `/snapshots/${slug}/${latest}`;
  }, [files, slug, v]);

  useEffect(() => {
    try {
      setOpenaiKey(localStorage.getItem("OPENAI_KEY") || "");
      setDeepseekKey(localStorage.getItem("DEEPSEEK_KEY") || "");
      const storedLang = localStorage.getItem("lang");
      if (storedLang) setLang(storedLang as Lang);
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("OPENAI_KEY", openaiKey); } catch {} }, [openaiKey]);
  useEffect(() => { try { localStorage.setItem("DEEPSEEK_KEY", deepseekKey); } catch {} }, [deepseekKey]);
  useEffect(() => {
    try {
      if (lang) {
        localStorage.setItem("lang", lang);
        const d = lang === "ar" || lang === "tr" ? "rtl" : "ltr";
        localStorage.setItem("dir", d);
        document.documentElement.lang = lang;
        document.documentElement.dir = d;
      }
    } catch {}
  }, [lang]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "X-OpenAI-Key": openaiKey || "",
    "X-DeepSeek-Key": deepseekKey || ""
  }), [openaiKey, deepseekKey]);

  async function doGenerate() {
    setBusy(true); setMsg("");
    try {
      if (!target || !lang) throw new Error("missing_target_lang");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ target, lang, model, max_tokens: maxTokens, text, slug, v })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "generate_failed");
      setOut(j?.text || "");
      setVerify(j?.checks || null);
      setMsg(`OK • model=${j?.model_used} • in=${j?.tokens_in} • out=${j?.tokens_out} • ${j?.latency_ms}ms`);
      if (Array.isArray(j?.files)) setFiles(j.files);
      else await refreshFiles();
    } catch (e:any) {
      setMsg(e?.message === "missing_target_lang" ? "يرجى اختيار الهدف واللغة" : `ERROR: ${e?.message || e}`);
      setVerify(null);
    } finally { setBusy(false); }
  }

  async function exportOrchestrate() {
    setZipBusy(true); setMsg("");
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
      downloadBlob(blob, "qaadi_export.zip");
      setMsg("ZIP جاهز (orchestrate).");
      await refreshFiles();
    } catch (e:any) {
      setMsg(e?.message === "missing_target_lang" ? "يرجى اختيار الهدف واللغة" : `EXPORT ERROR: ${e?.message || e}`);
    } finally { setZipBusy(false); }
  }

  async function exportCompose() {
    setZipBusy(true); setMsg("");
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
      downloadBlob(blob, "qaadi_export.zip");
      setMsg("ZIP جاهز (compose).");
      await refreshFiles();
    } catch (e:any) {
      setMsg(e?.message === "missing_target_lang" ? "يرجى اختيار الهدف واللغة" : `EXPORT ERROR: ${e?.message || e}`);
    } finally { setZipBusy(false); }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  async function refreshFiles() {
    try {
      const res = await fetch("/snapshots/manifest.json");
      if (!res.ok) { setFiles([]); return; }
      const list = await res.json();
      if (Array.isArray(list) && list.length) {
        const fl = latestFilesFor(list, slug, v);
        setFiles(fl);
      } else setFiles([]);
    } catch { setFiles([]); }
    try {
      const jr = await fetch("/paper/judge.json");
      if (jr.ok) {
        const jj = await jr.json();
        setJudge(jj);
      } else setJudge(null);
    } catch { setJudge(null); }
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
          <select value={target} onChange={e=>setTarget(e.target.value as Target)}>
            <option value="">--</option>
            <option value="revtex">ReVTeX</option>
            <option value="iop">IOP</option>
            <option value="sn-jnl">SN-JNL</option>
            <option value="elsevier">Elsevier</option>
            <option value="ieee">IEEE</option>
            <option value="arxiv">arXiv</option>
            <option value="wide">Wide</option>
            <option value="inquiry">Inquiry</option>
          </select>
        </div>
        <div>
          <label>Language</label>
          <select value={lang} onChange={e=>setLang(e.target.value as Lang)}>
            <option value="">--</option>
            <option value="en">EN</option>
            <option value="ar">AR</option>
            <option value="tr">TR</option>
            <option value="fr">FR</option>
            <option value="es">ES</option>
            <option value="de">DE</option>
            <option value="ru">RU</option>
            <option value="zh-Hans">ZH-Hans</option>
            <option value="ja">JA</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <label>النص</label>
        <textarea rows={12} placeholder="ألصق هنا النص المبعثر…" value={text} onChange={e=>setText(e.target.value)} />
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div className="actions">
          <button className="btn" onClick={exportCompose} disabled={zipBusy || !target || !lang}>{zipBusy ? "..." : "Export (compose demo)"}</button>
          <button className="btn btn-primary" onClick={exportOrchestrate} disabled={zipBusy || !target || !lang}>{zipBusy ? "..." : "Export ZIP"}</button>
          <button className="btn" onClick={doGenerate} disabled={busy || !target || !lang}>{busy ? "جارٍ…" : "Generate"}</button>
          {snapshotPath && (
            <a className="btn" href={snapshotPath} target="_blank" rel="noopener noreferrer">Open Snapshot</a>
          )}
        </div>
        {!snapshotPath && <div className="note">No snapshot yet</div>}
        {msg && <div className="note">{msg}</div>}
        {verify && (
          <div className="verify-bar">
            <span>
              المعادلات: {verify.eq_before} → {verify.eq_after}
              {verify.eq_match ? <span className="verify-ok"> ✓</span> : <span className="verify-warn"> ⚠️</span>}
            </span>
            {verify.glossary_entries > 0 && (
              <span>Glossary: {verify.glossary_entries}</span>
            )}
            <span>Dir: {verify.rtl_ltr}</span>
            <span>Idempotent: {verify.idempotency ? <span className="verify-ok">✓</span> : <span className="verify-warn">⚠️</span>}</span>
          </div>
        )}
        {judge && (
          <div className="charts">
            {typeof judge.percentage === "number" && judge.classification && (
              <div className="judge-summary" style={{marginBottom:8}}>
                {judge.classification} • {judge.percentage.toFixed(1)}%
              </div>
            )}
            {judge.criteria && (
              <ScoreCharts criteria={judge.criteria} />
            )}
          </div>
        )}
        {files.length > 0 && (
          <div className="file-list">
            <ul>
              {files.map(f => <li key={f}>{f}</li>)}
            </ul>
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
