import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { evaluateQN21 } from "../q21";
import { loadCriteria, evaluateCriteria } from "../criteria";

interface ChartCriterion {
  id: number;
  name: string;
  score: number;
  gap: number;
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
  console.log("runJudge: qn21Results", qn21Results);
  console.log("runJudge: customResults", customResults);

  const combined: ChartCriterion[] = [];
  qn21Results.forEach((c, i) => {
    combined.push({
      id: i + 1,
      name: c.description,
      score: c.score,
      gap: Math.max(0, c.weight - c.score),
      type: c.type,
      covered: c.score === c.weight,
    });
  });
  customResults.forEach((c, i) => {
    combined.push({
      id: qn21Results.length + i + 1,
      name: c.description,
      score: c.score,
      gap: Math.max(0, c.weight - c.score),
      covered: c.score === c.weight,
    });
  });

  console.log("runJudge: combined criteria", combined);

  const total = [...qn21Results, ...customResults].reduce((s, c) => s + c.score, 0);
  const max = [...qn21Results, ...customResults].reduce((s, c) => s + c.weight, 0);
  const percentage = max === 0 ? 0 : (total / max) * 100;
  let classification: "accepted" | "needs_improvement" | "weak" = "weak";
  if (percentage >= 80) classification = "accepted";
  else if (percentage >= 60) classification = "needs_improvement";
  const gaps = combined
    .filter((c) => c.gap > 0)
    .map((c) => ({ id: c.id, name: c.name, gap: c.gap }));

  console.log(
    `runJudge: total=${total}, max=${max}, percentage=${percentage}, classification=${classification}`
  );
  console.log("runJudge: gaps", gaps);

  const result = {
    verdict: "approved",
    criteria: combined,
    score: { total, max, percentage },
    percentage,
    gaps,
    classification,
  };

  const filePath = path.join(process.cwd(), "paper", "judge.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(result, null, 2), "utf8");
  return result;
}
