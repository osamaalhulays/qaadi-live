export interface ApiFetchOptions extends RequestInit {
  /**
   * When true, the raw Response is returned instead of parsed JSON.
   * Useful for endpoints that return non-JSON data such as blobs.
   */
  raw?: boolean;
}

/**
 * Helper around fetch that prepends a base URL and centralizes
 * error handling. It checks HTTP status and parses JSON responses.
 */
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T | Response> {
  const { raw, ...fetchOpts } = options;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const res = await fetch(base + path, fetchOpts);
  if (!res.ok) {
    let message: string;
    try {
      const data = await res.json();
      message = (data as any)?.error || res.statusText;
    } catch {
      message = res.statusText;
    }
    throw new Error(message);
  }
  if (raw) return res;
  try {
    return await res.json();
  } catch {
    throw new Error("invalid_json");
  }
}
