export interface QN21Criterion {
  id: number;
  score: number;
}

export interface QN21Report {
  score_total: number;
  criteria: QN21Criterion[];
}

export interface QN21GateResult {
  allowed: boolean;
  percentage: number;
  failed: number[];
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
    !Array.isArray(report.criteria)
  ) {
    return { allowed: false, percentage: 0, failed: [...critical] };
  }
  const max = report.criteria.length * 10;
  const percentage = max > 0 ? (report.score_total / max) * 100 : 0;
  const failed = report.criteria
    .filter((c) => critical.includes(c.id) && c.score < criticalThreshold)
    .map((c) => c.id);
  const allowed = failed.length === 0 && percentage >= minTotal;
  return { allowed, percentage, failed };
}
