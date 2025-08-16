export interface QN21Criterion {
  /** Short identifier for the criterion. */
  code: string;
  /** Whether the criterion is internal or external to the organization. */
  type: "internal" | "external";
  /** Weight of the criterion when calculating the total score. */
  weight: number;
  /** Human readable description of the criterion. */
  description: string;
  /** Keywords that indicate the presence of the criterion in text. */
  keywords: string[];
}

export const QN21_CRITERIA: QN21Criterion[] = [
  {
    code: "equations",
    type: "internal",
    weight: 8,
    description: "Equation accuracy",
    keywords: ["=", "equation", "boundary condition"],
  },
  {
    code: "rigor",
    type: "internal",
    weight: 6,
    description: "Analytical rigor",
    keywords: ["analysis", "derive", "boundary condition"],
  },
  {
    code: "dimensional",
    type: "internal",
    weight: 5,
    description: "Dimensional consistency",
    keywords: ["dimension", "units", "dimensional"],
  },
  {
    code: "notation",
    type: "internal",
    weight: 3,
    description: "Clarity of symbols",
    keywords: ["symbol", "notation", "define"],
  },
  {
    code: "experiment",
    type: "internal",
    weight: 6,
    description: "Experimental design",
    keywords: ["experiment", "setup", "procedure"],
  },
  {
    code: "calibration",
    type: "internal",
    weight: 3,
    description: "Calibration",
    keywords: ["calibration", "calibrate", "standard"],
  },
  {
    code: "measurement",
    type: "internal",
    weight: 4,
    description: "Measurement precision",
    keywords: ["precision", "accurate", "measurement"],
  },
  {
    code: "data",
    type: "internal",
    weight: 4,
    description: "Data analysis",
    keywords: ["data analysis", "statistics", "statistical"],
  },
  {
    code: "reproducibility",
    type: "internal",
    weight: 5,
    description: "Reproducibility",
    keywords: ["reproduce", "replicate", "repeat"],
  },
  {
    code: "validation",
    type: "internal",
    weight: 4,
    description: "Validation",
    keywords: ["validate", "validation", "comparison"],
  },
  {
    code: "conservation",
    type: "internal",
    weight: 3,
    description: "Conservation laws",
    keywords: ["conservation", "law", "conserve"],
  },
  {
    code: "ethics",
    type: "external",
    weight: 8,
    description: "Ethics",
    keywords: ["ethics", "ethical", "consent"],
  },
  {
    code: "safety",
    type: "external",
    weight: 5,
    description: "Safety compliance",
    keywords: ["safety", "safe", "compliance"],
  },
  {
    code: "environmental",
    type: "external",
    weight: 5,
    description: "Environmental impact",
    keywords: ["environment", "environmental", "impact"],
  },
  {
    code: "accessibility",
    type: "external",
    weight: 3,
    description: "Accessibility",
    keywords: ["accessibility", "accessible", "inclusive"],
  },
  {
    code: "privacy",
    type: "external",
    weight: 3,
    description: "Data privacy",
    keywords: ["privacy", "confidential", "data protection"],
  },
  {
    code: "interdisciplinary",
    type: "external",
    weight: 4,
    description: "Interdisciplinary integration",
    keywords: ["interdisciplinary", "cross-disciplinary", "integration"],
  },
  {
    code: "communication",
    type: "external",
    weight: 6,
    description: "Public communication",
    keywords: ["public", "communication", "outreach"],
  },
  {
    code: "engagement",
    type: "external",
    weight: 5,
    description: "Community engagement",
    keywords: ["community", "engagement", "stakeholder"],
  },
  {
    code: "policy",
    type: "external",
    weight: 5,
    description: "Policy compliance",
    keywords: ["policy", "regulation", "compliance"],
  },
  {
    code: "societal",
    type: "external",
    weight: 5,
    description: "Societal relevance",
    keywords: ["societal", "society", "relevance"],
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
 * The evaluation is keyword based: if any keyword for a criterion appears
 * within the provided text (case insensitive) the full weight is awarded.
 * Otherwise the score is zero. The `gap` field expresses the missing weight.
 */
export function evaluateQN21(text: string): QN21Result[] {
  const lower = text.toLowerCase();
  return QN21_CRITERIA.map((c) => {
    const score = c.keywords.some((k) => lower.includes(k.toLowerCase()))
      ? c.weight
      : 0;
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

