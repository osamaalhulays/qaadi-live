import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { evaluateQN21, summarizeQN21 } from "../q21";
import { loadCriteria, evaluateCriteria } from "../criteria";

function summarize(results: { score: number; weight: number }[]) {
  const total = results.reduce((s, r) => s + r.score, 0);
  const max = results.reduce((s, r) => s + r.weight, 0);
  const percentage = max === 0 ? 0 : (total / max) * 100;
  let classification: "accepted" | "needs_improvement" | "weak" = "weak";
  if (percentage >= 80) classification = "accepted";
  else if (percentage >= 60) classification = "needs_improvement";
  return { total, max, percentage, classification };
}

export async function runJudge() {
  let text = "";
  const draftPath = path.join(process.cwd(), "paper", "draft.md");
  try {
    text = await readFile(draftPath, "utf8");
  } catch {
    /* ignore missing draft */
  }

  const qn21Results = evaluateQN21(text);
  const qn21Summary = summarizeQN21(qn21Results);

  const criteria = await loadCriteria();
  const criteriaResults = evaluateCriteria(text, criteria);
  const criteriaSummary = summarize(criteriaResults);

  const result = {
    qn21: { results: qn21Results, summary: qn21Summary },
    criteria: { results: criteriaResults, summary: criteriaSummary }
  };

  const filePath = path.join(process.cwd(), "paper", "judge.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(result, null, 2), "utf8");
  return result;
}
