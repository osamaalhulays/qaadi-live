"use client";
import { useState } from "react";
import TargetSelect from "../../components/TargetSelect";
import LanguageSelect from "../../components/LanguageSelect";
import GenerateButton from "../../components/GenerateButton";

export default function QuickstartPage() {
  const [target, setTarget] = useState("general");
  const [language, setLanguage] = useState("ar");
  const [text, setText] = useState("مثال سريع للنص");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: "ReVTeX",
          model: "auto",
          max_tokens: 512,
          text
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "generate_failed");
      setOut(j?.text || "");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="h1">Quickstart</h1>
      <div className="card grid grid-2" style={{ marginBottom: 12 }}>
        <TargetSelect value={target} onChange={setTarget} />
        <LanguageSelect value={language} onChange={setLanguage} />
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <label>النص</label>
        <textarea rows={6} value={text} onChange={e => setText(e.target.value)} />
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="actions">
          <GenerateButton onClick={handleGenerate} disabled={busy} />
        </div>
      </div>
      <div className="card">
        <label>Output</label>
        <textarea className="output" value={out} readOnly />
      </div>
    </>
  );
}
