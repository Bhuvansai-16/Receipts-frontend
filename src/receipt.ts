// The receipt model: one shape built either from live events or from saved evidence.
import type { Evidence, ReceiptEvent, RunSummary, RunSummaryRaw, Verdict } from "./api";

export interface Tile {
  passed: boolean;
  message: string;
}

export interface Receipt {
  claim?: { kind: string; claim: string };
  envReady: boolean;
  /** Pages of library documentation the research brief found with Tavily for the APIs the issue names. */
  docs?: number;
  submissions: { attempt: number; accepted: boolean; reason: string }[];
  writerCommands: number;
  /** Set when no test was accepted and the check retried writing once; model is the short model name. */
  writerRetry?: { model: string };
  testAttempts?: number;
  /** Set when the check reused the blind test an earlier check wrote for the same issue: that run's id. */
  reusedFrom?: string;
  base: Tile[];
  pr: Tile[];
  patchApplied: boolean;
  suite?: { basePassed: number; baseTotal: number; broken: number };
  secondOpinion?: { faithful: boolean; reason: string };
  verdict?: { verdict: Verdict; reason: string; seconds: number; tokens: number };
  error?: string;
  done: boolean;
}

export type Step = "claim" | "env" | "writer" | "runs" | "suite" | "verdict" | "done";

const empty = (): Receipt => ({
  envReady: false,
  submissions: [],
  writerCommands: 0,
  base: [],
  pr: [],
  patchApplied: true,
  done: false,
});

export function fromEvents(events: ReceiptEvent[]): Receipt {
  const r = empty();
  const forks: Record<"base" | "pr", { n: number; tile: Tile }[]> = { base: [], pr: [] };
  for (const { type, data } of events) {
    const d = data as Record<string, any>;
    if (type === "claim") r.claim = { kind: String(d.kind), claim: String(d.claim) };
    else if (type === "env_ready") r.envReady = true;
    else if (type === "research") r.docs = Number(d.sources ?? 0);
    else if (type === "writer_submit")
      r.submissions.push({ attempt: Number(d.attempt), accepted: Boolean(d.accepted), reason: String(d.reason ?? "") });
    else if (type === "writer_progress") r.writerCommands = Number(d.commands);
    else if (type === "writer_retry") r.writerRetry = { model: String(d.model ?? "").split("/").pop() ?? "" };
    else if (type === "test_reused") r.reusedFrom = String(d.from ?? "");
    else if (type === "test_accepted") r.testAttempts = Number(d.attempts);
    else if (type === "fork" && (d.side === "base" || d.side === "pr"))
      forks[d.side as "base" | "pr"].push({ n: Number(d.n), tile: { passed: Boolean(d.passed), message: String(d.message ?? "") } });
    else if (type === "suite")
      r.suite = { basePassed: Number(d.base_passed), baseTotal: Number(d.base_total), broken: 0 };
    else if (type === "second_opinion") r.secondOpinion = { faithful: Boolean(d.faithful), reason: String(d.reason) };
    else if (type === "verdict")
      r.verdict = {
        verdict: d.verdict as Verdict,
        reason: String(d.reason),
        seconds: Number(d.seconds),
        tokens: Number(d.tokens ?? 0),
      };
    else if (type === "error") r.error = String(d.message);
    else if (type === "done") r.done = true;
  }
  r.base = forks.base.sort((a, b) => a.n - b.n).map((f) => f.tile);
  r.pr = forks.pr.sort((a, b) => a.n - b.n).map((f) => f.tile);
  return finalize(r);
}

export function fromEvidence(ev: Evidence): Receipt {
  const r = ev.events?.length ? fromEvents(ev.events) : derive(ev);
  if (ev.verdict)
    r.verdict = { verdict: ev.verdict, reason: ev.reason ?? "", seconds: ev.seconds ?? 0, tokens: totalTokens(ev.tokens) };
  if (typeof ev.forks?.pr_with_test === "string") r.patchApplied = false;
  r.done = true;
  return finalize(r);
}

