import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { evaluateText } from "../evaluationService";

export async function runJudge(text?: string) {
  const debug = (msg: string) => {
    if (process.env.DEBUG_JUDGE) {
      console.log(`runJudge: ${msg}`);
    }
  };

  debug("start");

  let content = text;
  if (content === undefined) {
    try {
      content = await readFile(path.join(process.cwd(), "paper", "bundle.md"), "utf8");
    } catch {
      try {
        content = await readFile(path.join(process.cwd(), "paper", "draft.tex"), "utf8");
      } catch {
        content = "";
      }
    }
  }

  debug(`input size ${content.length}`);
  debug("evaluation start");
  const result = await evaluateText(content);

  const filePath = path.join(process.cwd(), "paper", "judge.json");
  debug(`write path ${filePath}`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(result, null, 2), "utf8");
  debug("completion");
  return result;
}
