import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createHash } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../");

export interface SecretaryData {
  summary: string;
  keywords: string[];
  tokens: string[];
  boundary: string[];
  core_equations: string[];
  dimensional: string;
  risks: string[];
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
  let boundary: string[];
  let core_equations: string[];
  let dimensional: string;
  let risks: string[];
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
      const coreInput = await rl.question(
        "Core equations (comma separated): "
      );
      core_equations = coreInput
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
      dimensional = await rl.question("Dimensional analysis: ");
      const riskInput = await rl.question("Risks (comma separated): ");
      risks = riskInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const refInput = await rl.question(
        "References (comma separated): "
      );
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
      boundary = [],
      core_equations = [],
      dimensional = "",
      risks = [],
      references = [],
    } = data);
  }

  const identityInput = [
    summary,
    keywords.join(","),
    tokens.join(","),
    core_equations.join(","),
    boundary.join(","),
    dimensional,
    risks.join(","),
    references.join(","),
  ].join("|");
  const identity = createHash("sha256").update(identityInput).digest("hex").slice(0, 8);

  const pkgRaw = await readFile(path.join(projectRoot, "package.json"), "utf8");
  const pkg = JSON.parse(pkgRaw) as { name?: string; version?: string };
  const date = new Date().toISOString().slice(0, 10);
  const fingerprint = `${pkg.name ?? ""}/${pkg.version ?? ""}/${date}/${identity}`;
  console.log("Fingerprint:", fingerprint);

  const fields = {
    summary,
    keywords,
    tokens,
    core_equations,
    boundary,
    dimensional,
    risks,
    references,
    identity,
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
    `Fingerprint: ${fingerprint}`,
    `Ready%: ${ready_percent}`,
    "",
    "# Secretary",
    "",
    "## Identity",
    identity,
    "",
    "## Summary",
    summary,
    "",
    "## Keywords",
    ...keywords.map((k) => `- ${k}`),
    "",
    "## Nomenclature",
    "| Symbol | Definition |",
    "|--------|------------|",
    ...tokens.map((t) => {
      const [sym, def] = t.split(":").map((s) => s.trim());
      return `| ${sym} | ${def} |`;
    }),
    "",
    "## Core Equations",
    ...core_equations.map((e) => `- ${e}`),
    "",
    "## Boundary Conditions",
    ...boundary.map((b) => `- ${b}`),
    "",
    "## Dimensional Analysis",
    dimensional,
    "",
    "## Risks",
    ...risks.map((r) => `- ${r}`),
    "",
    "## References",
    ...references.map((r) => `- ${r}`),
    "",
  ].join("\n");

  const filePath = path.join(projectRoot, "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
