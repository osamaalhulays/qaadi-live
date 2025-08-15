import { SecretaryResult } from "./secretary";

export interface JudgeReport {
  scoreTotal: number;
  notes: string[];
}

/**
 * Judge evaluates the secretary's audit and assigns a score.
 */
export function runJudge(audit: SecretaryResult): JudgeReport {
  const penalties = audit.issues.length * 10;
  const scoreTotal = Math.max(0, 100 - penalties);
  const notes = audit.issues.map((i) => `Issue detected: ${i}`);
  if (!notes.length) notes.push("All clear");
  return { scoreTotal, notes };
}

