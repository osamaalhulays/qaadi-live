/** safe JSON with fallback */
export function safeJSON<T = unknown>(s: string, fallback: T): T {
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

/** parse NDJSON / SSE style payloads → accumulate `content` fields */
function parseNDJSONForText(all: string): string | null {
  let acc = "";
  for (const raw of all.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
    const obj = safeJSON<any>(payload, null as any);
    if (!obj) continue;
    // OpenAI-ish deltas
    const d = obj?.choices?.[0]?.delta?.content ?? obj?.choices?.[0]?.message?.content;
    if (typeof d === "string") acc += d;
  }
  return acc.length ? acc : null;
}

/** Accept raw text, JSON, or NDJSON stream; normalize to plain text */
export async function readStreamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const dec = new TextDecoder();
  const reader = stream.getReader();
  let all = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    all += dec.decode(value, { stream: true });
  }
  // Flush decoder's internal buffer to avoid truncating multi-byte chars
  all += dec.decode();
  // Try full JSON first
  const j = safeJSON<any>(all, null as any);
  if (j?.choices?.[0]?.message?.content) return j.choices[0].message.content as string;
  // Try NDJSON/SSE
  const nd = parseNDJSONForText(all);
  if (nd !== null) return nd;
  // Fallback: raw text
  return all;
}

/** Common CORS / security headers for Edge routes */
export function baseHeaders(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-OpenAI-Key, X-DeepSeek-Key",
    ...extra
  };
}
