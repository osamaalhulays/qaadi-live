import { z } from "zod";

export const CardSchema = z.object({
  tracking_id: z.string().optional(),
  card: z.unknown()
}).strict();

export type CardInput = z.infer<typeof CardSchema>;
