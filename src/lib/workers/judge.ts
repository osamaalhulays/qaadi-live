import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { evaluateQN21 } from "../q21";
import { loadCriteria, evaluateCriteria } from "../criteria";

interface ChartCriterion {
  id: number;
  name: string;
  score: number;
  type?: "internal" | "external";
  covered?: boolean;
}

export async function runJudge(text?: string) {
  let content = text;
  if (content === undefined) {
    try {
      content = await readFile(path.join(process.cwd(), "paper", "bundle.md"), "utf8");
    } catch {
      try {
        content = await readFile(path.join(process.cwd(), "paper", "draft.tex"), "utf8");
      } catch {
        content = "";
      }
    }
  }

  const qn21Results = evaluateQN21(content);
  const custom = await loadCriteria();
  const customResults = evaluateCriteria(content, custom);

  const combined: ChartCriterion[] = [];
  qn21Results.forEach((c, i) => {
    combined.push({
      id: i + 1,
      name: c.description,
      score: c.score,
      type: c.type,
      covered: c.score === c.weight,
    });
  });
  customResults.forEach((c, i) => {
    combined.push({
      id: qn21Results.length + i + 1,
      name: c.description,
      score: c.score,
      covered: c.score === c.weight,
    });
  });

  const total = [...qn21Results, ...customResults].reduce((s, c) => s + c.score, 0);
  const max = [...qn21Results, ...customResults].reduce((s, c) => s + c.weight, 0);
  const percentage = max === 0 ? 0 : (total / max) * 100;
  let classification: "accepted" | "needs_improvement" | "weak" = "weak";
  if (percentage >= 80) classification = "accepted";
  else if (percentage >= 60) classification = "needs_improvement";

  const result = {
    verdict: "approved",
    criteria: combined,
    custom: customResults,
    percentage,
    classification,
  };

  const filePath = path.join(process.cwd(), "paper", "judge.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(result, null, 2), "utf8");
  return result;
}
