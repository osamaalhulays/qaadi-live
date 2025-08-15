import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export async function runLead(cards: string[]) {
  const dir = path.join(process.cwd(), "paper");
  let combined = "";
  for (const name of cards) {
    const safe = name.replace(/[^a-z0-9_-]/gi, "_");
    try {
      const planPath = path.join(dir, `plan-${safe}.md`);
      const plan = await readFile(planPath, "utf8");
      combined += `## ${safe}\n${plan}\n`;
    } catch {}
  }
  const filePath = path.join(dir, "comparison.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, combined, "utf8");
  return combined;
}
