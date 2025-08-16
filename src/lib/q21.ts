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

interface QN21Spec {
  code: string;
  type: "internal" | "external";
  weight: number;
  description: string;
}

const DOCUMENTED_QN21_CRITERIA: QN21Spec[] = [
  { code: "equations", type: "internal", weight: 5, description: "Equation accuracy" },
  { code: "rigor", type: "internal", weight: 5, description: "Derivations and proofs" },
  { code: "dimensional", type: "internal", weight: 5, description: "Dimensional analysis" },
  { code: "symmetry", type: "internal", weight: 4, description: "Symmetry and Noether" },
  { code: "conservation", type: "internal", weight: 4, description: "Conservation laws" },
  { code: "boundary", type: "internal", weight: 4, description: "Boundary conditions" },
  { code: "consistency", type: "internal", weight: 5, description: "Internal and external consistency" },
  { code: "scope", type: "internal", weight: 4, description: "Scope and limitations" },
  { code: "novelty", type: "internal", weight: 4, description: "Novel contribution" },
  { code: "predictions", type: "internal", weight: 6, description: "Testable predictions" },
  { code: "falsifiability", type: "internal", weight: 6, description: "Falsifiability" },
  { code: "methodology", type: "internal", weight: 4, description: "Methodology" },
  { code: "definitions", type: "internal", weight: 3, description: "Precise definitions" },
  { code: "terminology", type: "internal", weight: 3, description: "Consistent terminology" },
  { code: "clarity", type: "internal", weight: 3, description: "Clarity of presentation" },
  { code: "diagrams", type: "internal", weight: 2, description: "Figures and tables" },
  { code: "limitations", type: "internal", weight: 3, description: "Limitations and risks" },
  { code: "expAlignment", type: "external", weight: 6, description: "Experimental alignment" },
  { code: "reproducibility", type: "external", weight: 5, description: "Reproducibility" },
  { code: "references", type: "external", weight: 3, description: "References" },
  { code: "ethics", type: "external", weight: 2, description: "Ethics" },
];
// Explicit pattern map allowing multiple indicators per criterion. The test
// suite only relies on a subset of these, but the fallback keeps previous
// behaviour for untouched criteria.
const PATTERN_MAP: Record<string, RegExp[]> = {
  equations: [/\bequation\b/i, /\bequations\b/i, /\bequations?\b/i],
  rigor: [/\brigour\b/i, /\brigor\b/i, /\brigor(?:ous)?\b/i],
  ethics: [/\bethic\b/i, /\bethics\b/i, /\bethical\b/i],
  reproducibility: [/\breproducibility\b/i, /\breproducible\b/i, /\breproduce\b/i],
  predictions: [/\bprediction\b/i, /\bpredictions\b/i, /\bpredict\b/i],
  diagrams: [/\bdiagram\b/i, /\bdiagrams\b/i, /\btable\b/i],
};

export const QN21_CRITERIA: QN21Criterion[] = DOCUMENTED_QN21_CRITERIA.map((c) => ({
  ...c,
  patterns: PATTERN_MAP[c.code] ?? [new RegExp(c.code, "i")],
}));

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
  const sentences = text.split(/[.!?]/).map((s) => s.trim());
  return QN21_CRITERIA.map((c) => {
    const matches = c.patterns.reduce((count, p) => {
      const found = sentences.some((s) => {
        // Reset lastIndex so global or sticky patterns test from the start
        // of each sentence.
        p.lastIndex = 0;
        return p.test(s) && !/\b(no|not|without)\b/i.test(s);
      });
      return found ? count + 1 : count;
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

