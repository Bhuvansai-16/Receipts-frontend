import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type GitHubStatus, type Me, type Repo } from "../api";
import { authErrorMessage } from "../authFlow";
import { RecentRuns } from "../components/RecentRuns";
import { checklist, nextStep, type StepId } from "./checklist";
import { connectGitHub } from "./github";

const COPY: Record<StepId, { title: string; text: string }> = {
  connect: { title: "Connect GitHub", text: "Link your GitHub account so Receipts can see where its app is installed." },
  install: { title: "Add repositories", text: "Install the Receipts app on the repositories you want checked. You pick which ones." },
  check: { title: "Check your first pull request", text: "Open a repository, pick an open pull request and press Check this PR." },
};

export function Overview() {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [prChecks, setPrChecks] = useState(0);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Overview · Receipts";
    api.me().then(setMe, () => undefined);
    api.githubStatus().then(setStatus, (e: Error) => setError(e.message));
    api.myRuns(50).then((page) => setPrChecks(page.runs.filter((r) => r.pr === "github").length), () => undefined);
  }, []);

  const steps = status
    ? checklist({ githubLinked: status.github_linked, installations: status.installations.length, prChecks })
    : null;
  const next = steps ? nextStep(steps) : null;
  const setUp = steps !== null && next === null;
  const firstName = me?.name?.split(" ")[0] || me?.email?.split("@")[0];

  async function connect() {
    setBusy(true);
    try {
      await connectGitHub("/app");
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  function action(id: StepId, primary: boolean) {
    const cls = `btn ${primary ? "btn--primary" : "btn--quiet"} btn--sm`;
    if (id === "connect")
      return (
        <button type="button" className={cls} onClick={connect} disabled={busy}>
          Connect GitHub
        </button>
      );
    if (id === "install")
      return status?.install_url ? (
        <a className={cls} href={status.install_url}>
          Add repositories
        </a>
      ) : (
        <span className="hint">Adding repositories is unavailable right now.</span>
      );
    return (
      <Link className={cls} to="/app/repos">
        Pick a pull request
      </Link>
    );
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <h1 className="page-title">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
        <p className="lead">
          {steps === null ? (
            "\u00a0" // keeps the line's height while GitHub status loads, without flashing the wrong copy
          ) : !setUp ? (
            "Three steps to your first receipt on a real pull request."
          ) : me ? (
            <>
              You're set up. <strong>{Math.max(0, me.usage.per_day - me.usage.today)}</strong> of {me.usage.per_day}{" "}
              checks left today.
            </>
          ) : (
            "You're set up."
          )}
        </p>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="overview">
        {setUp ? (
          <section className="panel">
            <RecentRuns limit={8} />
            <Link to="/app/receipts" className="text-link">
              All receipts
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <section aria-labelledby="setup-title" className="panel">
            <h2 id="setup-title" className="panel__title">
              Get set up
            </h2>
            {!steps ? (
              <div aria-hidden="true">
                {[70, 60, 66].map((w) => (
                  <span key={w} className="skeleton" style={{ width: `${w}%`, margin: "18px 0" }} />
                ))}
              </div>
            ) : (
              <ol className="checklist">
                {steps.map((s, i) => (
                  <li key={s.id} className={`checklist__item${s.done ? " is-done" : ""}${s.id === next ? " is-next" : ""}`}>
                    <span className="checklist__mark" aria-hidden="true">
                      {s.done ? <Check size={16} strokeWidth={3} /> : i + 1}
                    </span>
                    <div className="checklist__body">
                      <h3>
                        {COPY[s.id].title}
                        {s.done && <span className="visually-hidden"> (done)</span>}
                      </h3>
                      <p>{COPY[s.id].text}</p>
                    </div>
                    {!s.done && <div className="checklist__action">{action(s.id, s.id === next)}</div>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        <aside className="overview__side">
          {setUp && <RepoShortcuts />}
          <section className="panel panel--tint" aria-labelledby="demo-title">
            <h2 id="demo-title" className="panel__title">
              No repository handy?
            </h2>
            <p>Run a check on a real bug from SWE-bench Verified, with its real fix or a do-nothing change.</p>
            <Link to="/app/demo" className="text-link">
              Try a demo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
          {!setUp && (
            <section className="panel">
              <RecentRuns limit={5} />
              <Link to="/app/receipts" className="text-link">
                All receipts
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Once set up, the quickest way back to a repository's pull requests. */
function RepoShortcuts() {
  const [repos, setRepos] = useState<Repo[] | null>(null);

  useEffect(() => {
    api.repos().then((r) => setRepos(r.repos), () => setRepos([]));
  }, []);

  return (
    <section className="panel" aria-labelledby="repos-title">
      <h2 id="repos-title" className="panel__title">
        Your repositories
      </h2>
      {repos === null ? (
        <div aria-hidden="true" style={{ marginTop: 18 }}>
          {[70, 56].map((w) => (
            <span key={w} className="skeleton" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : repos.length === 0 ? (
        <p className="empty">GitHub didn't list any repositories. Refresh on the Repositories page.</p>
      ) : (
        <ol className="runs">
          {repos.slice(0, 5).map((repo) => (
            <li key={repo.id}>
              <Link to={`/app/repos/${repo.full_name}`} className="run-row">
                <span className="run-row__id">{repo.full_name}</span>
                <span className="run-row__meta">{repo.auto_check ? "Auto-check on" : "Check pull requests by hand"}</span>
                <span className="run-row__status">
                  <ChevronRight size={18} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <Link to="/app/repos" className="text-link">
        {repos && repos.length > 5 ? `All ${repos.length} repositories` : "Manage repositories"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
