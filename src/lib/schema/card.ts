import { z } from "zod";

export const CardSchema = z.object({
  id: z.string(),
  data: z.unknown(),
  version: z.string(),
  status: z.enum(["open", "closed", "archived"]),
  parent_id: z.string().nullable(),
  date_created: z.string(),
  last_modified: z.string(),
});

export type Card = z.infer<typeof CardSchema>;

