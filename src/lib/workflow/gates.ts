export interface GateResult {
  ready_percent: number;
  missing: string[];
}

// Check mandatory fields inside secretary audit
export function runGates(data: any): GateResult {
  const audit = data?.secretary?.audit ?? data;
  const missing: string[] = [];

  if (!audit || typeof audit !== "object") {
    missing.push("audit");
    return { ready_percent: 0, missing };
  }

  if (typeof audit.ready_percent !== "number") {
    missing.push("ready_percent");
  }
  if (!Array.isArray(audit.issues)) {
    missing.push("issues");
  }

  return {
    ready_percent: typeof audit.ready_percent === "number" ? audit.ready_percent : 0,
    missing
  };
}
