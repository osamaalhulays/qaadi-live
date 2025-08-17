"use client";
import { useEffect, useMemo, useState } from "react";
import ScoreCharts from "./ScoreCharts";
import type { Criterion } from "../lib/criteria";
import { organizeDraft } from "./Secretary/Organizer";
import { evaluateDraft } from "./Judge/Evaluate";
import { analyzeDraft } from "./Consultant/Analyze";
import {
  exportOrchestrate as journalistExportOrchestrate,
  exportCompose as journalistExportCompose,
} from "./Journalist/Export";

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
  const [selfTest, setSelfTest] = useState<null | { ratio:number; deviations:{role:string; expected:string; found:string}[] }>(null);
  const [selfBusy, setSelfBusy] = useState(false);

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [newId, setNewId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newWeight, setNewWeight] = useState(1);
  const [newKeywords, setNewKeywords] = useState("");

  const [slug, setSlug] = useState("default");
  const [v, setV] = useState("default");

  const slugRe = /^[A-Za-z0-9_-]*$/;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const params = new URLSearchParams(window.location.search);
      const sCandidate = parts[0] || params.get("slug") || "default";
      const verCandidate = parts[1] || params.get("v") || "default";
      const s = slugRe.test(sCandidate) ? sCandidate : "default";
      const ver = slugRe.test(verCandidate) ? verCandidate : "default";
      setSlug(s);
      setV(ver);
    }
  }, []);

  const snapshotPath = useMemo(() => {
    if (!files.length) return null;
    return `/${files[0]}`;
  }, [files]);

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
  useEffect(() => { refreshFiles(); }, [slug, v]);
  useEffect(() => { refreshCriteriaList(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/selftest?slug=${slug}`);
        if (res.ok) {
          const j = await res.json();
          setSelfTest(j);
        }
      } catch {}
    })();
  }, [slug]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "X-OpenAI-Key": openaiKey || "",
    "X-DeepSeek-Key": deepseekKey || ""
  }), [openaiKey, deepseekKey]);

  async function doGenerate() {
    setBusy(true);
    setMsg("");
    try {
      await analyzeDraft({
        target,
        lang,
        model,
        maxTokens,
        text,
        slug,
        v,
        headers,
        setOut,
        setVerify,
        setMsg,
        setFiles,
        refreshFiles,
      });
    } finally {
      setBusy(false);
    }
  }

  function runSelfTest() {
    evaluateDraft(text, slug, headers, setSelfTest, setMsg, setSelfBusy);
  }

  async function refreshCriteriaList() {
    try {
      const res = await fetch("/api/criteria");
      if (res.ok) {
        const list = await res.json();
        setCriteria(Array.isArray(list) ? list : []);
      } else setCriteria([]);
    } catch { setCriteria([]); }
  }

  function exportOrchestrate() {
    journalistExportOrchestrate({
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
      refreshFiles,
    });
  }

  function exportCompose() {
    journalistExportCompose({
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
      refreshFiles,
    });
  }

  async function refreshFiles() {
    await organizeDraft(slug, v, setFiles, setJudge, refreshCriteriaList);
  }

  async function addCustomCriterion() {
    try {
      const payload = {
        id: newId,
        description: newDesc,
        weight: Number(newWeight),
        keywords: newKeywords.split(",").map(k => k.trim()).filter(Boolean),
      };
      const res = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const c = await res.json();
        setCriteria(prev => [...prev, c]);
        setNewId(""); setNewDesc(""); setNewWeight(1); setNewKeywords("");
      }
    } catch {}
  }

  async function toggleCriterion(id: string) {
    const c = criteria.find(c => c.id === id);
    if (!c) return;
    try {
      const res = await fetch("/api/criteria", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !c.enabled }),
      });
      if (res.ok) {
        const upd = await res.json();
        setCriteria(prev => prev.map(x => x.id === id ? upd : x));
      }
    } catch {}
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

      <div className="card grid grid-2" style={{marginBottom:12}}>
        <div>
          <label>Slug</label>
          <input
            value={slug}
            onChange={e => {
              const val = e.target.value;
              if (slugRe.test(val)) setSlug(val);
            }}
            placeholder="demo"
          />
        </div>
        <div>
          <label>Version</label>
          <input
            value={v}
            onChange={e => {
              const val = e.target.value;
              if (slugRe.test(val)) setV(val);
            }}
            placeholder="v1"
          />
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
        <label>Custom Criteria</label>
        <div className="criteria-list">
          {criteria.map(c => (
            <div key={c.id}>
              <label>
                <input type="checkbox" checked={c.enabled} onChange={() => toggleCriterion(c.id)} /> {c.description} ({c.weight})
              </label>
            </div>
          ))}
        </div>
        <div className="add-crit" style={{marginTop:8}}>
          <input placeholder="ID" value={newId} onChange={e=>setNewId(e.target.value)} />
          <input placeholder="Description" value={newDesc} onChange={e=>setNewDesc(e.target.value)} />
          <input type="number" placeholder="Weight" value={newWeight} onChange={e=>setNewWeight(parseInt(e.target.value||"1"))} />
          <input placeholder="keywords,comma" value={newKeywords} onChange={e=>setNewKeywords(e.target.value)} />
          <button className="btn" type="button" onClick={addCustomCriterion}>Add</button>
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
          <button className="btn" onClick={runSelfTest} disabled={selfBusy || !text}>{selfBusy ? "..." : "Self-Test"}</button>
          {snapshotPath && (
            <a className="btn" href={snapshotPath} target="_blank" rel="noopener noreferrer">Open Snapshot</a>
          )}
        </div>
        {!snapshotPath && <div className="note">No snapshot yet</div>}
        {msg && <div className="note">{msg}</div>}
        {selfTest && (
          <div className="note">Self-Test {(selfTest.ratio * 100).toFixed(0)}% · deviations: {selfTest.deviations.length}</div>
        )}
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
