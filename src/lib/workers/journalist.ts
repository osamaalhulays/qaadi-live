import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { freezeText, restoreText } from "@/lib/utils/freeze";

function wrapMath(text: string) {
  return text
    .replace(/\$\$(.+?)\$\$/gs, (_, p1) => `\\[${p1}\\]`)
    .replace(/\$(.+?)\$/g, (_, p1) => `\\(${p1}\\)`);
}

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
  const identity = crypto
    .createHash("sha256")
    .update(frozen.text)
    .digest("hex");

  const build = (lang: "en" | "ar", body: string) => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    const restored = restore(body);
    const withMath = wrapMath(restored);
    return `<div dir="${dir}">\nTheory ID: ${identity}\n\n${withMath}\n</div>`;
  };

  const outputs = [
    { file: "summary.md", content: build("en", `# Summary\n${frozen.text}`) },
    { file: "summary.en.md", content: build("en", `# Summary\n${frozen.text}`) },
    { file: "summary.ar.md", content: build("ar", `# ملخص\n${frozen.text}`) },
    {
      file: "report.en.md",
      content: build("en", `# Expanded Report\n${frozen.text}\n\n${frozen.text}`),
    },
    {
      file: "report.ar.md",
      content: build("ar", `# تقرير موسع\n${frozen.text}\n\n${frozen.text}`),
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

