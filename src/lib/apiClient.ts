export interface ApiClientOptions extends RequestInit {
  raw?: boolean;
}

export async function apiClient(url: string, options: ApiClientOptions & { raw: true }): Promise<Response>;
export async function apiClient<T>(url: string, options?: ApiClientOptions): Promise<T>;
export async function apiClient<T>(url: string, options: ApiClientOptions = {}): Promise<T | Response> {
  const base = process.env.NEXT_PUBLIC_QAADI_API_BASE?.replace(/\/$/, "");
  let fullUrl = url;
  if (base && url.startsWith("/")) {
    fullUrl = url.startsWith("/api/") ? `${base}${url.slice(4)}` : `${base}${url}`;
  }

  let res: Response;
  try {
    res = await fetch(fullUrl, options);
  } catch (err) {
    throw new Error(`Request to ${url} failed: ${(err as Error).message}`);
  }

  if (options.raw) {
    return res;
  }
  if (!res.ok) {
    throw new Error(`Request to ${url} failed with status ${res.status}`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw "invalid_json";
  }
}

export const apiFetch = apiClient;
