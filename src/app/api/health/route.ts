export const runtime = "edge";
export async function GET() {
  return new Response(JSON.stringify({
    env: "OK",
    policies: { byok: true },
    build: { tag: process.env.NEXT_PUBLIC_BUILD_TAG ?? "qaadi-fast-track" }
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
