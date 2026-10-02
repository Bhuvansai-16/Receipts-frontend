export function percent(x: number | undefined): string {
  return `${Math.round((x ?? 0) * 100)}%`;
}

export function repoRows<T extends { cases: number }>(perRepo: Record<string, T>) {
  return Object.entries(perRepo)
    .map(([repo, scores]) => ({ ...scores, repo }))
    .sort((a, b) => a.repo.localeCompare(b.repo));
}

type RacePatch = { verdict: string | null; fixed: boolean; reader: string | null; cost_usd: number | null };

const RANK: Record<string, number> = { PROVEN: 0, REFUTED: 2, REGRESSION: 2 }; // anything else is no answer: 1

/** Proven first, then no answer, then Refuted or Regression; sort is stable, so ties keep dataset order. */
export function rankPatches<T extends RacePatch>(patches: T[]): T[] {
  return [...patches].sort((a, b) => (RANK[a.verdict ?? ""] ?? 1) - (RANK[b.verdict ?? ""] ?? 1));
}

/** Whether Receipts matched SWE-bench's hidden tests; null when it gave no answer (Unproven, not run). */
export function receiptsAgree(p: RacePatch): boolean | null {
  if (p.verdict === "PROVEN") return p.fixed;
  if (p.verdict === "REFUTED" || p.verdict === "REGRESSION") return !p.fixed;
  return null;
}

/** Whether the model reading only the diff matched SWE-bench; null when unsure or missing. */
export function readerAgrees(p: RacePatch): boolean | null {
  if (p.reader === "fixed") return p.fixed;
  if (p.reader === "not_fixed") return !p.fixed;
  return null;
}

export function totalCost(patches: RacePatch[]): number {
  return patches.reduce((sum, p) => sum + (p.cost_usd ?? 0), 0);
}
