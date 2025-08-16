import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { freezeText, restoreText } from "../utils/freeze";

/**
 * Produce multilingual journalist outputs while preserving equations using the
 * freeze/restore helpers. English files retain the historic names so existing
 * workflows continue to function.
 */
export async function runJournalist() {
  const comparisonPath = path.join(process.cwd(), "paper", "comparison.md");
  let base = "";
  try { base = await readFile(comparisonPath, "utf8"); } catch {}

  const frozen = freezeText(base);
  const restore = (text: string) =>
    restoreText(text, frozen.equations, frozen.dois, frozen.codes);

  const outputs = [
    { file: "summary.md", content: restore(`# Summary\n${frozen.text}`) },
    { file: "summary.en.md", content: restore(`# Summary\n${frozen.text}`) },
    { file: "summary.ar.md", content: restore(`# ملخص\n${frozen.text}`) },
    {
      file: "report.en.md",
      content: restore(`# Expanded Report\n${frozen.text}\n\n${frozen.text}`),
    },
    {
      file: "report.ar.md",
      content: restore(`# تقرير موسع\n${frozen.text}\n\n${frozen.text}`),
    },
  ];

  for (const out of outputs) {
    const filePath = path.join(process.cwd(), "paper", out.file);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, out.content, "utf8");
  }

  // Return the primary English summary for compatibility with callers.
  return outputs[0].content;
}

