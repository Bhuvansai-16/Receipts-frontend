import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { Verdict } from "../api";
import { VerdictChip } from "../components/VerdictChip";
import races from "../races.json";
import { rankPatches, readerAgrees, receiptsAgree, totalCost } from "./results";

const ISSUES = [...races].sort((a, b) => a.instance_id.localeCompare(b.instance_id));
const ALL = ISSUES.flatMap((r) => r.patches);
const CHECKED = ALL.filter((p) => p.verdict); // one check never finished
const count = (xs: (boolean | null)[], v: boolean | null) => xs.filter((x) => x === v).length;
const READER = { fixed: "fixed", not_fixed: "not fixed", unsure: "unsure" } as Record<string, string>;
const usd = (x: number) => (x < 0.001 ? "under $0.001" : `$${x.toFixed(3)}`);

export function RacesPage() {
  useEffect(() => {
    document.title = "Races · Receipts";
  }, []);
  const agree = CHECKED.map(receiptsAgree);
  const readerAgree = ALL.map(readerAgrees);

  return (
    <article className="doc-page doc-page--wide">
      <header className="doc-page__head">
        <h1 className="display-1">Races</h1>
        <p className="section-lead">
          {ISSUES.length} SWE-bench Verified issues, five patches each: the real fix, an empty patch and three
          published coding agents' patches. Receipts writes one blind test per issue and runs every patch against it;
          Nemotron Ultra reads only the diff; SWE-bench's hidden tests give the answer.
        </p>
      </header>

      <div className="sec-grid">
        <section className="sec-card sec-card--wide">
          <h2>All races</h2>
          <p>
            Of the {CHECKED.length} checks that ran, Receipts matched SWE-bench on {count(agree, true)}, contradicted
            it on {count(agree, false)} and answered Unproven on {count(agree, null)}. Reading the diff of all{" "}
            {ALL.length} matched on {count(readerAgree, true)} and contradicted it on {count(readerAgree, false)}.{" "}
            <Link to="/results">How this was measured</Link>.
          </p>
          <ul className="race-index">
            {ISSUES.map((r) => (
              <li key={r.instance_id}>
                <a href={`#${r.instance_id}`}>{r.instance_id}</a>
              </li>
            ))}
          </ul>
        </section>

        {ISSUES.map((race) => {
          const agreed = count(race.patches.map(receiptsAgree), true);
          const readerAgreed = count(race.patches.map(readerAgrees), true);
          return (
            <section key={race.instance_id} id={race.instance_id} className="sec-card sec-card--wide race">
              <h2>{race.title}</h2>
              <p className="results-note">
                {race.instance_id} · {race.repo} · Receipts agreed with SWE-bench on {agreed} of 5, the reader on{" "}
                {readerAgreed} of 5
              </p>
              <div className="table-wrap">
                <table className="perm-table">
                  <caption className="visually-hidden">Patches for {race.instance_id}, ranked by Receipts' verdict</caption>
                  <thead>
                    <tr>
                      <th scope="col">Patch</th>
                      <th scope="col">Receipts</th>
                      <th scope="col">SWE-bench</th>
                      <th scope="col">Reading the diff</th>
                      <th scope="col" className="num">Cost</th>
                      <th scope="col">Blind test</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankPatches(race.patches).map((p) => (
                      <tr key={p.run_id}>
                        <th scope="row">{p.name}</th>
                        <td>
                          {p.verdict ? (
                            <Link to={`/runs/${p.run_id}`}>
                              <VerdictChip verdict={p.verdict as Verdict} />
                            </Link>
                          ) : (
                            "not run"
                          )}
                        </td>
                        <td>{p.fixed ? "fixes it" : "doesn't fix it"}</td>
                        <td>{(p.reader && READER[p.reader]) ?? "no answer"}</td>
                        <td className="num">{p.verdict ? usd(p.cost_usd ?? 0) : ""}</td>
                        <td>{p.verdict ? (p.reused ? "reused" : "written") : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="results-note">Total: {usd(totalCost(race.patches))}.</p>
            </section>
          );
        })}
      </div>
    </article>
  );
}
