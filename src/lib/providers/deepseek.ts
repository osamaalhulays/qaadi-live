import { readStreamToText, safeJSON } from "@/lib/utils/json";

export async function callDeepSeek(key: string, prompt: string, max_tokens: number) {
  const t0 = Date.now();
  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      stream: false, // we normalize anyway; set true if you prefer SSE
      messages: [
        { role: "system", content: "You are Qaadi engine. Reply with plain text (no markdown fences) for paper body content." },
        { role: "user", content: prompt }
      ],
      max_tokens
    })
  });

  let text = "";
  try {
    // Try standard JSON first
    const j = safeJSON<any>(await r.clone().text(), null as any);
    if (j?.choices?.[0]?.message?.content) {
      text = j.choices[0].message.content;
    } else if (r.body) {
      // Fallback to stream/NDJSON normalization
      text = await readStreamToText(r.body);
    } else {
      text = await r.text();
    }
  } catch {
    // Last-resort textual body
    text = await r.text();
  }

  if (!text && !r.ok) throw new Error(`DEEPSEEK_${r.status}`);

  return {
    text,
    tokens_in: 0,
    tokens_out: Math.max(0, Math.floor(text.length / 4)),
    latency_ms: Date.now() - t0,
    model_used: "deepseek:deepseek-chat"
  };
}
