import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

export interface SecretaryData {
  summary: string;
  conditions: string;
  equations: string[];
}

/**
 * Collects high level project information and writes a markdown file
 * describing the gathered requirements. When no data is supplied the
 * function falls back to interactive prompts on the command line.
 */
export async function runSecretary(data?: SecretaryData) {
  let summary: string;
  let conditions: string;
  let equations: string[];

  if (!data) {
    const rl = createInterface({ input, output });
    try {
      summary = await rl.question("Summary: ");
      conditions = await rl.question("Conditions: ");
      const eqInput = await rl.question("Equations (comma separated): ");
      equations = eqInput
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
    } finally {
      rl.close();
    }
  } else {
    ({ summary, conditions, equations } = data);
  }

  const content = [
    "# Secretary",
    "",
    "## Summary",
    summary,
    "",
    "## Conditions",
    conditions,
    "",
    "## Equations",
    ...equations.map((e) => `- ${e}`),
    "",
  ].join("\n");

  const filePath = path.join(process.cwd(), "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
