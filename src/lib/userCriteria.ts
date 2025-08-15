export interface UserCriterion {
  id: string;
  name: string;
  enabled: boolean;
}

const KEY = "qaadi_user_criteria";

function read(): UserCriterion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserCriterion[]) : [];
  } catch {
    return [];
  }
}

function write(list: UserCriterion[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function loadUserCriteria() {
  return read();
}

export function saveUserCriteria(list: UserCriterion[]) {
  write(list);
}

export function upsertCriterion(c: UserCriterion) {
  const list = read();
  const idx = list.findIndex(x => x.id === c.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...c };
  else list.push(c);
  write(list);
  return list;
}

export function toggleCriterion(id: string) {
  const list = read();
  const idx = list.findIndex(x => x.id === id);
  if (idx >= 0) {
    list[idx].enabled = !list[idx].enabled;
    write(list);
  }
  return list;
}

export function getActiveCriteria() {
  return read().filter(c => c.enabled);
}
