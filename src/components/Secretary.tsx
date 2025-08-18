"use client";

import { useState, FormEvent } from "react";

export default function Secretary() {
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tokens, setTokens] = useState("");
  const [boundary, setBoundary] = useState("");
  const [postAnalysis, setPostAnalysis] = useState("");
  const [risks, setRisks] = useState("");
  const [predictions, setPredictions] = useState("");
  const [testability, setTestability] = useState("");
  const [overflow, setOverflow] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = {
      summary,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      tokens: tokens
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      boundary: boundary
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      post_analysis: postAnalysis,
      risks: risks
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      predictions: predictions
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      testability,
      overflow: overflow
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    };
    const { runSecretary } = await import("../lib/workers/secretary");
    await runSecretary(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Keywords (comma separated)</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Tokens (symbol=definition, comma separated)</label>
        <input
          type="text"
          value={tokens}
          onChange={(e) => setTokens(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Boundary conditions (comma separated)</label>
        <input
          type="text"
          value={boundary}
          onChange={(e) => setBoundary(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Post-analysis</label>
        <textarea
          value={postAnalysis}
          onChange={(e) => setPostAnalysis(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Risks (comma separated)</label>
        <input
          type="text"
          value={risks}
          onChange={(e) => setRisks(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Predictions (comma separated)</label>
        <input
          type="text"
          value={predictions}
          onChange={(e) => setPredictions(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Testability</label>
        <textarea
          value={testability}
          onChange={(e) => setTestability(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Overflow log (comma separated)</label>
        <input
          type="text"
          value={overflow}
          onChange={(e) => setOverflow(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white">
        Save
      </button>
    </form>
  );
}
