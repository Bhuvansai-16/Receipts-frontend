import { useEffect } from "react";
import { Link } from "react-router-dom";

const TOC = [
  { id: "getting-started", label: "Getting started" },
  { id: "connect-github", label: "Connect GitHub" },
  { id: "check-a-pr", label: "Check a pull request" },
  { id: "auto-check", label: "Auto-check" },
  { id: "verdicts", label: "Verdicts" },
  { id: "limits", label: "Limits" },
  { id: "faq", label: "FAQ" },
];

const FAQ = [
  {
    q: "Which repositories work?",
    a: "Python projects tested with pytest. Receipts installs the project with pip in a fresh sandbox; if that fails, the verdict is Unproven with the reason.",
  },
  {
    q: "Where does the claim come from?",
    a: "From the issue the pull request links with a closing keyword such as \"Fixes #12\". Without one, the pull request's title and description are used.",
  },
  {
    q: "Why was my pull request Unproven?",
    a: "The receipt always says why: no test reproduced the bug, the runs disagreed, the change didn't apply, or the environment couldn't be set up. Unproven is never a judgment against the change.",
  },
  {
    q: "Can I try it without GitHub?",
    a: "Yes. The live demo runs a real check without an account. Signed in, Try a demo lets you pick any SWE-bench Verified issue and check its real fix, a do-nothing change or your own diff.",
  },
];

export function DocsPage() {
  useEffect(() => {
    document.title = "Docs · Receipts";
  }, []);

  return (
    <div className="docs">
      <nav className="docs__toc" aria-label="On this page">
        <p className="docs__toc-title">On this page</p>
        <ul>
          {TOC.map((t) => (
            <li key={t.id}>
              <a href={`#${t.id}`}>{t.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <article className="doc-page doc-page--docs">
        <header className="doc-page__head">
          <h1 className="display-1">Docs</h1>
          <p className="section-lead">Everything you need to check your first pull request.</p>
        </header>

        <section id="getting-started" className="doc-section">
          <h2>Getting started</h2>
          <ol className="doc-list doc-list--numbered">
            <li>
              <Link to="/signup">Create an account</Link> with Google, GitHub or email.
            </li>
            <li>Connect GitHub, then add the Receipts app to the repositories you want checked.</li>
            <li>Open a repository in the app and press Check this PR on an open pull request.</li>
          </ol>
        </section>

        <section id="connect-github" className="doc-section">
          <h2>Connect GitHub</h2>
          <p>
            If you signed in with GitHub you're already connected. With Google or email, use Connect GitHub on the
            Overview page. Then Add repositories takes you to GitHub, where you pick which repositories the Receipts
            app can see. You can change that list on GitHub at any time.
          </p>
        </section>

        <section id="check-a-pr" className="doc-section">
          <h2>Check a pull request</h2>
          <p>
            Pull requests shows each open pull request with its linked issue and latest receipt. Check this PR starts
            a check; the receipt prints live, and the pull request on GitHub gets a check named Receipts that links
            back to it.
          </p>
        </section>

        <section id="auto-check" className="doc-section">
          <h2>Auto-check</h2>
          <p>
            Turn on Auto-check for a repository and every pull request that is opened or updated gets checked on its
            own, once per commit. It is off by default because each check uses model and sandbox time.
          </p>
        </section>

        <section id="verdicts" className="doc-section">
          <h2>Verdicts</h2>
          <dl className="doc-dl">
            <dt>Proven</dt>
            <dd>The test fails on the original code and passes with the change, three times each, and existing tests hold.</dd>
            <dt>Refuted</dt>
            <dd>The test still fails with the change, the same way as before, and a second model agrees the test is fair.</dd>
            <dt>Regression</dt>
            <dd>The claim holds but tests that passed before now fail.</dd>
            <dt>Unproven</dt>
            <dd>Not enough evidence either way. Anything uncertain ends here.</dd>
            <dt>No checkable claim</dt>
            <dd>The pull request doesn't claim to fix a bug.</dd>
          </dl>
        </section>

        <section id="limits" className="doc-section">
          <h2>Limits</h2>
          <p>Each account can run 2 checks at a time and 20 checks in any 24 hours. A check usually takes two to five minutes.</p>
        </section>

        <section id="faq" className="doc-section">
          <h2>FAQ</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
