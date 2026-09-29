import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { Evidence } from "../api";
import { ReceiptCard } from "../components/ReceiptCard";
import example from "../example-receipt.json";
import { fromEvidence } from "../receipt";
import { useSession } from "../session";

// A real PROVEN run, bundled so the landing page needs no API call.
const EXAMPLE = example as unknown as Evidence;
const EXAMPLE_RECEIPT = fromEvidence(EXAMPLE);

const STEPS = [
  { title: "Write the missing test", text: "From the issue alone. The test writer never sees the pull request." },
  {
    title: "Run it before and after",
    text: "Three times on the original code and three times with the change, each in a fresh sandbox.",
  },
  { title: "Get the receipt", text: "Proven, refuted or unproven, with the test and every run's output attached." },
];

export function LandingPage() {
  const { user } = useSession();

  useEffect(() => {
    document.title = "Receipts · Proof that a pull request does what it claims";
  }, []);

  return (
    <>
      <section className="landing" aria-labelledby="hero-title">
        <div>
          <h1 id="hero-title" className="hero-title">
            Every pull request makes a claim. Get the receipt.
          </h1>
          <p className="hero-lead">
            Receipts writes the test a pull request is missing, runs it before and after the change, and shows you
            the evidence. Review what is proven first.
          </p>
          <div className="hero-ctas">
            <Link to={user ? "/app" : "/signup"} className="btn btn--primary">
              {user ? "Check a pull request" : "Get started"}
            </Link>
            <Link to={`/runs/${encodeURIComponent(EXAMPLE.run_id ?? "")}`} className="btn btn--quiet">
              See an example receipt
            </Link>
          </div>
        </div>
        <ReceiptCard
          receipt={EXAMPLE_RECEIPT}
          evidence={EXAMPLE}
          live={false}
          queued={false}
          elapsed={null}
          onReveal={() => undefined}
          heading="h2"
          actions={false}
        />
      </section>

      <section aria-labelledby="how-title" className="how">
        <h2 id="how-title" className="section-title">
          How it works
        </h2>
        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="step-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-text">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
