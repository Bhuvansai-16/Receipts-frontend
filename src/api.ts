// Typed client for the Receipts API (receipts-backend: receipts/server.py).

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type Verdict = "PROVEN" | "REFUTED" | "REGRESSION" | "UNPROVEN" | "NO_CHECKABLE_CLAIM";
export type PrKind = "gold" | "none" | "diff";
export type RunKind = PrKind | "github";
export type RunStatus = "queued" | "running" | "done" | "error";

export interface InstanceSummary {
  id: string;
  repo: string;
  difficulty: string;
  title: string;
}

export interface InstanceDetail {
  id: string;
  repo: string;
  problem_statement: string;
}

export interface RunSummary {
  id: string;
  instance_id: string;
  pr: string;
  status: RunStatus;
  verdict: Verdict | null;
  reason: string | null;
  seconds: number | null;
  tokens: number | null;
  started_at: string;
  finished_at: string | null;
  repo?: string | null;
  pr_number?: number | null;
}

export interface Usage {
  active: number;
  today: number;
  max_active: number;
  per_day: number;
}

export interface Me {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  usage: Usage;
}

export interface Installation {
  id: number;
  account_login: string;
  account_type: string;
}

export interface GitHubStatus {
  app_configured: boolean;
  github_linked: boolean;
  install_url: string | null;
  installations: Installation[];
}

export interface Repo {
  id: number;
  full_name: string;
  private: boolean;
  language: string | null;
  description: string | null;
  pushed_at: string | null;
  url: string;
  installation_id: number;
  auto_check: boolean;
}

export interface PullSummary {
  number: number;
  title: string;
  author: string | null;
  url: string;
  draft: boolean;
  updated_at: string | null;
  head_sha: string;
  linked_issue: number | null;
  latest: { id: string; status: RunStatus; verdict: Verdict | null } | null;
}

export interface ReceiptEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface TestOutcome {
  outcome: string;
  exc: string | null;
  msg: string;
}

export interface RunSummaryRaw {
  tests: number;
  not_passed: Record<string, TestOutcome>;
  output_tail: string;
}

/** One counted test submission: the file the writer submitted and what the checks said. */
export interface Submission {
  attempt: number;
  accepted: boolean;
  reason: string;
  code: string | null;
}

export interface Evidence {
  run_id?: string;
  instance_id: string;
  repo?: string;
  pr?: string;
  started_at?: string;
  claim?: { kind: string; claim: string };
  writer?: {
    attempts: number;
    reason: string;
    test_code: string | null;
    submissions?: Submission[];
    scope_check?: string;
    tool_log?: { cmd: string; exit: number; output: string }[];
  };
  forks?: {
    base_with_test: RunSummaryRaw[];
    pr_with_test: RunSummaryRaw[] | string;
    // older runs stored a single summary instead of [full run, ...reruns]
    base_suite: RunSummaryRaw[] | RunSummaryRaw | null;
    pr_suite: RunSummaryRaw[] | RunSummaryRaw | null;
  };
  second_opinion?: { faithful: boolean; reason: string };
  research?: { queries: string[]; sources: { title: string; url: string }[] };
  /** Set when the first writer produced no valid test and the check retried once. */
  writer_first?: { attempts: number; reason: string; submissions?: Submission[] };
  verdict?: Verdict;
  reason?: string;
  seconds?: number;
  tokens?: Record<string, { total_tokens?: number }> | null;
  events?: ReceiptEvent[];
  source?: {
    repo: string;
    pr_number: number;
    head_sha: string;
    url?: string;
    title?: string | null;
    linked_issue?: number | null;
  };
}

export interface RunResponse {
  status: RunStatus;
  evidence: Evidence;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      /* keep the generic message */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

const enc = encodeURIComponent;
// Credentials on every call: the session cookie belongs to the API's origin.
const get = <T,>(path: string) => fetch(`${API_URL}${path}`, { credentials: "include" }).then(json<T>);
const send = <T,>(method: "POST" | "PUT", path: string, body?: unknown) =>
  fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(json<T>);

export const api = {
  instances: () => get<InstanceSummary[]>("/api/instances"),
  instance: (id: string) => get<InstanceDetail>(`/api/instances/${enc(id)}`),
  me: () => get<Me>("/api/me"),
  myRuns: (limit = 12, cursor?: string) =>
    get<{ runs: RunSummary[]; next_cursor: string | null }>(
      `/api/runs?limit=${limit}${cursor ? `&cursor=${enc(cursor)}` : ""}`,
    ),
  run: (id: string) => get<RunResponse>(`/api/runs/${enc(id)}`),
  cancelRun: (id: string) => send<{ ok: boolean }>("POST", `/api/runs/${enc(id)}/cancel`),
  githubStatus: () => get<GitHubStatus>("/api/github/status"),
  syncInstallations: () => send<{ installations: Installation[] }>("POST", "/api/github/installations/sync"),
  repos: () => get<{ repos: Repo[] }>("/api/github/repos"),
  setAutoCheck: (repoId: number, enabled: boolean) =>
    send<{ auto_check: boolean }>("PUT", `/api/github/repos/${repoId}/auto-check`, { enabled }),
  pulls: (fullName: string) => get<{ repo: Repo; pulls: PullSummary[] }>(`/api/github/repos/${fullName}/pulls`),
  checkPull: (fullName: string, number: number) =>
    send<{ run_id: string }>("POST", `/api/github/repos/${fullName}/pulls/${number}/check`),
  start: (body: { instance_id: string; pr: PrKind; diff?: string }) => send<{ run_id: string }>("POST", "/api/runs", body),
};

/** Every event a check emits: EventSource drops a type that has no listener. */
export const EVENT_TYPES = [
  "status",
  "claim",
  "env_ready",
  "research",
  "writer_progress",
  "writer_submit",
  "writer_retry",
  "test_accepted",
  "fork",
  "suite",
  "second_opinion",
  "verdict",
  "error",
  "done",
];

/**
 * Stream a run's events. The server replays the whole backlog on every (re)connect, so the list is
 * rebuilt from scratch on open: `onEvents` always receives the complete, de-duplicated sequence.
 */
export function subscribe(runId: string, onEvents: (events: ReceiptEvent[]) => void): () => void {
  const source = new EventSource(`${API_URL}/api/runs/${enc(runId)}/events`); // public: no cookies needed
  let events: ReceiptEvent[] = [];
  source.onopen = () => {
    events = [];
  };
  for (const type of EVENT_TYPES) {
    source.addEventListener(type, (message) => {
      events = [...events, { type, data: JSON.parse((message as MessageEvent).data) }];
      onEvents(events);
      if (type === "done") source.close(); // otherwise EventSource reconnects forever
    });
  }
  return () => source.close();
}
