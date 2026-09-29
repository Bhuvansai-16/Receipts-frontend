import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { Evidence, Verdict } from "../api";
import { ReceiptCard } from "../components/ReceiptCard";
import { VerdictChip } from "../components/VerdictChip";
import example from "../example-receipt.json";
import { fromEvidence } from "../receipt";
import { useSession } from "../session";
import { HeroPrinter, ShieldLock, StepIssue, StepReceipt, StepSandbox } from "./illustrations";

// A real PROVEN run, bundled so the landing page needs no API call.
const EXAMPLE = example as unknown as Evidence;
const EXAMPLE_RECEIPT = fromEvidence(EXAMPLE);
const EXAMPLE_LINK = `/runs/${encodeURIComponent(EXAMPLE.run_id ?? "")}`;

const VERDICTS: { verdict: Verdict; text: string }[] = [
  { verdict: "PROVEN", text: "The test fails before the change and passes after it, three times each. Review it first." },
  { verdict: "REFUTED", text: "The change doesn't fix what the issue describes: the test still fails the same way." },
  { verdict: "REGRESSION", text: "It fixes the issue but breaks tests that passed before. Look at those first." },
  { verdict: "UNPROVEN", text: "Not enough evidence either way. This says nothing against the pull request." },
  { verdict: "NO_CHECKABLE_CLAIM", text: "The pull request doesn't claim to fix a bug, so there's nothing to test." },
];

const TRUST = [
  { title: "Blind by construction", text: "The test writer reads the issue and the original code. It never sees the change it will judge." },
  { title: "Repeated, not lucky", text: "Every verdict needs three identical runs on each side. Flaky results end as Unproven." },
  { title: "Isolated sandboxes", text: "Code runs in fresh Nebius sandboxes. No token or secret ever goes inside." },
  { title: "A second opinion", text: "Before a pull request is called Refuted, a larger model checks the test matches the issue." },
];

export function HomePage() {
  const { user } = useSession();
  const start = user ? { to: "/app", label: "Open app" } : { to: "/signup", label: "Get started" };

  useEffect(() => {
    document.title = "Receipts · Proof that a pull request does what it claims";
  }, []);

  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="pill">Proof for pull requests</p>
          <h1 id="hero-title" className="hero__title">
            Every pull request makes a claim. <span className="hero__accent">Get the receipt.</span>
          </h1>
          <p className="hero__lead">
            Receipts writes the missing test from the issue, runs it before and after the change, and shows the
            evidence.
          </p>
          <div className="hero__ctas">
            <Link to={start.to} className="btn btn--primary btn--lg">
              {start.label}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to={EXAMPLE_LINK} className="btn btn--quiet btn--lg">
              See an example
            </Link>
          </div>
        </div>
        <div className="hero__art">
          <HeroPrinter />
        </div>
      </section>

      <section className="home-section" aria-labelledby="how-title">
        <h2 id="how-title" className="display-2">
          From issue to evidence in about five minutes
        </h2>
        <div className="bento">
          <article className="bento__cell bento__cell--tall bento__cell--honey">
            <StepIssue />
            <h3>Write the test the pull request forgot</h3>
            <p>An agent reads only the issue, never the change, and writes a test that fails on today's code.</p>
          </article>
          <article className="bento__cell bento__cell--white">
            <div className="bento__row">
              <div>
                <h3>Run it where nothing leaks</h3>
                <p>Three runs on the original code, three with the pull request, each in a fresh sandbox.</p>
              </div>
              <StepSandbox />
            </div>
          </article>
          <article className="bento__cell bento__cell--grey">
            <div className="bento__row">
              <div>
                <h3>Get a receipt, not an opinion</h3>
                <p>A verdict with the test and every run's output, and a check on the pull request.</p>
              </div>
              <StepReceipt />
            </div>
          </article>
        </div>
        <Link to="/how-it-works" className="text-link">
          See every step
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <section className="home-section verdicts" aria-labelledby="verdicts-title">
        <div className="verdicts__intro">
          <h2 id="verdicts-title" className="display-2">
            Five verdicts, one rule
          </h2>
          <p className="section-lead">
            Anything uncertain is Unproven. Receipts never calls a pull request broken on a guess.
          </p>
        </div>
        <ul className="verdict-list">
          {VERDICTS.map((v) => (
            <li key={v.verdict}>
              <VerdictChip verdict={v.verdict} />
              <p>{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section trust" aria-labelledby="trust-title">
        <div className="trust__art">
          <ShieldLock />
        </div>
        <div>
          <h2 id="trust-title" className="display-2">
            Built so you can trust a green check
          </h2>
          <dl className="trust__grid">
            {TRUST.map((t) => (
              <div key={t.title}>
                <dt>{t.title}</dt>
                <dd>{t.text}</dd>
              </div>
            ))}
          </dl>
          <Link to="/security" className="text-link">
            How Receipts keeps your code safe
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="home-section example" aria-labelledby="example-title">
        <div className="example__copy">
          <h2 id="example-title" className="display-2">
            A real receipt
          </h2>
          <p className="section-lead">
            A fix to xarray's merge, checked end to end: 4 test attempts, 6 sandbox runs, 32 existing tests.
          </p>
          <Link to={EXAMPLE_LINK} className="text-link">
            Open the full receipt
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ReceiptCard
          receipt={EXAMPLE_RECEIPT}
          evidence={EXAMPLE}
          live={false}
          queued={false}
          elapsed={null}
          onReveal={() => undefined}
          heading="h3"
          actions={false}
        />
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <h2 id="cta-title" className="display-2">
          Check your next pull request
        </h2>
        <p>Connect GitHub, pick a repository, and get a receipt on your next pull request.</p>
        <Link to={start.to} className="btn btn--primary btn--lg">
          {start.label}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
