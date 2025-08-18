export interface FieldScore {
  score: 0 | 0.5 | 1;
  status: "missing" | "partial" | "complete";
}

export interface GateResult {
  ready_percent: number;
  missing: string[];
  fields: Record<string, FieldScore>;
}

export interface Issue {
  type?: string;
  note?: string;
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
  issues?: Issue[];
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
  "issues",
] as const;

type FieldKey = (typeof REQUIRED_FIELDS)[number];

function scoreString(value: unknown): FieldScore {
  if (typeof value !== "string" || !value.trim()) {
    return { score: 0, status: "missing" };
  }
  return value.trim().length < 20
    ? { score: 0.5, status: "partial" }
    : { score: 1, status: "complete" };
}

function scoreArray(value: unknown): FieldScore {
  if (!Array.isArray(value) || value.length === 0) {
    return { score: 0, status: "missing" };
  }
  return value.length === 1
    ? { score: 0.5, status: "partial" }
    : { score: 1, status: "complete" };
}

function scoreIssues(value: unknown): FieldScore {
  if (!Array.isArray(value) || value.length === 0) {
    return { score: 0, status: "missing" };
  }
  const valid = value.every(
    (v) =>
      v &&
      typeof v.type === "string" &&
      v.type.trim() &&
      typeof v.note === "string" &&
      v.note.trim()
  );
  return valid
    ? { score: 1, status: "complete" }
    : { score: 0.5, status: "partial" };
}

// Check mandatory fields inside secretary report and return missing ones
export function runGates(data: {
  secretary?: { audit?: SecretaryReport };
}): GateResult {
  const report = data.secretary?.audit;
  const missing: string[] = [];
  const fields: Record<FieldKey, FieldScore> = Object.create(null);

  if (!report || typeof report !== "object") {
    for (const f of REQUIRED_FIELDS) {
      fields[f] = { score: 0, status: "missing" };
    }
    return { ready_percent: 0, missing: [...REQUIRED_FIELDS], fields };
  }

  for (const field of REQUIRED_FIELDS) {
    const value = report[field as keyof SecretaryReport];
    let result: FieldScore;
    if (field === "issues") result = scoreIssues(value);
    else if (
      field === "summary" ||
      field === "post_analysis" ||
      field === "testability"
    )
      result = scoreString(value);
    else result = scoreArray(value);
    fields[field] = result;
    if (result.status === "missing") missing.push(field);
  }

  const totalScore = Object.values(fields).reduce(
    (sum, f) => sum + f.score,
    0
  );
  const ready_percent = Math.round(
    (totalScore / REQUIRED_FIELDS.length) * 100
  );

  return { ready_percent, missing, fields };
}
