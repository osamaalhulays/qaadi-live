"use client";

import { useState, FormEvent } from "react";

export default function Secretary() {
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tokens, setTokens] = useState("");
  const [boundary, setBoundary] = useState("");
  const [coreEquations, setCoreEquations] = useState("");
  const [dimensional, setDimensional] = useState("");
  const [risks, setRisks] = useState("");
  const [references, setReferences] = useState("");
  const [identity, setIdentity] = useState("");

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
      core_equations: coreEquations
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean),
      dimensional,
      risks: risks
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      references: references
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
    };
    const { runSecretary } = await import("../lib/workers/secretary");
    const content = await runSecretary(data);
    const match = content.match(/## Identity\n([0-9a-f]{8})/);
    if (match) setIdentity(match[1]);
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
        <label className="block font-semibold">Core Equations (one per line)</label>
        <textarea
          value={coreEquations}
          onChange={(e) => setCoreEquations(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Dimensional Analysis</label>
        <textarea
          value={dimensional}
          onChange={(e) => setDimensional(e.target.value)}
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
        <label className="block font-semibold">References (one per line)</label>
        <textarea
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Identity</label>
        <input
          type="text"
          value={identity}
          readOnly
          className="w-full border p-2 bg-gray-100"
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white">
        Save
      </button>
    </form>
  );
}
