import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

export interface QN21PlanItem {
  item: string;
  priority: string;
  qn: string;
}

/**
 * Generates a development plan for the given name. Plans are grouped by
 * criteria. When criteria are not provided, the function interactively
 * prompts the user for them.
 */
export async function runResearchSecretary(
  name: string,
  items?: QN21PlanItem[]
) {
  const safeName = name.replace(/[^a-z0-9_-]/gi, "_");

  let plans: QN21PlanItem[] = items ?? [];
  if (!items) {
    const rl = createInterface({ input, output });
    try {
      const countStr = await rl.question("Number of items: ");
      const count = Math.max(0, parseInt(countStr, 10) || 0);
      for (let i = 0; i < count; i++) {
        const item = await rl.question(`Item ${i + 1}: `);
        const priority = await rl.question(`Priority for ${item}: `);
        const qn = await rl.question(`QN-21 criterion for ${item}: `);
        plans.push({ item, priority, qn });
      }
    } finally {
      rl.close();
    }
  }

  const header = [
    "| Item | Priority | QN-21 Criterion |",
    "|------|----------|-----------------|",
  ];
  const rows = plans.map(
    (p) => `| ${p.item} | ${p.priority} | ${p.qn} |`
  );
  const content = [
    "# Plan for " + safeName,
    "",
    ...header,
    ...rows,
    "",
  ].join("\n");

  const filePath = path.join(process.cwd(), "paper", `plan-${safeName}.md`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return { name: safeName, content };
}
