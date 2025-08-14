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
  text: z.string().min(1)
});
export type Input = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  text: z.string(),
  tokens_in: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
  model_used: z.string(),
  checks: z.object({
    eq_before: z.number().int().nonnegative(),
    eq_after: z.number().int().nonnegative(),
    eq_match: z.boolean(),
    glossary_entries: z.number().int().nonnegative(),
    rtl_ltr: z.enum(["rtl", "ltr", "mixed"]),
    idempotency: z.boolean()
  }),
  files: z.array(z.string()).optional()
});
export type Output = z.infer<typeof OutputSchema>;

export const SlugSchema = z.string().regex(/^[A-Za-z0-9._-]+$/);
export const VersionSchema = z.string().regex(/^[A-Za-z0-9._-]+$/);
export const SlugVersionSchema = z.object({ slug: SlugSchema, v: VersionSchema });
