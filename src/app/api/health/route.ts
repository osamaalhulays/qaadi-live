export const runtime = "edge";
export async function GET() {
  const storage = process.env.NEXT_PUBLIC_STORAGE ?? "storage unavailable";
  const kv = process.env.NEXT_PUBLIC_KV ?? "kv unavailable";
  const capsuleName =
    process.env.NEXT_PUBLIC_CAPSULE_NAME ?? "capsule information unavailable";
  const capsuleSha256 =
    process.env.NEXT_PUBLIC_CAPSULE_SHA256 ?? "capsule information unavailable";
  const capsuleTs =
    process.env.NEXT_PUBLIC_CAPSULE_TS ?? "capsule information unavailable";

  return new Response(
    JSON.stringify({
      env: "OK",
      policies: {
        byok: true,
        storage_public_read_capsules: true,
        storage_public_read_theory_zips: true
      },
      build: { tag: process.env.NEXT_PUBLIC_BUILD_TAG ?? "qaadi-fast-track" },
      storage,
      kv,
      capsule: { name: capsuleName, sha256: capsuleSha256, ts: capsuleTs }
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
