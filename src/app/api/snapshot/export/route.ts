import { NextRequest } from "next/server";
import { makeZip, ZipFile } from "../../../../lib/utils/zip";
import { setSnapshot } from "../../../../lib/snapshot";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad_input" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const text = String(body?.text ?? "").trim();
  const verification = {
    equations_count: (text.match(/\$/g) || []).length / 2,
    glossary_applied: /glossary/i.test(text)
  };

  const files: ZipFile[] = [
    { path: "paper/10_input.md", content: text },
    { path: "paper/20_verification.json", content: JSON.stringify(verification, null, 2) }
  ];
  const zip = makeZip(files);
  setSnapshot(zip, "qaadi_export.zip", verification);

  return new Response(JSON.stringify({ ok: true, verification }), {
    headers: { "Content-Type": "application/json" }
  });
}
