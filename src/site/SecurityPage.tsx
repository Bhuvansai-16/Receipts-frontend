import { useEffect } from "react";

const PERMISSIONS = [
  { name: "Metadata", access: "Read", why: "List the repositories you chose. Required by GitHub." },
  { name: "Contents", access: "Read", why: "Download the code at the commit the pull request starts from." },
  { name: "Pull requests", access: "Read", why: "Read the title, description and the change itself." },
  { name: "Issues", access: "Read", why: "Read the issue a pull request says it fixes." },
  { name: "Checks", access: "Read and write", why: "Show the verdict as a check on the pull request." },
];

export function SecurityPage() {
  useEffect(() => {
    document.title = "Security · Receipts";
  }, []);

  return (
    <article className="doc-page">
      <header className="doc-page__head">
        <h1 className="display-1">Security</h1>
        <p className="section-lead">What Receipts can see, where your code runs, and what it keeps.</p>
      </header>

      <section className="doc-section">
        <h2>The test writer is blind</h2>
        <p>
          The agent that writes the test gets the issue text and a copy of the repository as it was before the change,
          with its git history removed. It never sees the pull request's diff. Its web search is limited to
          documentation sites, never code hosts, so it can't look the fix up either.
        </p>
      </section>

      <section className="doc-section">
        <h2>Code runs in Nebius sandboxes</h2>
        <p>
          Every run starts from a clean copy in a Nebius Token Factory sandbox and is thrown away afterwards. The
          repository is downloaded by the Receipts server and copied in as a file, so no GitHub token, API key or
          other secret is ever inside a sandbox where pull request code runs.
        </p>
      </section>

      <section className="doc-section">
        <h2>GitHub permissions</h2>
        <p>
          Receipts is a GitHub App. You choose which repositories it can see, and it asks for read access plus the
          right to post one check. It can't push code, merge, or comment.
        </p>
        <div className="table-wrap">
          <table className="perm-table">
            <caption className="visually-hidden">Permissions the Receipts GitHub App requests</caption>
            <thead>
              <tr>
                <th scope="col">Permission</th>
                <th scope="col">Access</th>
                <th scope="col">Why</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.name}>
                  <th scope="row">{p.name}</th>
                  <td>{p.access}</td>
                  <td>{p.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc-section">
        <h2>Tokens and sign-in</h2>
        <ul className="doc-list">
          <li>Sign-in runs through Neon Auth. Session cookies are HttpOnly, Secure and SameSite=Lax.</li>
          <li>Your GitHub token stays on the server and is only used to confirm which installations are yours.</li>
          <li>Repository access uses GitHub App tokens that expire within an hour, limited to one repository per call.</li>
          <li>GitHub events are accepted only with a valid signature from the app's webhook secret.</li>
        </ul>
      </section>

      <section className="doc-section">
        <h2>What Receipts keeps</h2>
        <p>
          For each check: the verdict, the test that was written, each run's result and output, and the commands the
          test writer ran. Anyone with a receipt's link can open it, so share links the way you would share a CI log.
          Your code is never stored in the Receipts database; the sandbox environment built for a commit is kept only
          so the next check on that commit starts faster.
        </p>
      </section>
    </article>
  );
}
