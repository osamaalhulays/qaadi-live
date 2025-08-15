import { z } from "zod";

export const InputSchema = z.object({
  target: z.enum([
    "wide",
    "revtex",
    "inquiry",
    "iop",
    "sn-jnl",
    "elsevier",
    "ieee",
    "arxiv"
  ]),
  lang: z.enum([
    "ar",
    "en",
    "tr",
    "fr",
    "es",
    "de",
    "ru",
    "zh-Hans",
    "ja",
    "other"
  ]),
  model: z
    .enum(["openai", "deepseek", "auto"])
    .default("auto"),
  max_tokens: z
    .number()
    .int()
    .min(256)
    .max(8192)
    .default(2048),
  text: z.string().min(1),
  slug: z.string().default("default"),
  v: z.string().default("default")
});
export type Input = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  text: z.string(),
  tokens_in: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
  model_used: z.string(),
  checks: z.object({
    equations_count: z.number().int().nonnegative(),
    glossary_applied: z.boolean(),
    rtl_ltr: z.enum(["rtl", "ltr", "mixed"]),
    idempotency: z.boolean()
  }),
  files: z.array(z.string()).optional()
});
export type Output = z.infer<typeof OutputSchema>;
