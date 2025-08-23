export interface ApiClientOptions extends RequestInit {
  raw?: boolean;
  timeout?: number;
}

export async function apiClient(url: string, options: ApiClientOptions & { raw: true }): Promise<Response>;
export async function apiClient<T>(url: string, options?: ApiClientOptions): Promise<T>;
export async function apiClient<T>(url: string, options: ApiClientOptions = {}): Promise<T | Response> {
  const base = process.env.NEXT_PUBLIC_QAADI_API_BASE?.replace(/\/$/, "");
  let fullUrl = url;
  if (base && url.startsWith("/")) {
    fullUrl = url.startsWith("/api/") ? `${base}${url.slice(4)}` : `${base}${url}`;
  }
  const { raw, timeout, signal, ...fetchOptions } = options;
  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeout) {
    controller = new AbortController();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", () => controller?.abort());
    }
    fetchOptions.signal = controller.signal;
    timeoutId = setTimeout(() => controller?.abort(), timeout);
  } else if (signal) {
    fetchOptions.signal = signal;
  }
  let res: Response;
  try {
    res = await fetch(fullUrl, fetchOptions);
  } catch (err) {
    throw new Error(`network_error: ${(err as Error).message}`);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  if (raw) {
    return res;
  }
  if (!res.ok) {
    let message = `Request to ${url} failed with status ${res.status}`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {}
    throw new Error(message);
  }
  try {
    return (await res.json()) as Promise<T>;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("invalid_json");
    }
    throw err;
  }
}

export default apiClient;
export { apiClient as apiFetch };
