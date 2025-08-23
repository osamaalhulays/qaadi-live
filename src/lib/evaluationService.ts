import { evaluateQN21 } from "./q21";
import { loadCriteria, evaluateCriteria } from "./criteria";

interface ChartCriterion {
  id: number;
  name: string;
  score: number;
  gap: number;
  type?: "internal" | "external" | "advisory";
  covered?: boolean;
}

export async function evaluateText(text: string) {
  const qn21Results = evaluateQN21(text);
  const custom = await loadCriteria();
  const customResults = evaluateCriteria(text, custom);

  const qn21Criteria: ChartCriterion[] = qn21Results.map((c, i) => ({
    id: i + 1,
    name: c.description || c.code,
    score: c.score,
    gap: Math.max(0, c.weight - c.score),
    type: c.type,
    covered: c.score === c.weight,
  }));
  const customCriteria: ChartCriterion[] = customResults.map((c, i) => ({
    id: qn21Results.length + i + 1,
    name: c.description || c.id,
    score: c.score,
    gap: Math.max(0, c.weight - c.score),
    type: c.category,
    covered: c.score === c.weight,
  }));
  const combined: ChartCriterion[] = [...qn21Criteria, ...customCriteria];

  const total = [...qn21Results, ...customResults].reduce((s, c) => s + c.score, 0);
  const max = [...qn21Results, ...customResults].reduce((s, c) => s + c.weight, 0);
  const percentage = max === 0 ? 0 : (total / max) * 100;
  let classification: "accepted" | "needs_improvement" | "weak" = "weak";
  if (percentage >= 80) classification = "accepted";
  else if (percentage >= 60) classification = "needs_improvement";
  const gaps = combined
    .filter((c) => c.gap > 0)
    .map((c) => ({ id: c.id, name: c.name, gap: c.gap }));

  const verdictMap: Record<
    "accepted" | "needs_improvement" | "weak",
    "approved" | "pending" | "rejected"
  > = {
    accepted: "approved",
    needs_improvement: "pending",
    weak: "rejected",
  };
  const verdict = verdictMap[classification];

  return {
    verdict,
    criteria: combined,
    score: { total, max, percentage },
    percentage,
    gaps,
    classification,
  };
}
