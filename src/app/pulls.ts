import type { PullSummary } from "../api";

/** What "Check all" would check: open non-draft PRs with no receipt, and no check under way, at their head
 * commit. Mirrors the backend's `unchecked`, which decides; this only labels the button. */
export function uncheckedPulls(pulls: PullSummary[]): PullSummary[] {
  return pulls.filter(
    (p) => !p.draft && !(p.latest && p.latest.head_sha === p.head_sha && p.latest.status !== "error"),
  );
}