function derive(ev: Evidence): Receipt {
  const r = empty();
  r.claim = ev.claim;
  r.envReady = ev.writer !== undefined;
  if (ev.research) r.docs = ev.research.sources.length;
  if (ev.writer?.test_code) r.testAttempts = ev.writer.attempts;
  if (ev.writer?.reused_from) r.reusedFrom = ev.writer.reused_from;
  const f = ev.forks;
  if (f) {
    r.base = f.base_with_test.map(tile);
    r.pr = Array.isArray(f.pr_with_test) ? f.pr_with_test.map(tile) : [];
    const suite = Array.isArray(f.base_suite) ? f.base_suite[0] : f.base_suite;
    if (suite) r.suite = { basePassed: suite.tests - Object.keys(suite.not_passed).length, baseTotal: suite.tests, broken: 0 };
  }
  r.secondOpinion = ev.second_opinion;
  return r;
}

function tile(run: RunSummaryRaw): Tile {
  const failing = Object.values(run.not_passed);
  return { passed: run.tests > 0 && failing.length === 0, message: failing[0]?.msg.split("\n")[0] ?? "" };
}

function finalize(r: Receipt): Receipt {
  if (r.verdict?.reason.includes("does not apply")) r.patchApplied = false;
  const broken = r.verdict?.verdict === "REGRESSION" ? /breaks (\d+) existing/.exec(r.verdict.reason) : null;
  if (r.suite && broken) r.suite = { ...r.suite, broken: Number(broken[1]) };
  return r;
}

export function totalTokens(tokens: Evidence["tokens"]): number {
  return Object.values(tokens ?? {}).reduce((sum, t) => sum + (t.total_tokens ?? 0), 0);
}

/** Which line the live receipt is currently printing. */
export function activeStep(r: Receipt): Step {
  if (r.done) return "done";
  if (r.verdict) return "verdict";
  if (!r.claim) return "claim";
  if (r.claim.kind !== "fix") return "verdict";
  if (!r.envReady) return "env";
  if (r.testAttempts === undefined) return "writer";
  if (r.base.length < 3 || (r.patchApplied && r.pr.length < 3)) return "runs";
  if (!r.suite) return "suite";
  return "verdict";
}

export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  return total < 60 ? `${total} s` : `${Math.floor(total / 60)} min ${total % 60} s`;
}

export function formatTokens(n: number): string {
  if (n < 1000) return `${n} tokens`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}K tokens`;
  return `${(n / 1_000_000).toFixed(1)}M tokens`;
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = (now - then) / 1000;
  if (seconds < 45) return "just now";
  if (seconds < 3600) return relative.format(-Math.round(seconds / 60), "minute");
  if (seconds < 86_400) return relative.format(-Math.round(seconds / 3600), "hour");
  return relative.format(-Math.round(seconds / 86_400), "day");
}

export function issueNumber(instanceId: string): string {
  return instanceId.slice(instanceId.lastIndexOf("-") + 1);
}

/** SWE-bench ids are <owner>__<repo>-<number>. */
export function repoOf(instanceId: string): string {
  return instanceId.slice(0, instanceId.lastIndexOf("-")).replace("__", "/");
}

/** A row in a list of checks: "repo #29" for pull requests (the number never truncates), the instance id for demos. */
export function runLabel(run: RunSummary): { name: string; number: string; full: string } {
  if (run.repo && run.pr_number != null)
    return { name: run.repo.split("/").pop()!, number: `#${run.pr_number}`, full: `${run.repo} #${run.pr_number}` };
  return { name: run.instance_id, number: "", full: run.instance_id };
}

/** The receipt's line under "Blind test": where the test came from. */
export function blindTestNote(r: Receipt): string {
  if (r.reusedFrom) return "written from the issue alone in an earlier check";
  return r.writerRetry ? "written from the issue alone, after one automatic retry" : "written from the issue alone";
}

export const PR_LABEL: Record<string, string> = {
  gold: "Real fix",
  none: "Do-nothing PR",
  diff: "Pasted diff",
  github: "Pull request",
};

/** A link taken from evidence, if it is a web link. Receipts are public pages: never render javascript: or data:. */
export function safeHref(url: string | null | undefined): string | undefined {
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

/** The receipt's heading line: repository, what was checked, and where it lives on GitHub. */
export function receiptTitle(ev: Evidence): { repo: string; label: string; pr: string | null; url: string | null } {
  if (ev.source)
    return { repo: ev.source.repo, label: `PR #${ev.source.pr_number}`, pr: null, url: safeHref(ev.source.url) ?? null };
  return {
    repo: ev.repo ?? repoOf(ev.instance_id),
    label: `issue #${issueNumber(ev.instance_id)}`,
    pr: ev.pr ? (PR_LABEL[ev.pr] ?? ev.pr) : null,
    url: null,
  };
}
