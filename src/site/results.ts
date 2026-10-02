export function percent(x: number | undefined): string {
  return `${Math.round((x ?? 0) * 100)}%`;
}

export function repoRows<T extends { cases: number }>(perRepo: Record<string, T>) {
  return Object.entries(perRepo)
    .map(([repo, scores]) => ({ ...scores, repo }))
    .sort((a, b) => a.repo.localeCompare(b.repo));
}
