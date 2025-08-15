import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function runResearchSecretary(name: string) {
  const safeName = name.replace(/[^a-z0-9_-]/gi, "_");
  const content = `# Plan for ${safeName}\n`;
  const filePath = path.join(process.cwd(), "paper", `plan-${safeName}.md`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return { name: safeName, content };
}
