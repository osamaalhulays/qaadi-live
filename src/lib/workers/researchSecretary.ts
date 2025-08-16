import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

export interface CriterionPlan {
  criterion: string;
  plan: string;
}

/**
 * Generates a development plan for the given name. Plans are grouped by
 * criteria. When criteria are not provided, the function interactively
 * prompts the user for them.
 */
export async function runResearchSecretary(
  name: string,
  criteria?: CriterionPlan[]
) {
  const safeName = name.replace(/[^a-z0-9_-]/gi, "_");

  let plans: CriterionPlan[] = criteria ?? [];
  if (!criteria) {
    const rl = createInterface({ input, output });
    try {
      const countStr = await rl.question("Number of criteria: ");
      const count = Math.max(0, parseInt(countStr, 10) || 0);
      for (let i = 0; i < count; i++) {
        const criterion = await rl.question(`Criterion ${i + 1}: `);
        const plan = await rl.question(`Plan for ${criterion}: `);
        plans.push({ criterion, plan });
      }
    } finally {
      rl.close();
    }
  }

  const sections = plans
    .map((p) => [`## ${p.criterion}`, p.plan])
    .flat();
  const content = ["# Plan for " + safeName, "", ...sections, ""].join("\n");

  const filePath = path.join(process.cwd(), "paper", `plan-${safeName}.md`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return { name: safeName, content };
}
