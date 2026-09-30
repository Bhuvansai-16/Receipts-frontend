import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { EvidenceDetails } from "../components/EvidenceDetails";
import { ReceiptCard } from "../components/ReceiptCard";
import { verdictLabel } from "../components/VerdictChip";
import { reveal, useRun } from "../run/useRun";
import { useSession } from "../session";

/** The public, shareable receipt. Signed-in people get a way into the app's fuller view. */
export function RunPage() {
  const { runId = "" } = useParams();
  const { user } = useSession();
  const { res, receipt, live, queued, elapsed, missing, error } = useRun(runId);
  const instance = res?.evidence.instance_id ?? runId;

  useEffect(() => {
    document.title = receipt?.verdict
      ? `${verdictLabel(receipt.verdict.verdict)} · ${instance} · Receipts`
      : `Checking ${instance} · Receipts`;
  });

  if (missing)
    return (
      <div className="not-found">
        <h1 className="page-title">No receipt with that id</h1>
        <p className="lead">It may have been removed, or the link is incomplete.</p>
        <Link to="/" className="btn btn--primary">
          Go to the home page
        </Link>
      </div>
    );

  if (error)
    return (
      <div className="not-found">
        <h1 className="page-title">Couldn't load this receipt</h1>
        <p className="lead">{error}</p>
        <button type="button" className="btn btn--quiet" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );

  if (!res || !receipt)
    return (
      <div className="run" aria-busy="true">
        <div className="receipt-wrap">
          <div className="receipt" aria-hidden="true">
            {[40, 90, 70, 85, 60].map((w, i) => (
              <span key={i} className="skeleton" style={{ width: `${w}%`, margin: i ? undefined : "0 auto" }} />
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="run">
      {user && (
        <p className="run__app-link">
          <Link to={`/app/runs/${encodeURIComponent(runId)}`} className="btn btn--quiet btn--sm">
            Open in the app for progress and next steps
          </Link>
        </p>
      )}
      <ReceiptCard receipt={receipt} evidence={res.evidence} live={live} queued={queued} elapsed={elapsed} onReveal={reveal} />
      {!live && <EvidenceDetails evidence={res.evidence} runId={runId} />}
    </div>
  );
}
