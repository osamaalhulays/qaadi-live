export interface GateResult {
  ready_percent: number;
  missing: string[];
}

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

// Required fields for a complete secretary report
// These map directly to sections in templates/secretary.md
const REQUIRED_FIELDS = [
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
  const missing: string[] = [];

  if (!report || typeof report !== "object") {
    return { ready_percent: 0, missing: [...REQUIRED_FIELDS] };
  }

  for (const field of REQUIRED_FIELDS) {
    const value = report[field as keyof SecretaryReport];
    const isMissing =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    if (isMissing) missing.push(field);
  }

  const ready_percent = Math.round(
    ((REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length) * 100
  );

  return { ready_percent, missing };
}
