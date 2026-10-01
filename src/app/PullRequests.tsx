import { ChevronLeft, ExternalLink, GitPullRequest } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type PullSummary, type Repo } from "../api";
import { VerdictChip } from "../components/VerdictChip";
import { timeAgo } from "../receipt";

export function PullRequests() {
  const { owner = "", repo: name = "" } = useParams();
  const fullName = `${owner}/${name}`;
  const navigate = useNavigate();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [pulls, setPulls] = useState<PullSummary[] | null>(null);
  const [error, setError] = useState<string>();
  const [starting, setStarting] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${fullName} · Receipts`;
    api.pulls(fullName).then(
      (r) => (setRepo(r.repo), setPulls(r.pulls)),
      (e: Error) => (setError(e.message), setPulls([])),
    );
  }, [fullName]);

  // While a check is running on any PR here, refresh the list so its verdict appears without a reload.
  const running = pulls?.some((p) => p.latest?.status === "queued" || p.latest?.status === "running") ?? false;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (!document.hidden) api.pulls(fullName).then((r) => setPulls(r.pulls), () => undefined);
    }, 8000);
    return () => clearInterval(timer);
  }, [running, fullName]);

  async function check(pr: PullSummary) {
    setStarting(pr.number);
    setError(undefined);
    try {
      const { run_id } = await api.checkPull(fullName, pr.number);
      navigate(`/app/runs/${encodeURIComponent(run_id)}`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  }

  return (
    <div className="app-page">
      <Link to="/app/repos" className="crumb">
        <ChevronLeft size={16} aria-hidden="true" />
        Repositories
      </Link>
      <header className="app-page__head app-page__head--row">
        <div>
          <h1 className="page-title">{fullName}</h1>
          <p className="lead">Open pull requests, with the latest receipt for each.</p>
        </div>
        {repo && (
          <a href={repo.url} target="_blank" rel="noreferrer" className="btn btn--quiet btn--sm">
            On GitHub
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {pulls === null ? (
        <div className="panel" aria-hidden="true">
          {[76, 60, 70].map((w) => (
            <span key={w} className="skeleton" style={{ width: `${w}%`, margin: "18px 0" }} />
          ))}
        </div>
      ) : pulls.length === 0 ? (
        !error && (
          <div className="empty-state">
            <GitPullRequest size={28} aria-hidden="true" />
            <h2>No open pull requests</h2>
            <p>When someone opens one, it shows up here. With Auto-check on, it gets checked by itself.</p>
          </div>
        )
      ) : (
        <ul className="pr-list">
          {pulls.map((pr) => {
            const running = pr.latest?.status === "queued" || pr.latest?.status === "running";
            return (
              <li key={pr.number} className="pr">
                <div className="pr__main">
                  <a href={pr.url} target="_blank" rel="noreferrer" className="pr__title">
                    {pr.title}
                  </a>
                  <p className="pr__meta">
                    #{pr.number}
                    {pr.author ? ` by ${pr.author}` : ""}
                    {pr.updated_at ? `, updated ${timeAgo(pr.updated_at)}` : ""}
                    {pr.draft ? ", draft" : ""}
                  </p>
                  <p className="pr__claim">
                    {pr.linked_issue ? `Claim from issue #${pr.linked_issue}` : "No linked issue: the claim comes from the description"}
                  </p>
                </div>
                <div className="pr__side">
                  {pr.latest && (
                    <Link to={`/app/runs/${encodeURIComponent(pr.latest.id)}`} className="pr__latest">
                      {pr.latest.verdict ? (
                        <VerdictChip verdict={pr.latest.verdict} />
                      ) : (
                        <span className="status">
                          {running && <span className="pulse" aria-hidden="true" />}
                          {running ? "Checking" : "Failed to run"}
                        </span>
                      )}
                    </Link>
                  )}
                  {running ? (
                    <Link to={`/app/runs/${encodeURIComponent(pr.latest!.id)}`} className="btn btn--quiet btn--sm">
                      Watch it run
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => check(pr)}
                      disabled={starting !== null}
                    >
                      {starting === pr.number ? "Starting…" : pr.latest ? "Check again" : "Check this PR"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
