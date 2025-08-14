"use client";

import { useEffect, useState } from "react";

interface Props {
  openaiKey: string;
  setOpenaiKey: (v: string) => void;
  deepseekKey: string;
  setDeepseekKey: (v: string) => void;
}

export default function KeyManager({ openaiKey, setOpenaiKey, deepseekKey, setDeepseekKey }: Props) {
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    try {
      setOpenaiKey(localStorage.getItem("OPENAI_KEY") || "");
      setDeepseekKey(localStorage.getItem("DEEPSEEK_KEY") || "");
    } catch {}
  }, [setOpenaiKey, setDeepseekKey]);

  async function testAndSave() {
    setMsg("...");
    try {
      const res = await fetch("/api/health", {
        headers: {
          "X-OpenAI-Key": openaiKey || "",
          "X-DeepSeek-Key": deepseekKey || ""
        }
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `status_${res.status}`);
      }
      localStorage.setItem("OPENAI_KEY", openaiKey);
      localStorage.setItem("DEEPSEEK_KEY", deepseekKey);
      setMsg("OK");
    } catch (e: any) {
      setMsg(`ERROR: ${e?.message || e}`);
    }
  }

  return (
    <div className="card grid grid-3" style={{ marginBottom: 12 }}>
      <div>
        <label>DeepSeek Key</label>
        <input value={deepseekKey} onChange={e => setDeepseekKey(e.target.value)} placeholder="...ds" />
      </div>
      <div>
        <label>OpenAI Key</label>
        <input value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="...sk" />
      </div>
      <div style={{ alignSelf: "end" }}>
        <button className="btn" onClick={testAndSave}>Test Keys</button>
        {msg && <div className="note">{msg}</div>}
      </div>
    </div>
  );
}

