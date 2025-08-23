import { Card, CardSchema } from "./schema/card";

interface Success {
  status: "success";
  card: Card;
}

interface Failure {
  status: "error";
  error: unknown;
}

export type ParseCardPayloadResult = Success | Failure;

export function parseCardPayload(payload: unknown): ParseCardPayloadResult {
  try {
    const card: Card = CardSchema.parse(payload?.card);
    return { status: "success", card };
  } catch (error) {
    return { status: "error", error };
  }
}
