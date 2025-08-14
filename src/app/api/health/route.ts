export const runtime = "edge";
export async function GET() {
  const storage = process.env.NEXT_PUBLIC_STORAGE ?? "storage unavailable";
  const kv = process.env.NEXT_PUBLIC_KV ?? "kv unavailable";
  const capsuleLatest =
    process.env.NEXT_PUBLIC_CAPSULE_LATEST ?? "capsule information unavailable";

  return new Response(
    JSON.stringify({
      env: "OK",
      policies: { byok: true },
      build: { tag: process.env.NEXT_PUBLIC_BUILD_TAG ?? "qaadi-fast-track" },
      storage,
      kv,
      capsule: { latest: capsuleLatest }
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
