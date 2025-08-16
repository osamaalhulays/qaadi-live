import type { NextRequest } from "next/server";
import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*"
};

const roleFns: Record<string, (text: string) => string> = {
  length: (t) => String(t.length),
  sha256: (t) => crypto.createHash("sha256").update(t).digest("hex")
};

function tsFile() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

export async function POST(req: NextRequest) {
  try {
    const { slug, sample } = await req.json();
    if (!slug || typeof sample !== "string") {
      return new Response(JSON.stringify({ error: "invalid_params" }), { status: 400, headers });
    }
    const base = path.join(process.cwd(), "QaadiVault", `theory-${slug}`);
    const fpPath = path.join(base, "fingerprints.json");
    const raw = await readFile(fpPath, "utf-8");
    const fingerprints = JSON.parse(raw) as Record<string, string>;
    const deviations: { role: string; expected: string; found: string }[] = [];
    let matches = 0;
    for (const role of Object.keys(fingerprints)) {
      const fn = roleFns[role];
      const found = fn ? fn(sample) : "";
      const expected = fingerprints[role];
      if (found === expected) matches++;
      else deviations.push({ role, expected, found });
    }
    const ratio = Object.keys(fingerprints).length
      ? matches / Object.keys(fingerprints).length
      : 0;
    const testsDir = path.join(base, "tests");
    await mkdir(testsDir, { recursive: true });
    const ts = tsFile();
    const log = { ratio, deviations };
    await writeFile(path.join(testsDir, `${ts}.json`), JSON.stringify(log, null, 2));
    return new Response(JSON.stringify(log), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "fingerprints_not_found" }), { status: 500, headers });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return new Response(JSON.stringify({ error: "missing_slug" }), { status: 400, headers });
  try {
    const testsDir = path.join(process.cwd(), "QaadiVault", `theory-${slug}`, "tests");
    const files = (await readdir(testsDir)).filter((f) => f.endsWith(".json")).sort();
    const last = files[files.length - 1];
    if (!last) throw new Error("none");
    const raw = await readFile(path.join(testsDir, last), "utf-8");
    return new Response(raw, { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  }
}
