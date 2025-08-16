import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Merge research secretary plans and extract top priority items to build a
 * comprehensive comparison document. Items with priority P0 or P1 are
 * considered "best" and are highlighted at the beginning of the file.
 */
export async function runLead(cards: string[], root = process.cwd()) {
  const dir = path.join(root, "paper");
  const sections: string[] = [];
  const bestMap = new Map<string, Set<string>>(); // item -> sources

  for (const name of cards) {
    const safe = name.replace(/[^a-z0-9_-]/gi, "_");
    try {
      const planPath = path.join(dir, `plan-${safe}.md`);
      const plan = await readFile(planPath, "utf8");
      sections.push(`## ${safe}\n${plan}`);

      const rows = plan.split("\n");
      for (const row of rows) {
        const match = row.match(/\|\s*(.+?)\s*\|\s*(P\d)\s*\|/);
        if (!match) continue;
        const item = match[1].trim();
        const priority = match[2];
        if (priority === "P0" || priority === "P1") {
          if (!bestMap.has(item)) bestMap.set(item, new Set());
          bestMap.get(item)!.add(safe);
        }
      }
    } catch {
      // missing plan file, skip
    }
  }

  const bestLines = Array.from(bestMap.entries()).map(
    ([item, sources]) => `- ${item} (${Array.from(sources).join(", ")})`
  );

  const bestBlock = `## Best Items\n${bestLines.length ? bestLines.join("\n") : "- None"}`;

  const content = ["# Comparison", bestBlock, ...sections].join("\n\n");

  const filePath = path.join(dir, "comparison.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
