import { ArrowRight, Check, CircleHelp, FlaskConical, GitPullRequest, LockKeyhole, MessageSquare, MousePointerClick, X, Zap } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { Evidence, Verdict } from "../api";
import { ReceiptCard } from "../components/ReceiptCard";
import { VerdictChip } from "../components/VerdictChip";
import example from "../example-receipt.json";
import { fromEvidence } from "../receipt";
import { useSession } from "../session";
import { HeroPrinter, StepIssue, StepReceipt, StepSandbox } from "./illustrations";

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

const GITHUB_POINTS = [
  { Icon: Zap, title: "Auto-check", text: "Turn it on for a repository and every new pull request gets checked by itself." },
  { Icon: MousePointerClick, title: "Check on demand", text: "Or open a repository in Receipts, pick a pull request and press Check." },
  { Icon: LockKeyhole, title: "Reads, never pushes", text: "The app reads code, issues and pull requests, and writes only its own check." },
];

const FAQ = [
  {
    q: "Does Receipts see my secrets or tokens?",
    a: "No. The server downloads your code and uploads it into a fresh Nebius sandbox; no GitHub token or secret goes inside. The GitHub App can read code, issues and pull requests, and write only its own check.",
  },
  {
    q: "Which repositories work today?",
    a: "Python projects with pytest tests. The sandbox installs the project with pip, so a standard pyproject.toml or setup.py is enough.",
  },
  {
    q: "What if a pull request has no linked issue?",
    a: "Receipts reads the claim from the pull request's title and description instead. If they don't describe a bug being fixed, the verdict is No checkable claim.",
  },
  {
    q: "How long does a check take?",
    a: "Usually two to five minutes: about a minute to set up the environment, a minute or two to write the blind test, then seconds for the six runs.",
  },
  {
    q: "Can a verdict be wrong?",
    a: "Receipts is built to be wrong only in the safe direction. Anything uncertain ends as Unproven, and a second model reviews the test before any pull request is called Refuted. Every receipt shows the test and each run's output, so you can check it yourself.",
  },
  {
    q: "How many checks can I run?",
    a: "Each account can run 20 checks a day, two at a time.",
  },
];

/** Three run results in a row, drawn the way a receipt draws them. */
function Runs({ passed }: { passed: boolean }) {
  const Icon = passed ? Check : X;
  return (
    <span className="tiles" role="img" aria-label={passed ? "Passed in 3 of 3 runs" : "Failed in 3 of 3 runs"}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="tile tile--expected">
          <Icon size={15} strokeWidth={2.75} aria-hidden="true" />
        </span>
      ))}
    </span>
  );
}

