import { runWithFallback } from "./providers/router";

export type ProviderModel = "openai" | "deepseek" | "auto";
export interface ProviderKeys { openai?: string; deepseek?: string }

export async function generateText(
  model: ProviderModel,
  keys: ProviderKeys,
  prompt: string,
  maxTokens: number,
  runner: (
    model: ProviderModel,
    keys: ProviderKeys,
    prompt: string,
    maxTokens: number
  ) => Promise<any> = runWithFallback
) {
  return runner(model, keys, prompt, maxTokens);
}
