import { ExternalLink, Lock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type GitHubStatus, type Repo } from "../api";
import { authErrorMessage } from "../authFlow";
import { timeAgo } from "../receipt";
import { connectGitHub } from "./github";

export function Repositories() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string | undefined>(
    params.get("error") === "github" ? "GitHub didn't confirm the installation. Try Refresh, or add the app again." : undefined,
  );
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(undefined);
    try {
      const s = await api.githubStatus();
      setStatus(s);
      setRepos(s.app_configured && s.installations.length ? (await api.repos()).repos : []);
    } catch (e) {
      setError((e as Error).message);
      setRepos([]);
    }
  }, []);

  useEffect(() => {
    document.title = "Repositories · Receipts";
    void load();
  }, [load]);

  async function refresh() {
    setBusy(true);
    try {
      await api.syncInstallations();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function toggle(repo: Repo) {
    const enabled = !repo.auto_check;
    setRepos((rs) => rs?.map((r) => (r.id === repo.id ? { ...r, auto_check: enabled } : r)) ?? rs);
    try {
      await api.setAutoCheck(repo.id, enabled);
    } catch (e) {
      setRepos((rs) => rs?.map((r) => (r.id === repo.id ? { ...r, auto_check: !enabled } : r)) ?? rs);
      setError((e as Error).message);
    }
  }

  async function connect() {
    try {
      await connectGitHub("/app/repos");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  const installUrl = status?.install_url;

  return (
    <div className="app-page">
      <header className="app-page__head app-page__head--row">
        <div>
          <h1 className="page-title">Repositories</h1>
          <p className="lead">The repositories the Receipts app can see. Open one to check its pull requests.</p>
        </div>
        {status?.github_linked && installUrl && (
          <div className="app-page__actions">
            <button type="button" className="btn btn--quiet btn--sm" onClick={refresh} disabled={busy}>
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <a className="btn btn--primary btn--sm" href={installUrl}>
              Add repositories
            </a>
          </div>
        )}
      </header>

      {params.get("installed") && !error && (
        <p className="notice" role="status">
          The Receipts app is installed. Your repositories are below.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {repos === null ? (
        <div className="panel" aria-hidden="true">
          {[80, 64, 72].map((w) => (
            <span key={w} className="skeleton" style={{ width: `${w}%`, margin: "18px 0" }} />
          ))}
        </div>
      ) : status && !status.app_configured ? (
        <div className="empty-state">
          <h2>The GitHub App isn't set up yet</h2>
          <p>Whoever runs this Receipts server needs to register the GitHub App (see the backend README).</p>
        </div>
      ) : status && !status.github_linked ? (
        <div className="empty-state">
          <h2>Connect GitHub first</h2>
          <p>Link your GitHub account, then choose which repositories Receipts may check.</p>
          <button type="button" className="btn btn--primary" onClick={connect}>
            Connect GitHub
          </button>
        </div>
      ) : repos.length === 0 ? (
        <div className="empty-state">
          <h2>No repositories yet</h2>
          <p>Install the Receipts app on GitHub and pick the repositories it may check. You come straight back here.</p>
          {installUrl && (
            <a className="btn btn--primary" href={installUrl}>
              Add repositories
            </a>
          )}
          <button type="button" className="link-btn" onClick={refresh} disabled={busy}>
            Already installed? Refresh
          </button>
        </div>
      ) : (
        <ul className="repo-list">
          {repos.map((repo) => (
            <li key={repo.id} className="repo">
              <div className="repo__main">
                <Link to={`/app/repos/${repo.full_name}`} className="repo__name">
                  {repo.full_name}
                </Link>
                {repo.private && (
                  <span className="tag">
                    <Lock size={12} aria-hidden="true" />
                    Private
                  </span>
                )}
                {repo.description && <p className="repo__desc">{repo.description}</p>}
                <p className="repo__meta">
                  {[repo.language, repo.pushed_at ? `updated ${timeAgo(repo.pushed_at)}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="repo__side">
                <label className="switch">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={repo.auto_check}
                    onChange={() => toggle(repo)}
                    aria-describedby="auto-check-hint"
                  />
                  <span className="switch__track" aria-hidden="true" />
                  <span>Auto-check</span>
                </label>
                <a href={repo.url} target="_blank" rel="noreferrer" className="icon-link" aria-label={`${repo.full_name} on GitHub`}>
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {repos && repos.length > 0 && (
        <p id="auto-check-hint" className="hint app-hint">
          Auto-check runs a check whenever a pull request is opened or updated. Each check counts toward your daily limit.
        </p>
      )}
    </div>
  );
}
