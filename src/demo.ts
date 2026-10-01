// The no-sign-in demo: hand-picked checks grouped by issue (receipts-backend: receipts/demo.py).
import { ApiError, type DemoCase } from "./api";

const KIND_ORDER = ["real fix", "empty patch", "wrong patch"];

export interface DemoIssue {
  instance_id: string;
  repo: string;
  title: string;
  cases: DemoCase[];
}

const rank = (kind: string) => (KIND_ORDER.includes(kind) ? KIND_ORDER.indexOf(kind) : KIND_ORDER.length);

/** Cases grouped by issue, issues in file order, each issue's cases as real fix, empty patch, wrong patch. */
export function groupCases(cases: DemoCase[]): DemoIssue[] {
  const issues = new Map<string, DemoIssue>();
  for (const c of cases) {
    const issue = issues.get(c.instance_id) ?? { instance_id: c.instance_id, repo: c.repo, title: c.title, cases: [] };
    issue.cases.push(c);
    issues.set(c.instance_id, issue);
  }
  for (const issue of issues.values()) issue.cases.sort((a, b) => rank(a.kind) - rank(b.kind));
  return [...issues.values()];
}

/** What to say when a demo check didn't start: the server's own words when the caps are used up. */
export function demoMessage(err: unknown): string {
  return err instanceof ApiError && err.status === 429 ? err.message : "Couldn't start the check. Try again in a moment.";
}
