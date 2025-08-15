export interface UserCriterion {
  /** Stable identifier for the criterion */
  id: string;
  /** User-friendly name of the criterion */
  name: string;
  /** Whether the criterion is internal or external */
  type: "internal" | "external";
  /** Optional description clarifying the criterion */
  description: string;
  /** Whether the criterion should be used during evaluation */
  isActive: boolean;
}

const STORAGE_KEY = "qaadi-user-criteria";

/** Load criteria from localStorage (browser only). */
export function loadUserCriteria(): UserCriterion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserCriterion[]) : [];
  } catch {
    return [];
  }
}

/** Persist criteria to localStorage (browser only). */
export function saveUserCriteria(criteria: UserCriterion[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
  } catch {}
}

/** Return only the criteria that are currently active. */
export function getActiveCriteria(list?: UserCriterion[]): UserCriterion[] {
  const criteria = list ?? loadUserCriteria();
  return criteria.filter((c) => c.isActive);
}
