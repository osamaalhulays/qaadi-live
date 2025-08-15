import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { evaluateQN21 } from "./q21";
import { getActiveCriteria, UserCriterion } from "./userCriteria";

export interface JudgeCriterionOutput {
  id: number;
  name: string;
  score: number;
  type: "internal" | "external";
  covered: boolean;
}

export interface JudgeReportOutput {
  score_total: number;
  criteria: JudgeCriterionOutput[];
  user_criteria: JudgeCriterionOutput[];
}

/**
 * Run QN-21 evaluation and any active user criteria on the supplied text.
 * The combined report is saved to paper/judge.json and returned.
 */
export async function runJudge(
  text: string,
  userCriteria: UserCriterion[] = [],
  outFile = path.join(process.cwd(), "paper", "judge.json")
): Promise<JudgeReportOutput> {
  const qn21 = evaluateQN21(text);
  const activeUser = getActiveCriteria(userCriteria);

  const qn21Mapped: JudgeCriterionOutput[] = qn21.map((c, idx) => ({
    id: idx + 1,
    name: c.code,
    type: c.type,
    score: c.score,
    covered: c.score >= c.weight,
  }));

  const userMapped: JudgeCriterionOutput[] = activeUser.map((c, idx) => {
    const covered = text.toLowerCase().includes(c.name.toLowerCase());
    return {
      id: idx + 1,
      name: c.name,
      type: c.type,
      score: covered ? 1 : 0,
      covered,
    };
  });

  const score_total = qn21Mapped.reduce((sum, c) => sum + c.score, 0);

  const report: JudgeReportOutput = {
    score_total,
    criteria: qn21Mapped,
    user_criteria: userMapped,
  };

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(report, null, 2));

  return report;
}
