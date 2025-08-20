"use client";
import { useEffect, useMemo, useState } from "react";
import { latestFilesFor } from "../lib/utils/manifest";
import ScoreCharts from "./ScoreCharts";
import type { Criterion } from "../lib/criteria";
import { runGates, type SecretaryReport } from "../lib/workflow";

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

interface JudgeCriterion {
  id: number;
  name: string;
  score: number;
  gap: number;
  type?: "internal" | "external" | "advisory";
  covered?: boolean;
}

interface Judge {
  percentage: number;
  classification: "accepted" | "needs_improvement" | "weak";
  criteria: JudgeCriterion[];
}

interface SelfTestDeviation {
  role: string;
  expected: string;
  found: string;
}

interface SelfTest {
  ratio: number;
  deviations: SelfTestDeviation[];
}

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
  const [judge, setJudge] = useState<Judge | null>(null);
  const [selfTest, setSelfTest] = useState<SelfTest | null>(null);
  const [selfBusy, setSelfBusy] = useState(false);
  const [errors, setErrors] = useState<{[key:string]: string}>({});

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
          const j: SelfTest = await res.json();
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

  function validate() {
    const errs: {[key:string]: string} = {};
    if (!openaiKey && !deepseekKey) errs.openaiKey = "يرجى إدخال مفتاح API";
    if (!target) errs.target = "يرجى اختيار الهدف";
    if (!lang) errs.lang = "يرجى اختيار اللغة";
    if (!text) errs.text = "يرجى إدخال النص";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function doGenerate() {
    if (!validate()) return;
    setBusy(true); setMsg("");
    try {
      if (!target || !lang) throw new Error("missing_target_lang");
      const url = target === "inquiry" ? "/api/inquiry" : "/api/generate";
      const payload =
        target === "inquiry"
          ? { lang, plan: text, slug, v }
          : { target, lang, model, max_tokens: maxTokens, text, slug, v };
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "generate_failed");
      setOut(j?.text || "");
      if (target !== "inquiry") setVerify(j?.checks || null);
      else setVerify(null);
      if (target !== "inquiry")
        setMsg(`OK • model=${j?.model_used} • in=${j?.tokens_in} • out=${j?.tokens_out} • ${j?.latency_ms}ms`);
      else setMsg("OK");
      if (Array.isArray(j?.files)) setFiles(j.files);
      else await refreshFiles();
    } catch (e:any) {
      setMsg(e?.message === "missing_target_lang" ? "يرجى اختيار الهدف واللغة" : `ERROR: ${e?.message || e}`);
      setVerify(null);
    } finally { setBusy(false); }
  }

  async function runSelfTest() {
    setSelfBusy(true); setMsg("");
    try {
      const res = await fetch("/api/selftest", {
        method: "POST",
        headers,
        body: JSON.stringify({ slug, sample: text })
      });
      const j: SelfTest = await res.json();
      if (!res.ok) throw new Error((j as any)?.error || "selftest_failed");
      setSelfTest(j);
      setMsg(`Self-Test ${(j.ratio * 100).toFixed(0)}%`);
    } catch (e:any) {
      setMsg(`Self-Test ERROR: ${e?.message || e}`);
    } finally { setSelfBusy(false); }
  }

  async function exportOrchestrate() {
    if (!validate()) return;
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
    if (!validate()) return;
    setZipBusy(true); setMsg("");
    try {
      if (!target || !lang) throw new Error("missing_target_lang");
      const secFields: SecretaryReport = {
        abstract: "demo abstract",
        keywords: ["demo"],
        nomenclature: [{ symbol: "d", definition: "demo" }],
        core_equations: ["demo"],
        boundary_conditions: ["demo"],
        dimensional_analysis: "demo",
        limitations_risks: ["demo"],
        references: ["demo"],
        overflow: ["demo"],
        identity: "demo",
      };
      const gate = runGates({ secretary: { audit: secFields } });
      const res = await fetch("/api/export", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "compose",
          name: "qaadi_export.zip",
          slug,
          v,
          input: { text },
          secretary: { audit: { fields: secFields, ready_percent: gate.ready_percent, missing: gate.missing } },
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

  async function refreshCriteriaList() {
    try {
      const res = await fetch("/api/criteria");
      if (res.ok) {
        const list = await res.json();
        setCriteria(Array.isArray(list) ? list : []);
      } else setCriteria([]);
    } catch { setCriteria([]); }
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
        const jj: Judge = await jr.json();
        setJudge(jj);
      } else setJudge(null);
    } catch { setJudge(null); }
    await refreshCriteriaList();
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

  const hasApiKey = Boolean(openaiKey.trim() || deepseekKey.trim());
  const requiredFilled = [hasApiKey, target, lang, text].filter(Boolean).length;
  const progress = (requiredFilled / 4) * 100;
  const ready = requiredFilled === 4;

  return (
    <>
      <div className="card grid grid-2" style={{marginBottom:12}}>
        <div>
          <label>DeepSeek Key</label>
          <input value={deepseekKey} onChange={e=>{setDeepseekKey(e.target.value); if(errors.openaiKey) setErrors(prev=>({...prev, openaiKey:""}));}} placeholder="...ds" title="مفتاح DeepSeek API (اختياري)" />
          <small className="hint">اختياري</small>
        </div>
        <div>
          <label>OpenAI Key</label>
          <input value={openaiKey} onChange={e=>{setOpenaiKey(e.target.value); if(errors.openaiKey) setErrors(prev=>({...prev, openaiKey:""}));}} placeholder="...sk" title="مفتاح OpenAI API" />
          <small className="hint">مطلوب إذا لم تستخدم DeepSeek</small>
          {errors.openaiKey && <div className="error" style={{color:'red'}}>{errors.openaiKey}</div>}
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
            title="معرف المشروع"
          />
          <small className="hint">أحرف وأرقام فقط</small>
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
            title="إصدار المستند"
          />
          <small className="hint">مثال: v1</small>
        </div>
      </div>

      <div className="card grid grid-4" style={{marginBottom:12}}>
        <div>
          <label>max_tokens</label>
          <input type="number" value={maxTokens} min={256} max={8192} onChange={e=>setMaxTokens(parseInt(e.target.value||"2048"))} title="الحد الأقصى لطول الاستجابة" />
          <small className="hint">الحد الأعلى للرموز</small>
        </div>
        <div>
          <label>Model</label>
          <select value={model} onChange={e=>setModel(e.target.value as ModelSel)} title="النموذج المستخدم">
            <option value="auto">auto (OpenAI→DeepSeek)</option>
            <option value="openai">openai</option>
            <option value="deepseek">deepseek</option>
          </select>
          <small className="hint">اختر النموذج</small>
        </div>
        <div>
          <label>Target</label>
          <select value={target} onChange={e=>{setTarget(e.target.value as Target); if(errors.target) setErrors(prev=>({...prev, target:""}));}} title="قالب الإخراج">
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
          {errors.target && <div className="error" style={{color:'red'}}>{errors.target}</div>}
          <small className="hint">اختر قالب التهيئة</small>
        </div>
        <div>
          <label>Language</label>
          <select value={lang} onChange={e=>{setLang(e.target.value as Lang); if(errors.lang) setErrors(prev=>({...prev, lang:""}));}} title="لغة المستند">
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
          {errors.lang && <div className="error" style={{color:'red'}}>{errors.lang}</div>}
          <small className="hint">اختر اللغة</small>
        </div>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <label>Custom Criteria</label>
        <small className="hint">إضافة معايير مخصصة للتقييم</small>
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
          <input placeholder="ID" value={newId} onChange={e=>setNewId(e.target.value)} title="معرف فريد" />
          <input placeholder="Description" value={newDesc} onChange={e=>setNewDesc(e.target.value)} title="وصف المعيار" />
          <input type="number" placeholder="Weight" value={newWeight} onChange={e=>setNewWeight(parseInt(e.target.value||"1"))} title="وزن المعيار" />
          <input placeholder="keywords,comma" value={newKeywords} onChange={e=>setNewKeywords(e.target.value)} title="كلمات مفتاحية مفصولة بفواصل" />
          <button className="btn" type="button" onClick={addCustomCriterion}>Add</button>
        </div>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <label>النص</label>
        <textarea rows={12} placeholder="ألصق هنا النص المبعثر…" value={text} onChange={e=>{setText(e.target.value); if(errors.text) setErrors(prev=>({...prev, text:""}));}} title="النص المراد معالجته" />
        {errors.text && <div className="error" style={{color:'red'}}>{errors.text}</div>}
        <small className="hint">النص المطلوب معالجته</small>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <progress value={progress} max={100} style={{width:"100%", marginBottom:8}}></progress>
        <div className="note">{progress.toFixed(0)}% مكتمل</div>
        <div className="actions">
          <button className="btn" onClick={exportCompose} disabled={zipBusy || !ready}>{zipBusy ? "..." : "Export (compose demo)"}</button>
          <button className="btn btn-primary" onClick={exportOrchestrate} disabled={zipBusy || !ready}>{zipBusy ? "..." : "Export ZIP"}</button>
          <button className="btn" onClick={doGenerate} disabled={busy || !ready}>{busy ? "جارٍ…" : "Generate"}</button>
          <button className="btn" onClick={runSelfTest} disabled={selfBusy || !text || !hasApiKey}>{selfBusy ? "..." : "Self-Test"}</button>
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
        <textarea className="output" value={out} readOnly title="الناتج المولد" />
        <small className="hint">الناتج بعد المعالجة</small>
      </div>
    </>
  );
}
