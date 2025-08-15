import { JudgeReport, JudgeCriterion } from "./schema/report";
import type { UserCriterion } from "./userCriteria";

/**
 * Merge base judge report with active user criteria.
 */
export function runJudge(base: JudgeReport, userCriteria: UserCriterion[]): JudgeReport {
  const extra: JudgeCriterion[] = userCriteria.map((c, idx) => ({
    id: base.criteria.length + idx + 1,
    name: c.name,
    score: 0,
    notes: "user criterion"
  }));
  return {
    ...base,
    criteria: [...base.criteria, ...extra],
    score_total: base.score_total + extra.reduce((s, c) => s + c.score, 0)
  };
}
