"use client";

import { useState, FormEvent } from "react";

export default function Secretary() {
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [nomenclature, setNomenclature] = useState("");
  const [boundaryConditions, setBoundaryConditions] = useState("");
  const [coreEquations, setCoreEquations] = useState("");
  const [dimensional, setDimensional] = useState("");
  const [limitationsRisks, setLimitationsRisks] = useState("");
  const [references, setReferences] = useState("");
  const [overflow, setOverflow] = useState("");
  const [identity, setIdentity] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = {
      abstract,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      nomenclature: nomenclature
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean),
      boundary_conditions: boundaryConditions
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      core_equations: coreEquations
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean),
      dimensional_analysis: dimensional,
      limitations_risks: limitationsRisks,
      preliminary_references: references
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      overflow_log: overflow
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    };
      const res = await fetch("/api/secretary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = (await res.json()) as { identity?: string };
        if (json.identity) setIdentity(json.identity);
      }
    }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold">Abstract (150–300 words)</label>
        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
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
        <label className="block font-semibold">
          Nomenclature (symbol | unit | definition per line)
        </label>
        <textarea
          value={nomenclature}
          onChange={(e) => setNomenclature(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">
          Boundary Conditions (type: expression per line)
        </label>
        <textarea
          value={boundaryConditions}
          onChange={(e) => setBoundaryConditions(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">
          Core Equations (LaTeX, one per line)
        </label>
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
        <label className="block font-semibold">Limitations &amp; Risks</label>
        <textarea
          value={limitationsRisks}
          onChange={(e) => setLimitationsRisks(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">
          Preliminary References (one per line)
        </label>
        <textarea
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block font-semibold">Overflow Log (comma separated)</label>
        <input
          type="text"
          value={overflow}
          onChange={(e) => setOverflow(e.target.value)}
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
