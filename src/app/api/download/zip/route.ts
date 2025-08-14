import { getSnapshot } from "../../../../lib/snapshot";

export const runtime = "nodejs";

export async function GET() {
  const snap = getSnapshot();
  if (!snap.zip) {
    return new Response(JSON.stringify({ error: "no_snapshot" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(snap.zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${snap.name}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
