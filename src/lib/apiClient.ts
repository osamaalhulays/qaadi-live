export async function apiClient<T = any>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch ${path}: ${msg}`);
  }

  const raw = await res.text();
  let data: any = raw;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    // leave as text if parsing fails
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null
        ? data.error || data.message || JSON.stringify(data)
        : raw;
    throw new Error(`HTTP ${res.status} for ${path}: ${msg}`);
  }

  return data as T;
}
