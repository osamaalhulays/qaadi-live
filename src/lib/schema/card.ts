import { z } from "zod";

export const CardSchema = z.object({
  caseNumber: z.string(),
  submissionDate: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      // Ensure provided string matches ISO date to catch invalid calendar dates
      return val === date.toISOString().slice(0, 10);
    }, { message: "Invalid calendar date" }),
  documents: z.array(z.string()),
});

export type Card = z.infer<typeof CardSchema>;
