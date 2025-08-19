import { runHead, endHead, exportHead } from './head';
import { runResearchSecretary, QN21PlanItem } from './researchSecretary';
import { runLead } from './lead';

export async function runResearchCenter(
  cardPlans: Record<string, QN21PlanItem[]>,
  root = process.cwd(),
) {
  const ids = Object.keys(cardPlans).slice(0, 10);
  const sessions: string[] = [];
  const prevCwd = process.cwd();
  try {
    process.chdir(root);
    for (const id of ids) {
      await runHead({ card_id: id, user: 'research-center', nonce: id });
      try {
        await runResearchSecretary(id, cardPlans[id]);
        sessions.push(id);
      } catch (err) {
        await endHead(id);
        throw err;
      }
    }
    return await exportHead(sessions, () => runLead(ids, root));
  } finally {
    process.chdir(prevCwd);
  }
}
