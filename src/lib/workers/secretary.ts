import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runGates } from "../workflow";

export interface SecretaryData {
  summary: string;
  keywords: string[];
  tokens: string[];
  boundary: string[];
  post_analysis: string;
  risks: string[];
  predictions: string[];
  testability: string;
}

/**
 * Collects high level project information and writes a markdown file
 * describing the gathered requirements. When no data is supplied the
 * function falls back to interactive prompts on the command line.
 */
export async function runSecretary(data?: Partial<SecretaryData>) {
  let summary: string;
  let keywords: string[];
  let tokens: string[];
  let boundary: string[];
  let post_analysis: string;
  let risks: string[];
  let predictions: string[];
  let testability: string;

  if (!data) {
    const rl = createInterface({ input, output });
    try {
      summary = await rl.question("Summary: ");
      const keyInput = await rl.question(
        "Keywords (comma separated): "
      );
      keywords = keyInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const tokInput = await rl.question(
        "Tokens and definitions (symbol=definition, comma separated): "
      );
      tokens = tokInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
        const boundInput = await rl.question(
          "Boundary conditions (comma separated): "
        );
      boundary = boundInput
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);
      post_analysis = await rl.question("Post-analysis: ");
      const riskInput = await rl.question("Risks (comma separated): ");
      risks = riskInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const predInput = await rl.question("Predictions (comma separated): ");
      predictions = predInput
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
        testability = await rl.question("Testability: ");
      } finally {
        rl.close();
      }
    } else {
      ({
        summary = "",
        keywords = [],
        tokens = [],
        boundary = [],
        post_analysis = "",
        risks = [],
        predictions = [],
        testability = "",
      } = data);
    }

    const fields = {
      summary,
      keywords,
      tokens,
      boundary,
      post_analysis,
      risks,
      predictions,
      testability,
    };
  const baseGate = runGates({ secretary: { audit: { ...fields, issues: [] } } });
  const issues = Object.entries(baseGate.fields)
    .filter(([name, info]) => name !== "issues" && info.score < 1)
    .map(([name, info]) => ({
      type: info.status === "missing" ? "missing_field" : "partial_field",
      note: name,
    }));
  const gate = runGates({ secretary: { audit: { ...fields, issues } } });

  const content = [
    `Ready%: ${gate.ready_percent}`,
    "",
    "# Secretary",
    "",
    "## Summary",
    summary,
    "",
    "## Keywords",
    ...keywords.map((k) => `- ${k}`),
    "",
    "## Tokens and Definitions",
    ...tokens.map((t) => `- ${t}`),
    "",
    "## Boundary Conditions",
    ...boundary.map((b) => `- ${b}`),
    "",
    "## Post-Analysis",
    post_analysis,
    "",
    "## Risks",
    ...risks.map((r) => `- ${r}`),
    "",
    "## Predictions",
    ...predictions.map((p) => `- ${p}`),
    "",
    "## Testability",
    testability,
    "",
    "## Issues",
    ...issues.map((i) => `- type: ${i.type}\n  note: ${i.note}`),
    "",
  ].join("\n");

  const filePath = path.join(process.cwd(), "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
