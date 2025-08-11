export async function callOpenAI(key: string, prompt: string, max_tokens: number) {
  const t0 = Date.now();
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Qaadi engine. Reply with plain text (no markdown fences) for paper body content." },
        { role: "user", content: prompt }
      ],
      max_tokens
    })
  });

  if (!r.ok) throw new Error(`OPENAI_${r.status}`);

  const json = await r.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  return {
    text,
    tokens_in: json?.usage?.prompt_tokens ?? 0,
    tokens_out: json?.usage?.completion_tokens ?? Math.max(0, Math.floor(text.length / 4)),
    latency_ms: Date.now() - t0,
    model_used: json?.model ?? "openai:gpt-4o-mini"
  };
}
