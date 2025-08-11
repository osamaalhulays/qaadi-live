'use client';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import JSZip from 'jszip';

type Provider = 'openai' | 'deepseek';
type Mode = 'wide_ar' | 'revtex_en' | 'inquiry_tr';

function sysPrompt(mode: Mode) {
  if (mode === 'revtex_en') {
    return "You are Qaadi scientific writer. Produce a minimal yet complete ReVTeX (revtex4-2) paper: \\\\documentclass[reprint]{revtex4-2}, title, authors (placeholder), abstract, introduction, framework, results, discussion, conclusion, references (placeholders). Output pure LaTeX only.";
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

  const inputStyle: CSSProperties = { width:'100%', padding:10, background:'#0e0f11', color:'#e6e6e7', border:'1px solid #2a2c2f', borderRadius:10 };

  return (
    /* …unchanged UI … */
    <div />
  );
}
