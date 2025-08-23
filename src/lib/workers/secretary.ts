import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createHash } from "crypto";

export interface SecretaryData {
  abstract: string;
  keywords: string[];
  nomenclature: string[];
  symbols_units: string[];
  boundary_conditions: string[];
  core_equations: string[];
  assumptions_scope: string[];
  dimensional_analysis: string;
  limitations_risks: string;
  preliminary_references: string[];
  version: string;
  status: string;
  parent_id: string;
  overflow_log?: string[];
}

/**
 * Collects high level project information and writes a markdown file
 * describing the gathered requirements. When no data is supplied the
 * function falls back to interactive prompts on the command line.
 */
export async function runSecretary(
  data?: Partial<SecretaryData>,
  basePath: string = process.cwd()
) {
  const debug = (msg: string) => {
    if (process.env.DEBUG_SECRETARY) {
      console.log(`runSecretary: ${msg}`);
    }
  };

  let abstract: string;
  let keywords: string[];
  let nomenclature: string[];
  let symbols_units: string[];
  let boundary_conditions: string[];
  let core_equations: string[];
  let assumptions_scope: string[];
  let dimensional_analysis: string;
  let limitations_risks: string;
  let preliminary_references: string[];
  let version: string;
  let status: string;
  let parent_id: string;
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
      const symInput = await rl.question(
        "Symbols & units (symbol|unit, comma separated): "
      );
      symbols_units = symInput
        .split(",")
        .map((s) => s.trim())
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
      const assumpInput = await rl.question(
        "Assumptions & scope (comma separated): "
      );
      assumptions_scope = assumpInput
        .split(",")
        .map((a) => a.trim())
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
      version = await rl.question("Version: ");
      status = await rl.question("Status: ");
      parent_id = await rl.question("Parent ID: ");
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
      symbols_units = [],
      boundary_conditions = [],
      core_equations = [],
      assumptions_scope = [],
      dimensional_analysis = "",
      limitations_risks = "",
      preliminary_references = [],
      version = "",
      status = "",
      parent_id = "",
      overflow_log = [],
    } = data);
  }

  if (!overflow_log || overflow_log.length === 0) {
    overflow_log = ["none"];
  }

  const identityInput = [
    abstract,
    keywords.join(","),
    nomenclature.join(","),
    symbols_units.join(","),
    boundary_conditions.join(","),
    core_equations.join(","),
    assumptions_scope.join(","),
    dimensional_analysis,
    limitations_risks,
    preliminary_references.join(","),
    version,
    status,
    parent_id,
    overflow_log.join(","),
  ].join("|");
  const identity = createHash("sha256").update(identityInput).digest("hex").slice(0, 8);

  let pkg: { name?: string; version?: string } = {};
  try {
    const pkgRaw = await readFile(path.join(basePath, "package.json"), "utf8");
    pkg = JSON.parse(pkgRaw) as { name?: string; version?: string };
  } catch {
    pkg = {};
  }
  const date = new Date().toISOString().slice(0, 10);
  const fingerprint = `${pkg.name ?? ""}/${pkg.version ?? ""}/${date}/${identity}`;
  debug(`Fingerprint: ${fingerprint}`);

  const fields = {
    abstract,
    keywords,
    nomenclature,
    symbols_units,
    boundary_conditions,
    core_equations,
    assumptions_scope,
    dimensional_analysis,
    limitations_risks,
    preliminary_references,
    version,
    status,
    parent_id,
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
    "## Version",
    version,
    "",
    "## Status",
    status,
    "",
    "## Parent ID",
    parent_id,
    "",
    "## Abstract",
    abstract,
    "",
    "## Keywords",
    ...keywords.map((k) => `- ${k}`),
    "",
    "## Symbols & Units",
    ...symbols_units.map((s) => `- ${s}`),
    "",
    "## Nomenclature",
    ...nomenclature.map((n) => `- ${n}`),
    "",
    "## Assumptions & Scope",
    ...assumptions_scope.map((a) => `- ${a}`),
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

  const filePath = path.join(basePath, "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
