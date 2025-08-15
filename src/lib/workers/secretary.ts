import { mergeQ21Fields } from "../q21";

export interface SecretaryInput {
  text: string;
  units?: string;
  figure?: string;
}

export interface SecretaryResult {
  readyPercent: number;
  issues: string[];
  dimensional?: string;
  diagram?: string;
}

/**
 * Runs the secretary stage. It enriches the input using Q21 maps
 * and performs a very lightweight audit on the submission.
 */
export function runSecretary(input: SecretaryInput): SecretaryResult {
  const merged = mergeQ21Fields({ units: input.units, figure: input.figure });
  const issues: string[] = [];
  if (!merged.dimensional) issues.push("missing_units");
  if (!merged.diagram) issues.push("missing_figure");
  const readyPercent = 100 - issues.length * 50;
  return { readyPercent, issues, ...merged };
}

