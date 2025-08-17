"use client";

export async function analyzeDraft(opts: {
  target: string | "";
  lang: string | "";
  model: string;
  maxTokens: number;
  text: string;
  slug: string;
  v: string;
  headers: any;
  setOut: (s: string) => void;
  setVerify: (v: any) => void;
  setMsg: (s: string) => void;
  setFiles: (f: string[]) => void;
  refreshFiles: () => Promise<void>;
}) {
  const {
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
    refreshFiles
  } = opts;
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
  } catch (e: any) {
    setMsg(e?.message === "missing_target_lang" ? "يرجى اختيار الهدف واللغة" : `ERROR: ${e?.message || e}`);
    setVerify(null);
  }
}

export default function Consultant() {
  return (
    <div>
      <h2>Consultant</h2>
      <p>Analyzes drafts.</p>
    </div>
  );
}
