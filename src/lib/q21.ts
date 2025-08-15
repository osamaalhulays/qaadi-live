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
  { code: "Σ", type: "internal", weight: 8, description: "Equation accuracy" },
  { code: "Δ", type: "internal", weight: 6, description: "Analytical rigor" },
  { code: "∇", type: "internal", weight: 5, description: "Dimensional consistency" },
  { code: "Λ", type: "internal", weight: 3, description: "Clarity of symbols" },
  { code: "Τ", type: "internal", weight: 6, description: "Experimental design" },
  { code: "Κ", type: "internal", weight: 3, description: "Calibration" },
  { code: "Μ", type: "internal", weight: 4, description: "Measurement precision" },
  { code: "Χ", type: "internal", weight: 4, description: "Data analysis" },
  { code: "Ρ", type: "internal", weight: 5, description: "Reproducibility" },
  { code: "Ν", type: "internal", weight: 4, description: "Validation" },
  { code: "Ξ", type: "internal", weight: 3, description: "Conservation laws" },
  { code: "Θ", type: "external", weight: 8, description: "Ethics" },
  { code: "Φ", type: "external", weight: 5, description: "Safety compliance" },
  { code: "Ψ", type: "external", weight: 5, description: "Environmental impact" },
  { code: "Ω", type: "external", weight: 3, description: "Accessibility" },
  { code: "Π", type: "external", weight: 3, description: "Data privacy" },
  { code: "Γ", type: "external", weight: 4, description: "Interdisciplinary integration" },
  { code: "Η", type: "external", weight: 6, description: "Public communication" },
  { code: "Β", type: "external", weight: 5, description: "Community engagement" },
  { code: "Υ", type: "external", weight: 5, description: "Policy compliance" },
  { code: "Ζ", type: "external", weight: 5, description: "Societal relevance" },
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
