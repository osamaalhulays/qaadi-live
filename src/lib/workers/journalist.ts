import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

export async function runJournalist() {
  const comparisonPath = path.join(process.cwd(), "paper", "comparison.md");
  let base = "";
  try { base = await readFile(comparisonPath, "utf8"); } catch {}
  const content = `# Summary\n${base}`;
  const filePath = path.join(process.cwd(), "paper", "summary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
