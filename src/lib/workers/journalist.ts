/**
 * Journalist creates a short publication-ready summary based on the consultant's plan.
 */
export function runJournalist(plan: string): string {
  return `Summary: ${plan.replace(/\n/g, ' ')}`;
}

