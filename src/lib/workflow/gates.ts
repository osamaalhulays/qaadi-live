export interface SecretaryReport {
  summary?: string;
  keywords?: string[];
  tokens?: string[];
  boundary?: string[];
  post_analysis?: string;
  risks?: string[];
  predictions?: string[];
  testability?: string;
}

export type FieldScore = 0 | 1;
export type FieldKey = keyof SecretaryReport;

export interface GateResult {
  ready_percent: number;
  missing: FieldKey[];
  fields: Record<FieldKey, FieldScore>;
}

// Required fields for a complete secretary report
// These map directly to sections in templates/secretary.md
const REQUIRED_FIELDS: FieldKey[] = [
  "summary",
  "keywords",
  "tokens",
  "boundary",
  "post_analysis",
  "risks",
  "predictions",
  "testability",
];

// Check mandatory fields inside secretary report and return missing ones
export function runGates(data: { secretary?: { audit?: SecretaryReport } }): GateResult {
  const report = data.secretary?.audit;
  const missing: FieldKey[] = [];
  const fields: Record<FieldKey, FieldScore> = {
    summary: 0,
    keywords: 0,
    tokens: 0,
    boundary: 0,
    post_analysis: 0,
    risks: 0,
    predictions: 0,
    testability: 0,
  };

  if (!report || typeof report !== "object") {
    return { ready_percent: 0, missing: [...REQUIRED_FIELDS], fields };
  }

  for (const field of REQUIRED_FIELDS) {
    const value = report[field];
    const isMissing =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    fields[field] = isMissing ? 0 : 1;
    if (isMissing) missing.push(field);
  }

  const ready_percent = Math.round(
    (Object.values(fields).reduce((a, b) => a + b, 0) / REQUIRED_FIELDS.length) *
      100
  );

  return { ready_percent, missing, fields };
}