export function HomePage() {
  const { user } = useSession();
  const start = user ? { to: "/app", label: "Open app" } : { to: "/signup", label: "Get started" };
  // Signed out, the first thing to do is watch a real check; sign-up comes second.
  const hero = user ? start : { to: "/demo", label: "Watch a live check" };
  const heroSecondary = user ? { to: EXAMPLE_LINK, label: "See an example" } : start;

  useEffect(() => {
    document.title = "Receipts · Proof that a pull request does what it claims";
  }, []);

  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            Every pull request makes a claim. <span className="hero__accent">Get the receipt.</span>
          </h1>
          <p className="hero__lead">
            Receipts writes the missing test from the issue, runs it before and after the change, and shows the
            evidence.
          </p>
          <div className="hero__ctas">
            <Link to={hero.to} className="btn btn--primary btn--lg">
              {hero.label}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to={heroSecondary.to} className="btn btn--quiet btn--lg">
              {heroSecondary.label}
            </Link>
          </div>
        </div>
        <div className="hero__art">
          <HeroPrinter />
        </div>
      </section>

      <section className="home-section" aria-labelledby="why-title">
        <header className="section-head">
          <h2 id="why-title" className="display-2">
            A green CI check isn't proof
          </h2>
          <p className="section-lead">
            Passing tests say a change broke nothing old. They don't say the bug is gone. The same pull request, before
            and after Receipts:
          </p>
        </header>
        <div className="compare">
          <article className="compare__card compare__card--before">
            <p className="compare__tag">Without Receipts</p>
            <div className="mini-pr">
              <GitPullRequest size={18} aria-hidden="true" />
              <div>
                <strong>Fix order of besseli in the airyaiprime rewrite</strong>
                <span>#30 · Fixes #12</span>
              </div>
            </div>
            <p className="compare__line compare__line--ok">
              <Check size={16} strokeWidth={2.75} aria-hidden="true" />
              18 existing tests pass
            </p>
            <p className="compare__line">
              <MessageSquare size={16} aria-hidden="true" />
              "Looks right to me?"
            </p>
            <p className="compare__note">
              <CircleHelp size={16} aria-hidden="true" />
              Nobody has run the case the issue reports.
            </p>
          </article>
          <article className="compare__card compare__card--after">
            <p className="compare__tag">With Receipts</p>
            <ol className="compare__steps">
              <li>
                <FlaskConical size={16} aria-hidden="true" />
                <span>Blind test written from issue #12 alone</span>
              </li>
              <li>
                <span>Fails on the original code</span>
                <Runs passed={false} />
              </li>
              <li>
                <span>Passes with the pull request</span>
                <Runs passed />
              </li>
              <li>
                <span>Existing tests still pass</span>
                <strong>18 of 18</strong>
              </li>
            </ol>
            <div className="compare__verdict">
              <span>Verdict</span>
              <VerdictChip verdict="PROVEN" size="lg" />
            </div>
          </article>
        </div>
      </section>

      <section className="home-section" aria-labelledby="how-title">
        <header className="section-head">
          <h2 id="how-title" className="display-2">
            From issue to evidence in a few minutes
          </h2>
        </header>
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

      <section className="home-section split" aria-labelledby="github-title">
        <div className="split__copy">
          <h2 id="github-title" className="display-2">
            The verdict lands on the pull request
          </h2>
          <p className="section-lead">
            Install the Receipts GitHub App on the repositories you pick. Each check shows up next to your CI, with a
            link to the full receipt.
          </p>
          <ul className="points">
            {GITHUB_POINTS.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="points__icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="checks-mock" aria-hidden="true">
          <p className="checks-mock__title">Checks on receipts-demo-sympy</p>
          <div className="checks-mock__row">
            <span className="checks-mock__dot checks-mock__dot--ok">
              <Check size={14} strokeWidth={3} />
            </span>
            <div>
              <strong>Receipts · PR #30</strong>
              <span>Proven: test fails on base and passes on the PR in 3/3 runs</span>
            </div>
            <span className="checks-mock__link">Details</span>
          </div>
          <div className="checks-mock__row">
            <span className="checks-mock__dot">
              <CircleHelp size={14} strokeWidth={2.5} />
            </span>
            <div>
              <strong>Receipts · PR #29</strong>
              <span>Unproven: PR runs are mixed or fail differently from base</span>
            </div>
            <span className="checks-mock__link">Details</span>
          </div>
          <div className="checks-mock__toggle">
            <span>Auto-check new pull requests</span>
            <span className="checks-mock__switch" />
          </div>
        </div>
      </section>

      <section className="home-section verdicts" aria-labelledby="verdicts-title">
        <div className="verdicts__intro">
          <h2 id="verdicts-title" className="display-2">
            Five verdicts, one rule
          </h2>
          <p className="section-lead">
            Anything uncertain is Unproven. Receipts never calls a pull request broken on a guess.
          </p>
          <Link to="/docs#verdicts" className="text-link">
            How each verdict is decided
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
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

      <section className="home-section example" aria-labelledby="example-title">
        <div className="example__copy">
          <h2 id="example-title" className="display-2">
            A real receipt
          </h2>
          <p className="section-lead">
            A fix to xarray's merge, checked end to end. Read it top to bottom: the claim, the test written blind, three
            runs on each side, and the verdict as the total.
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

      <section className="home-section faq-section" aria-labelledby="faq-title">
        <header className="section-head">
          <h2 id="faq-title" className="display-2">
            Before you connect a repository
          </h2>
        </header>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <h2 id="cta-title" className="display-2">
          Check your next pull request
        </h2>
        <p>Connect GitHub, choose your repositories, and press Check on any open pull request.</p>
        <Link to={start.to} className="btn btn--primary btn--lg">
          {start.label}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
