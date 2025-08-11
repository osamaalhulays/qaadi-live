'use client';
import { useEffect, useState } from 'react';
import JSZip from 'jszip';

type Provider = 'openai' | 'deepseek';
type Mode = 'wide_ar' | 'revtex_en' | 'inquiry_tr';

function sysPrompt(mode: Mode) {
  if (mode === 'revtex_en') {
    return "You are Qaadi scientific writer. Produce a minimal yet complete ReVTeX (revtex4-2) paper: \documentclass[reprint]{revtex4-2}, title, authors (placeholder), abstract, introduction, framework, results, discussion, conclusion, references (placeholders). Output pure LaTeX only.";
  }
  if (mode === 'inquiry_tr') {
    return "Qaadi soru-cevap yazarı. Çıktıyı Markdown/TR ver: Başlık; Özet; Sorular; Varsayımlar; Deney/Doğrulama Planı; Beklenen Sonuçlar; Kaynaklar.";
  }
  return "أنت كاتب Qaadi. أعطني Markdown عربي منظّم بعنوان؛ ملخص تنفيذي؛ فرضيات؛ صياغة رياضية (LaTeX)؛ خطة تحقق/تجربة؛ نتائج متوقعة؛ مراجع موجزة.";
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('wide_ar');
  const [model, setModel] = useState('gpt-4o-mini');
  const [maxTokens, setMaxTokens] = useState(800);
  const [prompt, setPrompt] = useState('');
  const [primary, setPrimary] = useState<Provider>('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('qaadi_openai_key') || '');
    setDeepseekKey(localStorage.getItem('qaadi_deepseek_key') || '');
  }, []);

  function saveKeys() {
    localStorage.setItem('qaadi_openai_key', openaiKey || '');
    localStorage.setItem('qaadi_deepseek_key', deepseekKey || '');
    setStatus('Keys saved locally.');
  }

  async function generate(zipWanted=false) {
    setBusy(true); setStatus('Sending request...');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred: primary,
          openaiKey: openaiKey || undefined,
          deepseekKey: deepseekKey || undefined,
          mode, model, max_tokens: maxTokens,
          sys: sysPrompt(mode),
          prompt,
          zip: zipWanted
        })
      });
      const j = await res.json();
      if (!res.ok) { setOut(JSON.stringify(j, null, 2)); setStatus('Generation failed.'); return; }
      setOut(j.output || ''); setStatus('Done.');

      if (zipWanted && j.output) {
        const zip = new JSZip();
        const root = 'qaadi_build';
        if (mode === 'revtex_en') {
          zip.file(`${root}/paper/revtex/en/draft.tex`, j.output);
        } else if (mode === 'inquiry_tr') {
          zip.file(`${root}/paper/inquiry/tr/inquiry.md`, j.output);
        } else {
          zip.file(`${root}/paper/wide/ar/bundle.md`, j.output);
        }
        zip.file(`${root}/manifest.json`, JSON.stringify({ mode, timestamp: new Date().toISOString() }, null, 2));
        const blob = await zip.generateAsync({ type:'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'qaadi_build.zip';
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (e:any) {
      setOut(String(e?.message || e)); setStatus('Generation failed (network).');
    } finally { setBusy(false); }
  }

  const inputStyle: React.CSSProperties = { width:'100%', padding:10, background:'#0e0f11', color:'#e6e6e7', border:'1px solid #2a2c2f', borderRadius:10 };

  return (
    <div style={{maxWidth:900, margin:'36px auto', padding:'24px', background:'#141416', borderRadius:16, boxShadow:'0 10px 30px rgba(0,0,0,.4)'}}>
      <h1 style={{margin:0,fontSize:26}}>Qaadi — Web Edition (BYOK)</h1>
      <div style={{color:'#9aa0a6',marginBottom:10,fontSize:14}}>Your keys stay in your browser (localStorage). We do not store them.</div>

      <div style={{display:'flex', gap:12, marginBottom:12}}>
        <div style={{flex:1}}>
          <label>Preferred provider</label>
          <select value={primary} onChange={e=>setPrimary(e.target.value as Provider)} style={inputStyle}>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>
        <div style={{flex:1}}>
          <label>Template</label>
          <select value={mode} onChange={e=>setMode(e.target.value as Mode)} style={inputStyle}>
            <option value="wide_ar">Wide / AR</option>
            <option value="revtex_en">ReVTeX / EN</option>
            <option value="inquiry_tr">Inquiry / TR</option>
          </select>
        </div>
        <div style={{flex:1}}>
          <label>Model</label>
          <input value={model} onChange={e=>setModel(e.target.value)} style={inputStyle} />
        </div>
        <div style={{flex:1}}>
          <label>Max tokens</label>
          <input value={maxTokens} onChange={e=>setMaxTokens(parseInt(e.target.value||'0')||800)} style={inputStyle} />
        </div>
      </div>

      <div style={{display:'flex', gap:12, marginBottom:12}}>
        <div style={{flex:1}}>
          <label>OpenAI Key</label>
          <input value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)} placeholder="sk-..." style={inputStyle} />
        </div>
        <div style={{flex:1}}>
          <label>DeepSeek Key</label>
          <input value={deepseekKey} onChange={e=>setDeepseekKey(e.target.value)} placeholder="sk-..." style={inputStyle} />
        </div>
      </div>

      <button onClick={saveKeys} style={{background:'#2a2c2f', color:'#e6e6e7', border:0, padding:'12px 18px', borderRadius:12}}>Save keys locally</button>

      <label style={{display:'block', marginTop:12}}>Prompt / task</label>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Paste your text here" style={{width:'100%', minHeight:150, padding:12, background:'#0e0f11', color:'#e6e6e7', border:'1px solid #2a2c2f', borderRadius:12}} />

      <div style={{display:'flex', gap:12, marginTop:12}}>
        <button disabled={busy} onClick={()=>generate(false)} style={{background:'#1E88E5', color:'#fff', border:0, padding:'12px 18px', borderRadius:12}}>{busy?'...':'Generate'}</button>
        <button disabled={busy} onClick={()=>generate(true)} style={{background:'#2a2c2f', color:'#e6e6e7', border:0, padding:'12px 18px', borderRadius:12}}>Generate + Download ZIP</button>
      </div>

      <div style={{marginTop:10, fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'}}>{status}</div>
      <pre style={{marginTop:10, background:'#0e0f11', border:'1px solid #2a2c2f', padding:12, borderRadius:12, whiteSpace:'pre-wrap'}}>{out}</pre>
      <div style={{marginTop:10, color:'#7a7f85', fontSize:12}}>Keys are stored only in your browser; clear them from browser settings at any time.</div>
    </div>
  );
}
