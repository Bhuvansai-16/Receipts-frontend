import { ArrowRight, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type DemoInfo } from "../api";
import { RunStatus } from "../components/RecentRuns";
import { demoMessage, groupCases } from "../demo";
import { runLabel, timeAgo } from "../receipt";
import { LiveCheck } from "../site/illustrations";

const KIND_LABEL: Record<string, string> = {
  "real fix": "Real fix",
  "empty patch": "Empty patch",
  "wrong patch": "Wrong patch",
};
// In the demo every pasted diff is one of the hand-written wrong patches.
const DEMO_PR_LABEL: Record<string, string> = { gold: "Real fix", none: "Empty patch", diff: "Wrong patch" };
const LIVE_POLL_MS = 10_000;

export function DemoPage() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<DemoInfo | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const load = useCallback(
    () =>
      api.demo().then(
        (next) => (setInfo(next), setLoadError(undefined)),
        (e: Error) => setLoadError(e.message),
      ),
    [],
  );

  useEffect(() => {
    document.title = "Live demo · Receipts";
    void load();
  }, [load]);

  // While someone's check runs, look again now and then so the buttons come back when it ends.
  useEffect(() => {
    if (!info?.live) return;
    const timer = setInterval(() => !document.hidden && load(), LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [info?.live, load]);

  async function run(caseId: string) {
    setStarting(caseId);
    setError(undefined);
    try {
      const { run_id } = await api.startDemo(caseId);
      navigate(`/runs/${encodeURIComponent(run_id)}`);
    } catch (e) {
      setError(demoMessage(e));
      setStarting(null);
      void load();
    }
  }

  const usedUp = info !== null && info.left_today === 0 && !info.live;
  const blocked = starting !== null || !!info?.live || usedUp;

  return (
    <article className="doc-page doc-page--wide demo-page">
      <header className="doc-page__head doc-page__head--art">
        <div>
          <h1 className="display-1">Watch a live check</h1>
          <p className="section-lead">
            Pick a pull request below. Receipts writes the missing test from the issue alone, runs it in Nebius
            sandboxes before and after the change, and prints the receipt as it goes. No account needed; a check takes
            a few minutes.
          </p>
        </div>
        <div className="doc-page__art">
          <LiveCheck />
        </div>
      </header>

      {info?.live && (
        <p className="demo-banner" role="status">
          <span className="pulse" aria-hidden="true" />
          <span>One demo check runs at a time, and one is running now.</span>
          <Link to={`/runs/${encodeURIComponent(info.live)}`} className="text-link">
            Watch it
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      )}
      {usedUp && (
        <p className="demo-banner" role="status">
          Today's demo checks are used up. The finished receipts below show real runs.
        </p>
      )}
      {error && (
        <p className="demo-error" role="alert">
          {error}
        </p>
      )}
      {loadError && (
        <p className="demo-error" role="alert">
          Couldn't load the demo: {loadError}
        </p>
      )}

      {info === null && !loadError && (
        <div aria-hidden="true" className="demo-skeleton">
          {[80, 64, 72].map((w) => (
            <span key={w} className="skeleton" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {info && (
        <div className="demo-issues">
          {groupCases(info.cases).map((issue) => (
            <section key={issue.instance_id} className="demo-issue" aria-labelledby={`issue-${issue.instance_id}`}>
              <header>
                <p className="demo-issue__repo">{issue.repo}</p>
                <h2 id={`issue-${issue.instance_id}`} className="demo-issue__title">
                  {issue.title}
                </h2>
              </header>
              <ul className="demo-cases">
                {issue.cases.map((c) => (
                  <li key={c.id} className="demo-case">
                    <div className="demo-case__text">
                      <h3>{KIND_LABEL[c.kind] ?? c.kind}</h3>
                      <p>{c.summary}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={blocked}
                      aria-describedby={`issue-${issue.instance_id}`}
                      onClick={() => run(c.id)}
                    >
                      <Play size={15} aria-hidden="true" />
                      {starting === c.id ? "Starting…" : "Run this check"}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {info && info.gallery.length > 0 && (
        <section className="demo-gallery" aria-labelledby="gallery-title">
          <h2 id="gallery-title" className="section-title">
            Finished demo receipts
          </h2>
          <ol className="runs">
            {info.gallery.map((run) => (
              <li key={run.id}>
                <Link to={`/runs/${encodeURIComponent(run.id)}`} className="run-row">
                  <span className="run-row__id" title={runLabel(run).full}>
                    <span className="run-row__name">{runLabel(run).name}</span> {runLabel(run).number}
                  </span>
                  <span className="run-row__meta">
                    {DEMO_PR_LABEL[run.pr] ?? run.pr} · {timeAgo(run.started_at)}
                  </span>
                  <span className="run-row__status">
                    <RunStatus run={run} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="demo-foot">
        {info && !usedUp ? `${info.left_today} demo checks left today. ` : ""}
        <Link to="/signup" className="text-link">
          Sign up to check your own pull requests
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </p>
    </article>
  );
}
