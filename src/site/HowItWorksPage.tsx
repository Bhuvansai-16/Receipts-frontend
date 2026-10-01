import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { HowFlow } from "./illustrations";

const STAGES = [
  {
    title: "Read the claim",
    text: "A small model reads the linked issue (or the pull request's description) and decides whether it claims to fix a bug. Three votes, majority wins.",
    line: ["Claim", "bug fix"],
  },
  {
    title: "Prepare the sandbox",
    text: "The repository is downloaded at the commit the pull request starts from and installed in a fresh Nebius sandbox. Nothing secret goes in.",
    line: ["Sandbox", "ready"],
  },
  {
    title: "Write the blind test",
    text: "An agent reads the issue and the original code, never the change, and writes one pytest file that should fail today. It gets five tries.",
    line: ["Blind test", "2 attempts"],
  },
  {
    title: "Run it on the original code",
    text: "Three runs, each in its own sandbox. All three must fail, with an assertion, the same way. Anything else ends as Unproven.",
    line: ["On base, must fail", "x x x"],
  },
  {
    title: "Run it with the pull request",
    text: "The change is applied exactly as written, no fuzzy matching, and the same test runs three more times.",
    line: ["With the PR, must pass", "ok ok ok"],
  },
  {
    title: "Check the existing tests",
    text: "Tests that passed before must still pass. A test only counts as broken if it passes on every original run and fails on every run with the change.",
    line: ["Existing tests", "all 32 still pass"],
  },
  {
    title: "Decide the verdict",
    text: "Deterministic rules turn the runs into Proven, Refuted, Regression or Unproven. A Refuted verdict also needs a second model to agree the test is fair.",
    line: ["Verdict", "PROVEN"],
  },
];

export function HowItWorksPage() {
  useEffect(() => {
    document.title = "How it works · Receipts";
  }, []);

  return (
    <article className="doc-page doc-page--wide">
      <header className="doc-page__head doc-page__head--art">
        <div>
          <h1 className="display-1">How a check works</h1>
          <p className="section-lead">
            Each line of a receipt comes from one stage. Here is what happens behind each of them.
          </p>
        </div>
        <div className="doc-page__art">
          <HowFlow />
        </div>
      </header>
      <ol className="stages">
        {STAGES.map((s) => (
          <li key={s.title} className="stage">
            <div>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </div>
            <p className="stage__line" aria-hidden="true">
              <span>{s.line[0]}</span>
              <span>{s.line[1]}</span>
            </p>
          </li>
        ))}
      </ol>
      <p className="doc-page__next">
        <Link to="/security" className="text-link">
          Next: what keeps it safe
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </p>
    </article>
  );
}
