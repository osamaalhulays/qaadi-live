import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export interface Criterion {
  /** Unique identifier for the criterion */
  id: string;
  /** Human readable description */
  description: string;
  /** Weight used when computing scores */
  weight: number;
  /** Keywords that indicate the criterion is satisfied */
  keywords: string[];
  /** Whether the criterion is active */
  enabled: boolean;
  /** Classification for the criterion */
  category: "internal" | "external" | "advisory";
  /** Version number for this criterion */
  version: number;
}

export interface CriterionResult extends Criterion {
  /** Score obtained for the criterion */
  score: number;
  /** Remaining points to reach the full weight */
  gap: number;
}

const BASE = path.join(process.cwd(), "QaadiVault", "criteria");
const LATEST = path.join(BASE, "latest.json");
const ARCHIVE = path.join(BASE, "archive");

async function ensureDirs() {
  await mkdir(ARCHIVE, { recursive: true });
}

export async function loadCriteria(): Promise<Criterion[]> {
  try {
    const raw = await readFile(LATEST, "utf-8");
    return JSON.parse(raw) as Criterion[];
  } catch {
    return [];
  }
}

async function archive(criteria: Criterion[]) {
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  await writeFile(path.join(ARCHIVE, `${ts}.json`), JSON.stringify(criteria, null, 2));
}

export async function saveCriteria(criteria: Criterion[]): Promise<void> {
  await ensureDirs();
  await writeFile(LATEST, JSON.stringify(criteria, null, 2));
  await archive(criteria);
}

export async function addCriterion(c: Omit<Criterion, "version">): Promise<Criterion[]> {
  const criteria = await loadCriteria();
  criteria.push({ ...c, version: 1 });
  await saveCriteria(criteria);
  return criteria;
}

export async function updateCriterion(
  id: string,
  updates: Partial<Omit<Criterion, "id" | "version">>
): Promise<Criterion[]> {
  const criteria = await loadCriteria();
  const idx = criteria.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("not_found");
  const version = criteria[idx].version + 1;
  criteria[idx] = { ...criteria[idx], ...updates, version };
  await saveCriteria(criteria);
  return criteria;
}

export async function deleteCriterion(id: string): Promise<Criterion[]> {
  const criteria = await loadCriteria();
  const next = criteria.filter((c) => c.id !== id);
  await saveCriteria(next);
  return next;
}

export function evaluateCriteria(
  text: string,
  criteria: Criterion[]
): CriterionResult[] {
  const lower = text.toLowerCase();
  return criteria.map((c) => {
    if (!c.enabled) return { ...c, score: 0, gap: c.weight };

    const matches = c.keywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const ratio = c.keywords.length === 0 ? 0 : matches / c.keywords.length;
    const score = c.weight * ratio;
    return { ...c, score, gap: c.weight - score };
  });
}

