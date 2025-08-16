export interface QN21Criterion {
  /** Short identifier for the criterion. */
  code: string;
  /** Whether the criterion is internal or external to the organization. */
  type: "internal" | "external";
  /** Weight of the criterion when calculating the total score. */
  weight: number;
  /** Human readable description of the criterion. */
  description: string;
  /** Regular expression patterns that indicate the presence of the criterion in text. */
  patterns: RegExp[];
}

export const QN21_CRITERIA: QN21Criterion[] = [
  {
    code: "equations",
    type: "internal",
    weight: 8,
    description: "Equation accuracy",
    patterns: [/=/i, /equation/i, /boundary condition/i],
  },
  {
    code: "rigor",
    type: "internal",
    weight: 6,
    description: "Analytical rigor",
    patterns: [/analysis/i, /derive/i, /boundary condition/i],
  },
  {
    code: "dimensional",
    type: "internal",
    weight: 5,
    description: "Dimensional consistency",
    patterns: [/dimension/i, /units/i, /dimensional/i],
  },
  {
    code: "notation",
    type: "internal",
    weight: 3,
    description: "Clarity of symbols",
    patterns: [/symbol/i, /notation/i, /define/i],
  },
  {
    code: "experiment",
    type: "internal",
    weight: 6,
    description: "Experimental design",
    patterns: [/experiment/i, /setup/i, /procedure/i],
  },
  {
    code: "calibration",
    type: "internal",
    weight: 3,
    description: "Calibration",
    patterns: [/calibration/i, /calibrate/i, /standard/i],
  },
  {
    code: "measurement",
    type: "internal",
    weight: 4,
    description: "Measurement precision",
    patterns: [/precision/i, /accurate/i, /measurement/i],
  },
  {
    code: "data",
    type: "internal",
    weight: 4,
    description: "Data analysis",
    patterns: [/data analysis/i, /statistics/i, /statistical/i],
  },
  {
    code: "reproducibility",
    type: "internal",
    weight: 5,
    description: "Reproducibility",
    patterns: [/reproduce/i, /replicate/i, /repeat/i],
  },
  {
    code: "validation",
    type: "internal",
    weight: 4,
    description: "Validation",
    patterns: [/validate/i, /validation/i, /comparison/i],
  },
  {
    code: "conservation",
    type: "internal",
    weight: 3,
    description: "Conservation laws",
    patterns: [/conservation/i, /law/i, /conserve/i],
  },
  {
    code: "ethics",
    type: "external",
    weight: 8,
    description: "Ethics",
    patterns: [/ethics/i, /ethical/i, /consent/i],
  },
  {
    code: "safety",
    type: "external",
    weight: 5,
    description: "Safety compliance",
    patterns: [/safety/i, /safe/i, /compliance/i],
  },
  {
    code: "environmental",
    type: "external",
    weight: 5,
    description: "Environmental impact",
    patterns: [/environment/i, /environmental/i, /impact/i],
  },
  {
    code: "accessibility",
    type: "external",
    weight: 3,
    description: "Accessibility",
    patterns: [/accessibility/i, /accessible/i, /inclusive/i],
  },
  {
    code: "privacy",
    type: "external",
    weight: 3,
    description: "Data privacy",
    patterns: [/privacy/i, /confidential/i, /data protection/i],
  },
  {
    code: "interdisciplinary",
    type: "external",
    weight: 4,
    description: "Interdisciplinary integration",
    patterns: [/interdisciplinary/i, /cross-disciplinary/i, /integration/i],
  },
  {
    code: "communication",
    type: "external",
    weight: 6,
    description: "Public communication",
    patterns: [/public/i, /communication/i, /outreach/i],
  },
  {
    code: "engagement",
    type: "external",
    weight: 5,
    description: "Community engagement",
    patterns: [/community/i, /engagement/i, /stakeholder/i],
  },
  {
    code: "policy",
    type: "external",
    weight: 5,
    description: "Policy compliance",
    patterns: [/policy/i, /regulation/i, /compliance/i],
  },
  {
    code: "societal",
    type: "external",
    weight: 5,
    description: "Societal relevance",
    patterns: [/societal/i, /society/i, /relevance/i],
  },
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
 * The evaluation is pattern based. Each regular expression pattern represents
 * an indicator for the criterion. The score is proportional to the number of
 * matched indicators, yielding partial credit when only some patterns are
 * present. The `gap` field expresses the missing weight.
 */
export function evaluateQN21(text: string): QN21Result[] {
  return QN21_CRITERIA.map((c) => {
    const matches = c.patterns.reduce((count, p) => {
      const k = new RegExp(p.source, p.flags.replace(/[gy]/g, ""));
      return k.test(text) ? count + 1 : count;
    }, 0);
    const ratio = c.patterns.length === 0 ? 0 : matches / c.patterns.length;
    const score = c.weight * ratio;
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

