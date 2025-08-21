import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createHash } from "crypto";
import { runGates, type GateResult, type SecretaryReport } from "../workflow/gates";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../");

export interface SecretaryData {
  abstract: string;
  keywords: string[];
  nomenclature: string[];
  boundary_conditions: string[];
  core_equations: string[];
  dimensional_analysis: string;
  limitations_risks: string;
  preliminary_references: string[];
  overflow_log?: string[];
}

/**
 * Collects high level project information and writes a markdown file
 * describing the gathered requirements. When no data is supplied the
 * function falls back to interactive prompts on the command line.
 */
export interface SecretaryResult extends GateResult {
  content: string;
  identity: string;
}

export async function runSecretary(
  data?: Partial<SecretaryData>
): Promise<SecretaryResult> {
  let abstract: string;
  let keywords: string[];
  let nomenclature: string[];
  let boundary_conditions: string[];
  let core_equations: string[];
  let dimensional_analysis: string;
  let limitations_risks: string;
  let preliminary_references: string[];
  let overflow_log: string[];

  if (!data) {
    const rl = createInterface({ input, output });
    try {
      abstract = await rl.question("Abstract: ");
      const keyInput = await rl.question(
        "Keywords (comma separated): "
      );
      keywords = keyInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const nomInput = await rl.question(
        "Nomenclature (symbol|unit|definition, comma separated): "
      );
      nomenclature = nomInput
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      const boundInput = await rl.question(
        "Boundary conditions (comma separated): "
      );
      boundary_conditions = boundInput
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);
      const coreInput = await rl.question(
        "Core equations (comma separated): "
      );
      core_equations = coreInput
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      dimensional_analysis = await rl.question("Dimensional analysis: ");
      limitations_risks = await rl.question("Limitations & Risks: ");
      const refInput = await rl.question(
        "Preliminary references (comma separated): "
      );
      preliminary_references = refInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const overflowInput = await rl.question(
        "Overflow log (comma separated, optional): "
      );
      overflow_log = overflowInput
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    } finally {
      rl.close();
    }
  } else {
    ({
      abstract = "",
      keywords = [],
      nomenclature = [],
      boundary_conditions = [],
      core_equations = [],
      dimensional_analysis = "",
      limitations_risks = "",
      preliminary_references = [],
      overflow_log = [],
    } = data);
  }

  const identityInput = [
    abstract,
    keywords.join(","),
    nomenclature.join(","),
    boundary_conditions.join(","),
    core_equations.join(","),
    dimensional_analysis,
    limitations_risks,
    preliminary_references.join(","),
  ].join("|");
  const identity = createHash("sha256").update(identityInput).digest("hex").slice(0, 8);

  const pkgRaw = await readFile(path.join(projectRoot, "package.json"), "utf8");
  const pkg = JSON.parse(pkgRaw) as { name?: string; version?: string };
  const date = new Date().toISOString().slice(0, 10);
  const fingerprint = `${pkg.name ?? ""}/${pkg.version ?? ""}/${date}/${identity}`;
  console.log("Fingerprint:", fingerprint);

  const audit: SecretaryReport = {
    abstract,
    keywords,
    nomenclature,
    boundary_conditions,
    core_equations,
    dimensional_analysis,
    limitations_risks,
    preliminary_references,
    overflow_log,
    identity,
  };
  const { ready_percent, missing, fields } = runGates({
    secretary: { audit },
  });

  const content = [
    `Fingerprint: ${fingerprint}`,
    `Ready%: ${ready_percent}`,
    "",
    "# Secretary",
    "",
    "## Identity",
    identity,
    "",
    "## Abstract",
    abstract,
    "",
    "## Keywords",
    ...keywords.map((k) => `- ${k}`),
    "",
    "## Nomenclature",
    ...nomenclature.map((n) => `- ${n}`),
    "",
    "## Core Equations",
    ...core_equations.map((e) => `- ${e}`),
    "",
    "## Boundary Conditions",
    ...boundary_conditions.map((b) => `- ${b}`),
    "",
    "## Dimensional Analysis",
    dimensional_analysis,
    "",
    "## Limitations & Risks",
    limitations_risks,
    "",
    "## Preliminary References",
    ...preliminary_references.map((r) => `- ${r}`),
    "",
    "## Overflow Log",
    ...(overflow_log.length > 0
      ? overflow_log.map((o) => `- ${o}`)
      : ["- none"]),
    "",
  ].join("\n");

  const filePath = path.join(projectRoot, "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return { content, ready_percent, missing, fields, identity };
}
