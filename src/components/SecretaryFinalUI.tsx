"use client";

import { useState } from "react";

export default function SecretaryFinalUI() {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<"editor" | "result" | "logs">(
    "editor"
  );
  const [completion, setCompletion] = useState(0);

  const [readyPercent, setReadyPercent] = useState("");
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [boundary, setBoundary] = useState("");
  const [postAnalysis, setPostAnalysis] = useState("");
  const [risks, setRisks] = useState("");
  const [predictions, setPredictions] = useState("");
  const [testability, setTestability] = useState("");
  const [identity, setIdentity] = useState("");

  function extractSection(content: string, title: string): string {
    const regex = new RegExp(`##\\s*${title}\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
    const match = content.match(regex);
    return match ? match[1].trim() : "";
  }

  function extractKeywords(content: string): string[] {
    const section = extractSection(content, "Keywords");
    return section
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter(Boolean);
  }

  function processContent() {
    const readyMatch = input.match(/READY%:\s*(\d+)/i);
    const newReady = readyMatch ? readyMatch[1] : "";
    const newSummary = extractSection(input, "Summary");
    const newKeywords = extractKeywords(input);
    const newBoundary = extractSection(input, "Boundary");
    const newPost = extractSection(input, "Post Analysis");
    const newRisks = extractSection(input, "Risks");
    const newPred = extractSection(input, "Predictions");
    const newTest = extractSection(input, "Testability");
    const newIdent = extractSection(input, "Identity");

    setReadyPercent(newReady);
    setSummary(newSummary);
    setKeywords(newKeywords);
    setBoundary(newBoundary);
    setPostAnalysis(newPost);
    setRisks(newRisks);
    setPredictions(newPred);
    setTestability(newTest);
    setIdentity(newIdent);

    const fields = [
      newSummary,
      newKeywords.length ? "k" : "",
      newBoundary,
      newPost,
      newRisks,
      newPred,
      newTest,
      newIdent,
    ];
    const filled = fields.filter(Boolean).length;
    setCompletion(Math.round((filled / fields.length) * 100));

    setLogs((prev) => [...prev, "Processed input"]);
    setCurrentTab("result");
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Secretary</h2>
        <div className="w-1/2 bg-gray-200 rounded h-2">
          <div
            className="bg-green-500 h-2 rounded"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentTab("editor")}
          className={`px-4 py-2 rounded ${
            currentTab === "editor" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setCurrentTab("result")}
          className={`px-4 py-2 rounded ${
            currentTab === "result" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Result
        </button>
        <button
          onClick={() => setCurrentTab("logs")}
          className={`px-4 py-2 rounded ${
            currentTab === "logs" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Logs
        </button>
      </div>

      {currentTab === "editor" && (
        <div className="space-y-4">
          <textarea
            className="w-full border p-2 min-h-[150px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste the report here..."
          />
          <button
            onClick={processContent}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Process
          </button>
        </div>
      )}

      {currentTab === "logs" && (
        <ul className="list-disc pl-5 space-y-1">
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      )}

      {currentTab === "result" && (
        <div className="space-y-4">
          <div>
            <label className="block font-semibold">Ready%</label>
            <input
              readOnly
              value={readyPercent}
              className="w-full border p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block font-semibold">Summary</label>
            <textarea
              readOnly
              value={summary}
              className="w-full border p-2 bg-gray-100 min-h-[80px]"
            />
          </div>
          <div>
            <label className="block font-semibold">Keywords</label>
            <input
              readOnly
              value={keywords.join(", ")}
              className="w-full border p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block font-semibold">Boundary</label>
            <textarea
              readOnly
              value={boundary}
              className="w-full border p-2 bg-gray-100 min-h-[80px]"
            />
          </div>
          <div>
            <label className="block font-semibold">Post Analysis</label>
            <textarea
              readOnly
              value={postAnalysis}
              className="w-full border p-2 bg-gray-100 min-h-[80px]"
            />
          </div>
          <div>
            <label className="block font-semibold">Risks</label>
            <textarea
              readOnly
              value={risks}
              className="w-full border p-2 bg-gray-100 min-h-[80px]"
            />
          </div>
          <div>
            <label className="block font-semibold">Predictions</label>
            <textarea
              readOnly
              value={predictions}
              className="w-full border p-2 bg-gray-100 min-h-[80px]"
            />
          </div>
          <div>
            <label className="block font-semibold">Testability</label>
            <textarea
              readOnly
              value={testability}
              className="w-full border p-2 bg-gray-100 min-h-[80px]"
            />
          </div>
          <div>
            <label className="block font-semibold">Identity</label>
            <textarea
              readOnly
              value={identity}
              className="w-full border p-2 bg-gray-100 min-h-[80px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

