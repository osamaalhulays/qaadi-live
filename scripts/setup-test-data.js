import { rm, cp } from 'fs/promises';
import path from 'path';

async function main() {
  const root = process.cwd();
  const examples = path.join(root, 'docs', 'examples');
  for (const dir of ['QaadiDB', 'QaadiVault']) {
    const src = path.join(examples, dir);
    const dest = path.join(root, dir);
    await rm(dest, { recursive: true, force: true });
    await cp(src, dest, { recursive: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
