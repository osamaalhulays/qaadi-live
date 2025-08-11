import { callOpenAI } from "./openai";
import { callDeepSeek } from "./deepseek";

export async function runWithFallback(
  primary: "openai" | "deepseek" | "auto",
  keys: { openai?: string; deepseek?: string },
  prompt: string,
  max_tokens: number
) {
  const tryOpenAI = async () => {
    if (!keys.openai) throw new Error("NO_OPENAI_KEY");
    return await callOpenAI(keys.openai, prompt, max_tokens);
  };
  const tryDeepSeek = async () => {
    if (!keys.deepseek) throw new Error("NO_DEEPSEEK_KEY");
    return await callDeepSeek(keys.deepseek, prompt, max_tokens);
  };

  if (primary === "openai") {
    try { return await tryOpenAI(); } catch { return await tryDeepSeek(); }
  } else if (primary === "deepseek") {
    try { return await tryDeepSeek(); } catch { return await tryOpenAI(); }
  } else {
    try { return await tryOpenAI(); } catch { return await tryDeepSeek(); }
  }
}
