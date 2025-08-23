const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface Entry { body: string; expires: number; }
const store = new Map<string, Entry>();

export function stableStringify(
  obj: any,
  visited: Set<any> = new Set(),
): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (visited.has(obj)) {
    return JSON.stringify("[Circular]");
  }
  visited.add(obj);
  if (Array.isArray(obj)) {
    return `[${obj
      .map((v) => stableStringify(v, visited))
      .join(',')}]`;
  }
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k], visited)}`)
    .join(',')}}`;
}

export function checkIdempotency(key: string, payload: any): boolean {
  const now = Date.now();
  // cleanup expired
  for (const [k, v] of store) {
    if (v.expires < now) store.delete(k);
  }

  const body = stableStringify(payload);
  const existing = store.get(key);
  if (existing) {
    if (existing.body !== body) {
      return false;
    }
    existing.expires = now + WINDOW_MS;
    return true;
  }
  store.set(key, { body, expires: now + WINDOW_MS });
  return true;
}
