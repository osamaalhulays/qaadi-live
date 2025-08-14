"use client";
import { useState } from "react";

export default function StudioPage() {
  const [target, setTarget] = useState("Academic");
  const [language, setLanguage] = useState("Arabic");
  const [text, setText] = useState("");

  function handleGenerate() {
    // Placeholder for generation logic
    console.log({ target, language, text });
  }

  return (
    <>
      <h1 className="h1"><span className="badge">⚖️</span> Qaadi Studio</h1>

      <div className="card grid grid-2" style={{ marginBottom: 12 }}>
        <div>
          <label>Target</label>
          <select value={target} onChange={e => setTarget(e.target.value)}>
            <option value="Academic">Academic</option>
            <option value="Legal">Legal</option>
            <option value="News">News</option>
          </select>
        </div>
        <div>
          <label>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="Arabic">Arabic</option>
            <option value="English">English</option>
            <option value="Turkish">Turkish</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <label>النص</label>
        <textarea
          rows={10}
          placeholder="أدخل النص هنا..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={handleGenerate}>Generate</button>
      </div>
    </>
  );
}
