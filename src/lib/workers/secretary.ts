import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function runSecretary() {
  const content = "# Secretary\n";
  const filePath = path.join(process.cwd(), "paper", "secretary.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return content;
}
