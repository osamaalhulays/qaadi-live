export interface QN21Criterion {
  /** Short identifier for the criterion. */
  code: string;
  /** Whether the criterion is internal or external to the organization. */
  type: "internal" | "external";
  /** Weight of the criterion when calculating the total score. */
  weight: number;
  /** Human readable description of the criterion. */
  description: string;
}

export const QN21_CRITERIA: QN21Criterion[] = [
  { code: "I1", type: "internal", weight: 1, description: "Clear objectives" },
  { code: "I2", type: "internal", weight: 1, description: "Logical structure" },
  { code: "I3", type: "internal", weight: 1, description: "Evidence of planning" },
  { code: "I4", type: "internal", weight: 1, description: "Resource allocation" },
  { code: "I5", type: "internal", weight: 1, description: "Defined responsibilities" },
  { code: "I6", type: "internal", weight: 1, description: "Monitoring mechanisms" },
  { code: "I7", type: "internal", weight: 1, description: "Risk assessment" },
  { code: "I8", type: "internal", weight: 1, description: "Stakeholder mapping" },
  { code: "I9", type: "internal", weight: 1, description: "Training program" },
  { code: "I10", type: "internal", weight: 1, description: "Documentation" },
  { code: "E1", type: "external", weight: 1, description: "Public transparency" },
  { code: "E2", type: "external", weight: 1, description: "Accessibility" },
  { code: "E3", type: "external", weight: 1, description: "Community feedback" },
  { code: "E4", type: "external", weight: 1, description: "Regulatory compliance" },
  { code: "E5", type: "external", weight: 1, description: "Performance reporting" },
  { code: "E6", type: "external", weight: 1, description: "Environmental impact" },
  { code: "E7", type: "external", weight: 1, description: "Data privacy" },
  { code: "E8", type: "external", weight: 1, description: "User satisfaction" },
  { code: "E9", type: "external", weight: 1, description: "Interoperability" },
  { code: "E10", type: "external", weight: 1, description: "Security posture" },
  { code: "E11", type: "external", weight: 1, description: "Community engagement" },
];

export interface QN21Result extends QN21Criterion {
  /** Score obtained for the criterion. */
  score: number;
  /** Remaining points to reach the full weight of the criterion. */
  gap: number;
}

/**
 * Evaluate text against the QN21 criteria.
 *
 * The evaluation is keyword based: if a criterion code appears within the
 * provided text (case insensitive) the full weight is awarded. Otherwise the
 * score is zero. The `gap` field expresses the missing weight.
 */
export function evaluateQN21(text: string): QN21Result[] {
  const lower = text.toLowerCase();
  return QN21_CRITERIA.map((c) => {
    const score = lower.includes(c.code.toLowerCase()) ? c.weight : 0;
    return { ...c, score, gap: c.weight - score };
  });
}

export interface QN21Summary {
  /** Total points obtained across all criteria. */
  total: number;
  /** Maximum obtainable points. */
  max: number;
  /** Percentage of points obtained (0-100). */
  percentage: number;
  /** Classification based on the percentage. */
  classification: "accepted" | "needs_improvement" | "weak";
}

/**
 * Summarize an array of QN21 results into total score, percentage, and
 * classification. The classification thresholds are:
 * - accepted: ≥80%
 * - needs_improvement: 60–79%
 * - weak: <60%
 */
export function summarizeQN21(results: QN21Result[]): QN21Summary {
  const total = results.reduce((sum, r) => sum + r.score, 0);
  const max = results.reduce((sum, r) => sum + r.weight, 0);
  const percentage = max === 0 ? 0 : (total / max) * 100;
  let classification: QN21Summary["classification"] = "weak";
  if (percentage >= 80) classification = "accepted";
  else if (percentage >= 60) classification = "needs_improvement";
  return { total, max, percentage, classification };
}

