import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function runConsultant() {
  const content = "Consultant notes\n";
  const filePath = path.join(process.cwd(), "paper", "notes.txt");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
