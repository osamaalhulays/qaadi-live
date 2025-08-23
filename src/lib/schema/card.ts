import { z } from "zod";

export const CardSchema = z.object({
  caseNumber: z.string().min(1),
  submissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  documents: z.array(z.string().min(1)).min(1)
});

export type Card = z.infer<typeof CardSchema>;
