export interface QN21Criterion {
  id: number;
  score: number;
  weight: number;
  name?: string;
}

export interface QN21Report {
  score_total: number;
  weight_total: number;
  criteria: QN21Criterion[];
}

export interface QN21GateResult {
  allowed: boolean;
  percentage: number;
  failed: Array<number | string>;
}

/**
 * Validate QN-21 judge results.
 * Blocks downstream steps if total percentage is below minTotal
 * or any critical criteria fall below the threshold.
 */
export function gateQn21(
  report: QN21Report,
  critical: number[] = [],
  minTotal = 60,
  criticalThreshold = 5
): QN21GateResult {
  if (
    !report ||
    typeof report.score_total !== "number" ||
    typeof report.weight_total !== "number" ||
    !Array.isArray(report.criteria)
  ) {
    return { allowed: false, percentage: 0, failed: [...critical] };
  }
  const max = report.criteria.reduce(
    (sum, c) => sum + (typeof c.weight === "number" ? c.weight : 0),
    0
  );
  const percentage = max > 0 ? (report.score_total / max) * 100 : 0;
  const failed: Array<number | string> = report.criteria
    .filter((c) => critical.includes(c.id) && c.score < criticalThreshold)
    .map((c) => c.id);

  const mandatory = ["equations", "definitions", "dimensional"];
  for (const name of mandatory) {
    const crit = report.criteria.find((c) => c.name === name);
    if (!crit || crit.score < 1) {
      failed.push(name);
    }
  }

  const allowed = failed.length === 0 && percentage >= minTotal;
  return { allowed, percentage, failed };
}
