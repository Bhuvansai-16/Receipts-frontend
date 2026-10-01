import { Check, ChevronLeft, CircleDashed, ExternalLink, Link2, RotateCcw, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { EvidenceDetails } from "../components/EvidenceDetails";
import { ReceiptCard } from "../components/ReceiptCard";
import { VerdictChip, verdictLabel } from "../components/VerdictChip";
import { formatDuration, receiptTitle, safeHref, timeAgo } from "../receipt";
import { explainVerdict } from "../run/explain";
import { progressSteps, type StepState } from "../run/progress";
import { reveal, useRun } from "../run/useRun";

const STEP_ICON: Record<StepState, typeof Check> = {
  done: Check,
  active: CircleDashed,
  waiting: CircleDashed,
  skipped: CircleDashed,
  failed: X,
};

export function AppRunPage() {
  const { runId = "" } = useParams();
  const navigate = useNavigate();
  const { res, receipt, live, queued, elapsed, missing, error } = useRun(runId);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string>();

  const ev = res?.evidence;
  const source = ev?.source;
  const title = source?.title || (source ? `PR #${source.pr_number}` : ev ? `Demo check: ${receiptTitle(ev).label}` : "Check");
  const progress = receipt ? progressSteps(receipt, live, queued) : null;
  const current = progress?.steps.find((s) => s.state === "active");

  useEffect(() => {
    if (!receipt) return;
    document.title = receipt.verdict
      ? `${verdictLabel(receipt.verdict.verdict)} · ${title} · Receipts`
      : live
        ? `Checking ${progress?.done ?? 0}/7 · ${title} · Receipts`
        : `${title} · Receipts`;
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/runs/${encodeURIComponent(runId)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Couldn't copy. The share link is this page's address without /app.");
    }
  }

  async function stop() {
    setBusy(true);
    setActionError(undefined);
    try {
      await api.cancelRun(runId);
    } catch (e) {
      setActionError((e as Error).message);
    }
    setBusy(false);
  }

  async function checkAgain() {
    if (!source) return navigate("/app/demo");
    setBusy(true);
    setActionError(undefined);
    try {
      const { run_id } = await api.checkPull(source.repo, source.pr_number);
      navigate(`/app/runs/${encodeURIComponent(run_id)}`);
    } catch (e) {
      setActionError((e as Error).message);
    }
    setBusy(false);
  }

  if (missing)
    return (
      <div className="app-page">
        <div className="empty-state">
          <h1 className="page-title">No receipt with that id</h1>
          <p>It may have been removed, or the link is incomplete.</p>
          <Link to="/app/receipts" className="btn btn--primary">
            Your receipts
          </Link>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="app-page">
        <p className="error" role="alert">
          Couldn't load this check: {error}
        </p>
      </div>
    );

  if (!res || !receipt || !progress)
    return (
      <div className="app-page" aria-busy="true">
        <span className="skeleton" style={{ width: "40%", height: 28 }} />
        <span className="skeleton" style={{ width: "70%", marginTop: 16 }} />
      </div>
    );

  const explanation = live ? null : explainVerdict(receipt, res.evidence);
  const [owner, repoName] = (source?.repo ?? "").split("/");

  return (
    <div className="app-page runpage">
      {source ? (
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/app/repos">Repositories</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/app/repos/${owner}/${repoName}`}>{source.repo}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">PR #{source.pr_number}</span>
        </nav>
      ) : (
        <Link to="/app/demo" className="crumb">
          <ChevronLeft size={16} aria-hidden="true" />
          Try a demo
        </Link>
      )}

      <header className="runpage__head">
        <div className="runpage__title">
          <h1 className="page-title">{title}</h1>
          <p className="runpage__meta">
            {receiptTitle(res.evidence).repo}
            {source ? ` · PR #${source.pr_number}` : ""}
            {source?.linked_issue ? ` · claim from issue #${source.linked_issue}` : ""}
            {ev?.started_at ? ` · started ${timeAgo(ev.started_at)}` : ""}
          </p>
        </div>
        <div className="runpage__actions">
          {live ? (
            <span className="status status--live" role="status">
              <span className="pulse" aria-hidden="true" />
              {queued ? "Waiting for a sandbox" : `Checking, step ${Math.min(progress.done + 1, 7)} of 7`}
            </span>
          ) : receipt.verdict ? (
            <VerdictChip verdict={receipt.verdict.verdict} size="lg" />
          ) : (
            <span className="status">Stopped</span>
          )}
          {safeHref(source?.url) && (
            <a href={safeHref(source?.url)} target="_blank" rel="noreferrer" className="btn btn--quiet btn--sm">
              <ExternalLink size={14} aria-hidden="true" />
              Open PR
            </a>
          )}
          <button type="button" className="btn btn--quiet btn--sm" onClick={copyLink}>
            <Link2 size={14} aria-hidden="true" />
            {copied ? "Link copied" : "Share"}
          </button>
          {live ? (
            <button type="button" className="btn btn--quiet btn--sm btn--danger" onClick={stop} disabled={busy}>
              <Square size={13} aria-hidden="true" />
              {busy ? "Stopping…" : "Stop"}
            </button>
          ) : (
            <button type="button" className="btn btn--primary btn--sm" onClick={checkAgain} disabled={busy}>
              <RotateCcw size={14} aria-hidden="true" />
              {busy ? "Starting…" : source ? "Check again" : "Run another"}
            </button>
          )}
        </div>
      </header>
      {actionError && (
        <p className="error" role="alert">
          {actionError}
        </p>
      )}

      <div className="runpage__grid">
        <ReceiptCard
          receipt={receipt}
          evidence={res.evidence}
          live={live}
          queued={queued}
          elapsed={elapsed}
          onReveal={reveal}
          heading="h2"
          actions={false}
        />

        <aside className="runpage__side">
          {explanation && (
            <section className={`explain explain--${explanation.tone}`} aria-labelledby="explain-title">
              <h2 id="explain-title" className="explain__title">
                {explanation.headline}
              </h2>
              <p>{explanation.body}</p>
              {explanation.detail && <pre className="explain__detail">{explanation.detail}</pre>}
              {explanation.next && <p className="explain__next">{explanation.next}</p>}
              {receipt.verdict && source && (
                <p className="explain__meta">The result is also on the pull request as a Receipts check.</p>
              )}
            </section>
          )}

          {/* Only while it runs: a finished receipt already shows every step. */}
          {live && (
            <section className="panel progress" aria-labelledby="progress-title">
              <div className="progress__head">
                <h2 id="progress-title" className="panel__title">
                  Progress
                </h2>
                <span className="progress__count">
                  {progress.done} of {progress.total} steps
                </span>
              </div>
              <div
                className="progress__bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.done}
                aria-label="Steps done"
              >
                <span style={{ width: `${Math.max(4, (progress.done / progress.total) * 100)}%` }} />
              </div>
              <p className="progress__now" aria-live="polite">
                {queued ? "Waiting for a free sandbox." : current ? `${current.label}…` : "Finishing up…"}
                {elapsed !== null && <span> {formatDuration(elapsed)} so far</span>}
              </p>
              <ol className="steps-list">
                {progress.steps.map((s) => {
                  const Icon = STEP_ICON[s.state];
                  return (
                    <li key={s.id} className={`steps-list__item is-${s.state}`}>
                      <span className="steps-list__icon" aria-hidden="true">
                        <Icon size={14} strokeWidth={2.75} />
                      </span>
                      <span className="steps-list__label">{s.label}</span>
                      <span className="steps-list__detail">
                        {s.detail ?? (s.state === "active" ? "in progress" : "")}
                      </span>
                      <span className="visually-hidden">({s.state})</span>
                    </li>
                  );
                })}
              </ol>
              <p className="hint progress__note">
                Usually 2 to 5 minutes. You can leave this page: the check keeps running
                {source ? " and its result appears on the pull request." : "."}
              </p>
            </section>
          )}
        </aside>
      </div>

      {!live && <EvidenceDetails evidence={res.evidence} runId={runId} />}
    </div>
  );
}
