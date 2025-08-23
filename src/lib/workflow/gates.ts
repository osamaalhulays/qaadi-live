export interface SecretaryReport {
  abstract?: string;
  keywords?: string[];
  nomenclature?: string[];
  symbols_units?: string[];
  core_equations?: string[];
  boundary_conditions?: string[];
  assumptions_scope?: string[];
  dimensional_analysis?: string;
  limitations_risks?: string;
  preliminary_references?: string[];
  version?: string;
  status?: string;
  parent_id?: string;
  overflow_log?: string[];
  identity?: string;
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
  "abstract",
  "keywords",
  "nomenclature",
  "symbols_units",
  "core_equations",
  "boundary_conditions",
  "assumptions_scope",
  "dimensional_analysis",
  "limitations_risks",
  "preliminary_references",
  "version",
  "status",
  "parent_id",
  "overflow_log",
  "identity",
];

// Check mandatory fields inside secretary report and return missing ones
export function runGates(data: { secretary?: { audit?: SecretaryReport } }): GateResult {
  const report = data.secretary?.audit;
  const missing: FieldKey[] = [];
  const fields: Record<FieldKey, FieldScore> = {
    abstract: 0,
    keywords: 0,
    nomenclature: 0,
    symbols_units: 0,
    core_equations: 0,
    boundary_conditions: 0,
    assumptions_scope: 0,
    dimensional_analysis: 0,
    limitations_risks: 0,
    preliminary_references: 0,
    version: 0,
    status: 0,
    parent_id: 0,
    overflow_log: 0,
    identity: 0,
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
      (Array.isArray(value) && value.length === 0 && field !== "overflow_log");
    fields[field] = isMissing ? 0 : 1;
    if (isMissing) missing.push(field);
  }

  const ready_percent = Math.round(
    (Object.values(fields).reduce((a, b) => a + b, 0) / REQUIRED_FIELDS.length) *
      100
  );

  return { ready_percent, missing, fields };
}
