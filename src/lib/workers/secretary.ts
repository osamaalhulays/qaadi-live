import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createHash } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../");

export interface SecretaryData {
  abstract: string;
  keywords: string[];
  nomenclature: { symbol: string; definition: string }[];
  core_equations: string[];
  boundary_conditions: string[];
  dimensional_analysis: string;
  limitations_risks: string[];
  references: string[];
  overflow?: string[];
}

/**
 * Collects high level project information and writes a markdown file
 * describing the gathered requirements. When no data is supplied the
 * function falls back to interactive prompts on the command line.
 */
export async function runSecretary(data?: Partial<SecretaryData>) {
  let abstract: string;
  let keywords: string[];
  let nomenclature: { symbol: string; definition: string }[];
  let core_equations: string[];
  let boundary_conditions: string[];
  let dimensional_analysis: string;
  let limitations_risks: string[];
  let references: string[];
  let overflow: string[];

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
        "Nomenclature (symbol=definition, comma separated): "
      );
      nomenclature = nomInput
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => {
          const [symbol, definition] = n.split("=").map((t) => t.trim());
          return { symbol, definition };
        });
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
      const limInput = await rl.question(
        "Limitations and risks (comma separated): "
      );
      limitations_risks = limInput
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
      const overflowInput = await rl.question(
        "Overflow log (comma separated, optional): "
      );
      overflow = overflowInput
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
      core_equations = [],
      boundary_conditions = [],
      dimensional_analysis = "",
      limitations_risks = [],
      references = [],
      overflow = [],
    } = data);
  }

  const identityInput = [
    abstract,
    keywords.join(","),
    nomenclature
      .map((n) => `${n.symbol}=${n.definition}`)
      .join(","),
    core_equations.join(","),
    boundary_conditions.join(","),
    dimensional_analysis,
    limitations_risks.join(","),
    references.join(","),
    overflow.join(","),
  ].join("|");
  const identity = createHash("sha256").update(identityInput).digest("hex").slice(0, 8);

  const pkgRaw = await readFile(path.join(projectRoot, "package.json"), "utf8");
  const pkg = JSON.parse(pkgRaw) as { name?: string; version?: string };
  const date = new Date().toISOString().slice(0, 10);
  const fingerprint = `${pkg.name ?? ""}/${pkg.version ?? ""}/${date}/${identity}`;
  console.log("Fingerprint:", fingerprint);

  const fields = {
    abstract,
    keywords,
    nomenclature,
    core_equations,
    boundary_conditions,
    dimensional_analysis,
    limitations_risks,
    references,
    overflow,
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
    "## Abstract",
    abstract,
    "",
    "## Keywords",
    ...keywords.map((k) => `- ${k}`),
    "",
    "## Nomenclature",
    "| Symbol | Definition |",
    "|--------|------------|",
    ...nomenclature.map((n) => `| ${n.symbol} | ${n.definition} |`),
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
    ...limitations_risks.map((r) => `- ${r}`),
    "",
    "## References",
    ...references.map((r) => `- ${r}`),
    "",
    "## Overflow Log",
    ...(overflow.length > 0 ? overflow.map((o) => `- ${o}`) : ["- none"]),
    "",
  ].join("\n");

  const filePath = path.join(projectRoot, "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
