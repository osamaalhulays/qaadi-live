import { z } from "zod";

export const JudgeCriterionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  score: z.number().min(0).max(10),
  notes: z.string().optional()
});

export const JudgeReportSchema = z.object({
  score_total: z.number().min(0).max(200),
  criteria: z.array(JudgeCriterionSchema),
  notes: z.string().optional()
});

export type JudgeCriterion = z.infer<typeof JudgeCriterionSchema>;
export type JudgeReport = z.infer<typeof JudgeReportSchema>;
