import { readFile, writeFile } from 'fs/promises';

async function main() {
  try {
    const raw = await readFile('public/paper/judge.json', 'utf8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data.criteria) ? data.criteria : [];
    const total = list.length;
    const covered = list.filter(c => c.covered).length;
    const percent = total ? Math.round((covered / total) * 100) : 0;
    const md = `# Secretary Audit\n\nReady percentage based on QN-21 coverage: **${percent}%**.\n`;
    await writeFile('public/paper/secretary.md', md);
    console.log(`Ready percent: ${percent}%`);
  } catch (e) {
    console.error('Failed to update secretary.md', e);
  }
}

main();
