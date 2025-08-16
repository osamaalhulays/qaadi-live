export interface GateResult {
  ready_percent: number;
  missing: string[];
}

// Fields that must be present in the secretary audit
export const SECRETARY_REQUIRED_FIELDS = ["summary", "equations", "references"] as const;

// Check mandatory fields inside secretary audit
export function runGates(data: any): GateResult {
  const audit = data?.secretary?.audit ?? data;
  const missing: string[] = [];

  if (!audit || typeof audit !== "object") {
    missing.push("audit object missing");
    return { ready_percent: 0, missing };
  }

  if (typeof audit.ready_percent !== "number") {
    missing.push("ready_percent missing or invalid");
  }
  if (!Array.isArray(audit.issues)) {
    missing.push("issues missing or invalid");
  }

  for (const field of SECRETARY_REQUIRED_FIELDS) {
    const value = (audit as any)[field];
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      missing.push(`${field} missing`);
    }
  }

  return {
    ready_percent:
      typeof audit.ready_percent === "number" ? audit.ready_percent : 0,
    missing
  };
}
