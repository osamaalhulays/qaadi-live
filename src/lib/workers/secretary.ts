import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

export interface SecretaryData {
  summary: string;
  keywords: string[];
  tokens: string[];
  equations: string[];
  boundary: string[];
  post_analysis: string;
  risks: string[];
  predictions: string[];
  testability: string;
  references: string[];
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
  let equations: string[];
  let boundary: string[];
  let post_analysis: string;
  let risks: string[];
  let predictions: string[];
  let testability: string;
  let references: string[];

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
      const eqInput = await rl.question("Equations (comma separated): ");
      equations = eqInput
        .split(",")
        .map((e) => e.trim())
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
      const refInput = await rl.question("References (comma separated): ");
      references = refInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
    } finally {
      rl.close();
    }
  } else {
    ({
      summary = "",
      keywords = [],
      tokens = [],
      equations = [],
      boundary = [],
      post_analysis = "",
      risks = [],
      predictions = [],
      testability = "",
      references = [],
    } = data);
  }

  const fields = {
    summary,
    keywords,
    tokens,
    equations,
    boundary,
    post_analysis,
    risks,
    predictions,
    testability,
    references,
  };
  const missing = Object.entries(fields)
    .filter(([, v]) =>
      v === undefined ||
      v === null ||
      (typeof v === "string" && !v.trim()) ||
      (Array.isArray(v) && v.length === 0)
    )
    .map(([k]) => k);
  const ready_percent = Math.round(
    ((Object.keys(fields).length - missing.length) /
      Object.keys(fields).length) *
      100
  );

  const content = [
    `Ready%: ${ready_percent}`,
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
    "## Equations",
    ...equations.map((e) => `- ${e}`),
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
    "## References",
    ...references.map((r) => `- ${r}`),
    "",
    "## Issues",
    ...missing.map((m) => `- type: missing_field\n  note: ${m}`),
    "",
  ].join("\n");

  const filePath = path.join(process.cwd(), "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
