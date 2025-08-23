import { CardSchema } from "./schema/card";

interface Success {
  card: any;
  tracking_id: string;
}

interface Failure {
  error: string;
  tracking_id: string;
}

export async function parseCardPayload(req: Request): Promise<Success | Failure> {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return { error: "invalid_json", tracking_id: "" };
  }

  const tracking_id = typeof payload?.tracking_id === "string" ? payload.tracking_id : "";

  try {
    const card = CardSchema.parse(payload?.card);
    return { card, tracking_id };
  } catch {
    return { error: "invalid_card", tracking_id };
  }
}
