import { z } from "zod";

export const InputSchema = z.object({
  template: z.enum(["WideAR", "ReVTeX", "InquiryTR"]).default("ReVTeX"),
  model: z.enum(["openai", "deepseek", "auto"]).default("auto"),
  max_tokens: z.number().int().min(256).max(8192).default(2048),
  text: z.string().min(1)
});
export type Input = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  text: z.string(),
  tokens_in: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
  model_used: z.string()
});
export type Output = z.infer<typeof OutputSchema>;
