import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type RunSummary } from "../api";
import { PR_LABEL, runLabel, timeAgo } from "../receipt";
import { VerdictChip } from "./VerdictChip";

const POLL_MS = 5000;

export function RecentRuns({ limit = 12 }: { limit?: number }) {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string>();

  const load = useCallback(
    () =>
      api.myRuns(limit).then(
        (page) => (setRuns(page.runs), setError(undefined)),
        (e: Error) => setError(e.message),
      ),
    [limit],
  );

  useEffect(() => {
    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  // Poll only while one of your checks is still going; the ETag makes an unchanged list a cheap 304.
  const active = runs?.some((run) => run.status === "queued" || run.status === "running") ?? false;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => !document.hidden && load(), POLL_MS);
    return () => clearInterval(timer);
  }, [active, load]);

  return (
    <section aria-labelledby="recent-title">
      <h2 id="recent-title" className="section-title">
        Your receipts
      </h2>

      {error && runs === null && (
        <p className="empty" role="alert">
          Couldn't load receipts: {error}
        </p>
      )}

      {runs === null && !error && (
        <div aria-hidden="true" style={{ marginTop: 20 }}>
          {[80, 64, 72].map((w) => (
            <span key={w} className="skeleton" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {runs?.length === 0 && <p className="empty">No receipts yet. Your checks will show up here, live.</p>}

      {runs && runs.length > 0 && (
        <ol className="runs">
          {runs.map((run) => (
            <li key={run.id}>
              <Link to={`/app/runs/${encodeURIComponent(run.id)}`} className="run-row">
                <span className="run-row__id" title={runLabel(run).full}>
                  <span className="run-row__name">{runLabel(run).name}</span> {runLabel(run).number}
                </span>
                <span className="run-row__meta">
                  {PR_LABEL[run.pr] ?? run.pr} · {timeAgo(run.started_at)}
                </span>
                <span className="run-row__status">
                  <RunStatus run={run} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function RunStatus({ run }: { run: RunSummary }) {
  if (run.verdict) return <VerdictChip verdict={run.verdict} />;
  if (run.status === "error") return <span className="status">Failed to run</span>;
  return (
    <span className="status">
      <span className="pulse" aria-hidden="true" />
      {run.status === "queued" ? "Queued" : "Running"}
    </span>
  );
}
