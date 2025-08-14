import { promises as fs } from "fs";
import path from "path";

async function main() {
  const root = process.cwd();
  const legacyPath = path.join(root, "QaadiDB", "registry.json");
  let raw: string;
  try {
    raw = await fs.readFile(legacyPath, "utf-8");
  } catch {
    console.error("legacy registry not found");
    return;
  }
  const data = JSON.parse(raw) as { theories: Array<{ slug: string; latest: string }> };
  for (const t of data.theories) {
    const dir = path.join(root, "QaadiDB", `theory-${t.slug}`);
    await fs.mkdir(dir, { recursive: true });
    const target = path.join(dir, "registry.json");
    await fs.writeFile(target, JSON.stringify({ slug: t.slug, latest: t.latest }, null, 2));
  }
  await fs.unlink(legacyPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
