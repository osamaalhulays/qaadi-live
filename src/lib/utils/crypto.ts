import crypto from "crypto";

export function sha256Hex(data: Uint8Array | string): string {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return crypto.createHash("sha256").update(buf).digest("hex");
}

