import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const roleFns: Record<string, (text: string) => string> = {
  length: (t) => String(t.length),
  sha256: (t) => crypto.createHash("sha256").update(t).digest("hex"),
};

function tsFile() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

export async function performSelfVerification(slug: string, sample: string) {
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
  return log;
}
