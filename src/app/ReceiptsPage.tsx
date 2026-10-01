import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type RunSummary } from "../api";
import { RunStatus } from "../components/RecentRuns";
import { PR_LABEL, runLabel, timeAgo } from "../receipt";

const PAGE = 20;

export function ReceiptsPage() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function load(after?: string) {
    setLoading(true);
    try {
      const page = await api.myRuns(PAGE, after);
      setRuns((rs) => [...(after ? (rs ?? []) : []), ...page.runs]);
      setCursor(page.next_cursor);
    } catch (e) {
      setError((e as Error).message);
      setRuns((rs) => rs ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    document.title = "Your receipts · Receipts";
    void load();
  }, []);

  return (
    <div className="app-page">
      <header className="app-page__head">
        <h1 className="page-title">Receipts</h1>
        <p className="lead">Every check you started, newest first. Each receipt has a link you can share.</p>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {runs === null ? (
        <div className="panel" aria-hidden="true">
          {[80, 64, 72, 58].map((w) => (
            <span key={w} className="skeleton" style={{ width: `${w}%`, margin: "18px 0" }} />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="empty-state">
          <h2>No receipts yet</h2>
          <p>Check a pull request from Repositories, or try a demo on a real SWE-bench bug.</p>
          <div className="empty-state__actions">
            <Link to="/app/repos" className="btn btn--primary">
              Go to repositories
            </Link>
            <Link to="/app/demo" className="btn btn--quiet">
              Try a demo
            </Link>
          </div>
        </div>
      ) : (
        <div className="panel panel--flush">
          <ol className="runs runs--page">
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
          {cursor && (
            <button type="button" className="btn btn--quiet btn--block" onClick={() => load(cursor)} disabled={loading}>
              {loading ? "Loading…" : "Show older receipts"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
