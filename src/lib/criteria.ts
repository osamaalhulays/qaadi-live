import { readFile, writeFile, mkdir, readdir } from "fs/promises";
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

function getPaths() {
  const base = path.join(process.cwd(), "QaadiVault", "criteria");
  return {
    base,
    latest: path.join(base, "latest.json"),
    archive: path.join(base, "archive"),
  };
}

async function ensureDirs() {
  const { archive } = getPaths();
  await mkdir(archive, { recursive: true });
}

const DEFAULT_CRITERIA: Criterion[] = [
  {
    id: "SAFE",
    description: "Safety compliance",
    weight: 5,
    keywords: ["safety", "compliance"],
    enabled: true,
    category: "internal",
    version: 1,
  },
];

export async function loadCriteria(): Promise<Criterion[]> {
  const { latest } = getPaths();
  try {
    const raw = await readFile(latest, "utf-8");
    const parsed = JSON.parse(raw) as Criterion[];
    const ids = new Set(parsed.map((c) => c.id));
    return [...parsed, ...DEFAULT_CRITERIA.filter((c) => !ids.has(c.id))];
  } catch {
    return [...DEFAULT_CRITERIA];
  }
}

async function archive(criteria: Criterion[]) {
  const { archive } = getPaths();
  // Include milliseconds in the archive filename to avoid collisions when
  // multiple snapshots are saved within the same second.
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 17);
  await writeFile(path.join(archive, `${ts}.json`), JSON.stringify(criteria, null, 2));
}

export async function saveCriteria(criteria: Criterion[]): Promise<void> {
  const { latest } = getPaths();
  await ensureDirs();
  await writeFile(latest, JSON.stringify(criteria, null, 2));
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

export async function listArchivedCriteria(): Promise<string[]> {
  await ensureDirs();
  const { archive } = getPaths();
  const files = await readdir(archive);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/i, ""))
    .sort();
}

export async function restoreCriteria(timestamp: string): Promise<Criterion[]> {
  await ensureDirs();
  const { archive } = getPaths();
  const file = path.join(archive, `${timestamp.replace(/\.json$/i, "")}.json`);
  const raw = await readFile(file, "utf-8");
  const criteria = JSON.parse(raw) as Criterion[];
  await saveCriteria(criteria);
  return criteria;
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

