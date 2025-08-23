import { z } from "zod";

// Minimal schema for a card payload. Allows any object shape.
export const CardSchema = z.object({}).passthrough();
export type Card = z.infer<typeof CardSchema>;
