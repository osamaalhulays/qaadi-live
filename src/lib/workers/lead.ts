import { SecretaryResult } from "./secretary";
import { JudgeReport } from "./judge";

export interface LeadSummary {
  audit: SecretaryResult;
  report: JudgeReport;
  plan: string;
  summary: string;
}

/**
 * Lead produces a combined summary of all stages.
 */
export function runLead(audit: SecretaryResult, report: JudgeReport, plan: string): LeadSummary {
  const summary = `Ready: ${audit.readyPercent}%, Score: ${report.scoreTotal}`;
  return { audit, report, plan, summary };
}

