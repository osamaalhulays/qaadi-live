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
  const res = await fetch(fullUrl, options);
  if (options.raw) {
    return res;
  }
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}
