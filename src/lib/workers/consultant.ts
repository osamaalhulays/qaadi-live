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
  const tableRows: string[] = [];
  const header = [
    "| Item | Priority | QN-21 Criterion |",
    "|------|----------|-----------------|",
  ];

  if (Array.isArray(judge.criteria)) {
    for (const c of judge.criteria) {
      const name = c?.name || `Criterion ${c?.id}`;
      const score = typeof c?.score === "number" ? c.score : 0;
      if (score >= 4) strengths.push(name);
      else gaps.push(name);
      let priority: "P0" | "P1" | "P2";
      if (score <= 3) priority = "P0";
      else if (score <= 6) priority = "P1";
      else priority = "P2";
      const link = `[QN-21-${c.id}](https://example.com/qn-21#${c.id})`;
      tableRows.push(`| ${name} | ${priority} | ${link} |`);
    }
  }

    const content = [
      "# Consultant Review",
      "",
      ...header,
      ...tableRows,
      "",
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
