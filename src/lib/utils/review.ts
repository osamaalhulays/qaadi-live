import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

export interface JudgeCriterion {
  category: 'internal' | 'external';
  score: number;
  gap?: string;
}

export interface JudgeReport {
  score_total: number;
  gaps: {
    internal: string[];
    external: string[];
  };
}

/**
 * Compute total score and gap table grouped by internal/external.
 * Results are written to paper/judge.json.
 */
export async function runJudge(criteria: JudgeCriterion[]): Promise<JudgeReport> {
  const score_total = criteria.reduce((sum, c) => sum + c.score, 0);
  const gaps = { internal: [] as string[], external: [] as string[] };
  for (const c of criteria) {
    if (c.gap) {
      if (c.category === 'external') gaps.external.push(c.gap);
      else gaps.internal.push(c.gap);
    }
  }
  const report: JudgeReport = { score_total, gaps };
  const paperDir = path.join(process.cwd(), 'paper');
  await mkdir(paperDir, { recursive: true });
  const outPath = path.join(paperDir, 'judge.json');
  await writeFile(outPath, JSON.stringify(report, null, 2));
  return report;
}

/**
 * Convert gap table into a development plan with priorities.
 * Gaps from the judge are mapped: internal → P0, external → P1.
 * A generic polish step is appended as P2.
 * The resulting Markdown is written to paper/plan.md.
 */
export async function runConsultant(): Promise<string> {
  const paperDir = path.join(process.cwd(), 'paper');
  await mkdir(paperDir, { recursive: true });
  const judgePath = path.join(paperDir, 'judge.json');
  const raw = await readFile(judgePath, 'utf-8');
  const data: JudgeReport = JSON.parse(raw);
  const lines: string[] = ['# Development Plan', ''];
  for (const g of data.gaps.internal) {
    lines.push(`- [P0] ${g}`);
  }
  for (const g of data.gaps.external) {
    lines.push(`- [P1] ${g}`);
  }
  lines.push('- [P2] polish and review', '');
  const plan = lines.join('\n');
  const planPath = path.join(paperDir, 'plan.md');
  await writeFile(planPath, plan);
  return plan;
}

