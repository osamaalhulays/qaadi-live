export const runtime = "edge";


function storageStatus() {
  const url = process.env.STORAGE_URL;
  if (url) {
    return { status: "ok", url };
  }
  return { status: "unavailable", message: "STORAGE_URL missing" };
}

function kvStatus() {
  const url = process.env.KV_REST_API_URL;
  if (url) {
    return { status: "ok", url };
  }
  return { status: "unavailable", message: "KV_REST_API_URL missing" };
}

async function capsuleInfo() {
  try {
    const registry = await import("../../../../QaadiDB/registry.json", {
      assert: { type: "json" }
    });
    const latest = (registry as any).default?.theories?.[0]?.latest;
    if (latest) return { latest };
    return { latest: null, message: "No capsule data" };
  } catch {
    return { latest: null, message: "capsule registry unavailable" };
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      env: "OK",
      policies: { byok: true },
      build: { tag: process.env.NEXT_PUBLIC_BUILD_TAG ?? "qaadi-fast-track" },
      storage: storageStatus(),
      kv: kvStatus(),
      capsule: await capsuleInfo(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
