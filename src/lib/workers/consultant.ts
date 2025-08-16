import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

/**
 * Analyze the judge results and produce a concise report highlighting
 * strengths and gaps. The output is written to `paper/notes.txt` in a
 * simple Markdown format so it can be consumed by later stages.
 */
export async function runConsultant() {
  const judgePath = path.join(process.cwd(), "paper", "judge.json");
  let judge: any = {};
  try {
    const raw = await readFile(judgePath, "utf8");
    judge = JSON.parse(raw);
  } catch {
    // If the judge file is missing or malformed we continue with empty data.
  }

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (Array.isArray(judge.criteria)) {
    for (const c of judge.criteria) {
      const name = c?.name || `Criterion ${c?.id}`;
      if (typeof c?.score === "number" && c.score >= 4) strengths.push(name);
      else gaps.push(name);
    }
  }

  const content = [
    "# Consultant Review",
    "## Strengths",
    strengths.length ? strengths.map((s) => `- ${s}`).join("\n") : "- None identified",
    "## Gaps",
    gaps.length ? gaps.map((g) => `- ${g}`).join("\n") : "- None identified",
  ].join("\n");

  const filePath = path.join(process.cwd(), "paper", "notes.txt");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
