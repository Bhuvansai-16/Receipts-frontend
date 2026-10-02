import { useEffect } from "react";
import { Link } from "react-router-dom";
import results from "../eval-results.json";
import { percent, repoRows } from "./results";

const RESULTS_MD = "https://github.com/Bhuvansai-16/Receipts-backend/blob/main/eval/RESULTS.md";

const r = results.receipts;
const d = results.reader;
const COMPARE = [
  { label: "Wrong patches passed as fixes", receipts: r.false_proven, reader: d.false_accept },
  { label: "Wrong patches caught", receipts: r.caught, reader: d.rejected_wrong },
  { label: "Real fixes confirmed", receipts: r.proven_fix, reader: d.accepted_fix },
  { label: "Real fixes rejected", receipts: r.false_refuted, reader: d.false_reject },
  { label: "No answer (Unproven or unsure)", receipts: r.unproven, reader: d.unsure },
];

// a miss is a wrong patch Proven, or a correct one Refuted or flagged as a Regression
const verdictName = (v: string | null) =>
  v === "PROVEN" ? "Proved" : v === "REFUTED" ? "Refuted" : "Flagged a regression in";

export function ResultsPage() {
  useEffect(() => {
    document.title = "Results · Receipts";
  }, []);
  const dataset = (results.links as { dataset?: string }).dataset;

  return (
    <article className="doc-page doc-page--wide">
      <header className="doc-page__head">
        <h1 className="display-1">Results</h1>
        <p className="section-lead">
          Receipts checked {results.cases} patches for {results.issues} SWE-bench Verified issues: each issue's real
          fix, an empty change, and patches from published coding agents. SWE-bench's hidden tests say which patches
          really fix the issue. Receipts never sees them.
        </p>
      </header>

      <div className="sec-grid">
        <section className="sec-card sec-card--wide">
          <h2>Running a test vs reading the diff</h2>
          <p>
            The same patches went to Nemotron Ultra with the issue and the diff, asked whether the patch fixes it. Reading
            alone passed {percent(d.false_accept)} of the wrong patches; Receipts passed {percent(r.false_proven)}, because
            a test has to fail before the change and pass after it. When the runs can't settle it, Receipts answers
            Unproven instead of guessing.
          </p>
          <div className="table-wrap">
            <table className="perm-table">
              <caption className="visually-hidden">Receipts compared with a model reading the diff</caption>
              <thead>
                <tr>
                  <th scope="col">Out of the patches</th>
                  <th scope="col" className="num">Receipts</th>
                  <th scope="col" className="num">Reading the diff</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className="num">{percent(row.receipts)}</td>
                    <td className="num">{percent(row.reader)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="results-note">
            ${results.cost_usd.total.toFixed(2)} for all checks at Token Factory list prices, $
            {results.cost_usd.median.toFixed(3)} median per check, {Math.round(results.seconds_median)} s median. Checks
            of the same issue reuse its blind test.
          </p>
        </section>

        <section className="sec-card sec-card--wide">
          <h2>What the eval changed</h2>
          <p>The numbers above are the baseline. Each fix below came from its misses and was measured where it applies.</p>
          <ul className="doc-list">
            {results.changes.map((c) => (
              <li key={c.commit}>
                <strong>{c.change}.</strong> Before: {c.before}. After: {c.after}. Measured: {c.measured}.
              </li>
            ))}
          </ul>
          <p className="results-note">{results.note}</p>
        </section>

        <section className="sec-card sec-card--wide">
          <h2>Per repository</h2>
          <div className="table-wrap">
            <table className="perm-table">
              <caption className="visually-hidden">Receipts results per repository</caption>
              <thead>
                <tr>
                  <th scope="col">Repository</th>
                  <th scope="col" className="num">Patches</th>
                  <th scope="col" className="num">Wrong caught</th>
                  <th scope="col" className="num">Wrong passed</th>
                  <th scope="col" className="num">Fixes confirmed</th>
                  <th scope="col" className="num">Fixes rejected</th>
                </tr>
              </thead>
              <tbody>
                {repoRows(results.per_repo).map((row) => (
                  <tr key={row.repo}>
                    <th scope="row">{row.repo}</th>
                    <td className="num">{row.cases}</td>
                    <td className="num">{percent(row.caught)}</td>
                    <td className="num">{percent(row.false_proven)}</td>
                    <td className="num">{percent(row.proven_fix)}</td>
                    <td className="num">{percent(row.false_refuted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sec-card sec-card--wide">
          <h2>Every miss</h2>
          <p>Each one links to its receipt: the blind test, every run and the reason.</p>
          <ul className="doc-list">
            {results.misses.map((m) => (
              <li key={m.run_id}>
                <Link to={`/runs/${m.run_id}`}>{m.instance_id}</Link>: {verdictName(m.verdict)}{" "}
                {m.kind === "gold" ? "the real fix" : `${m.agent}'s ${m.fixed ? "correct" : "wrong"} patch`}
              </li>
            ))}
          </ul>
        </section>

        <section className="sec-card sec-card--wide">
          <h2>How it was measured</h2>
          <ul className="doc-list">
            <li>
              {results.issues} issues from SWE-bench Verified, at most 6 per repository. Each has its real fix, an empty
              change, one agent patch SWE-bench marks resolved and two it marks unresolved.
            </li>
            <li>Labels come from SWE-bench's hidden tests. Receipts gets only the issue text and the patch.</li>
            <li>Every check ran the full pipeline in Nebius Token Factory sandboxes, as a LangSmith experiment.</li>
            <li>
              Full write-up: <a href={RESULTS_MD}>eval/RESULTS.md</a>
              {dataset ? (
                <>
                  . Every row, score and trace: <a href={dataset}>the public LangSmith dataset</a>.
                </>
              ) : (
                "."
              )}
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
