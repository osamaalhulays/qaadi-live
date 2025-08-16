export interface GateResult {
  ready_percent: number;
  missing: string[];
}

// Required fields for a complete secretary report
// These map directly to sections in templates/secretary.md
// Only when all of these fields are present should the workflow
// proceed to the judge step.
const REQUIRED_FIELDS = [
  "summary",
  "equations",
  "boundary",
  "references",
];

// Check mandatory fields inside secretary report and return missing ones
export function runGates(data: any): GateResult {
  const report = data?.secretary?.audit ?? data;
  const missing: string[] = [];

  if (!report || typeof report !== "object") {
    return { ready_percent: 0, missing: [...REQUIRED_FIELDS] };
  }

  for (const field of REQUIRED_FIELDS) {
    const value = (report as any)[field];
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
