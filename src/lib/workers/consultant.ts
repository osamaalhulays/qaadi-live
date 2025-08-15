import { SecretaryResult } from "./secretary";
import { JudgeReport } from "./judge";

/**
 * Consultant merges the secretary's issues and judge's report into an action plan.
 */
export function runConsultant(audit: SecretaryResult, report: JudgeReport): string {
  const lines: string[] = [];
  if (audit.issues.length) {
    lines.push("Resolve issues:");
    for (const i of audit.issues) lines.push(`- ${i}`);
  } else {
    lines.push("No outstanding issues");
  }
  lines.push(`Current score: ${report.scoreTotal}`);
  return lines.join("\n");
}

