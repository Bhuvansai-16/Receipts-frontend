import { useEffect, useState } from "react";
import { api, type GitHubRepos as Repos } from "../api";
import { timeAgo } from "../receipt";

export function GitHubRepos() {
  const [data, setData] = useState<Repos | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    api.githubRepos().then(setData, (e: Error) => setError(e.message));
  }, []);

  return (
    <section aria-labelledby="repos-title" className="repos">
      <h2 id="repos-title" className="section-title">
        Your GitHub repositories
      </h2>

      {error && (
        <p className="empty" role="alert">
          Couldn't load your repositories: {error}
        </p>
      )}

      {!data && !error && (
        <div aria-hidden="true" style={{ marginTop: 20 }}>
          {[72, 58, 66].map((w) => (
            <span key={w} className="skeleton" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {data && !data.connected && (
        <p className="empty">Sign in with GitHub to see your repositories here.</p>
      )}

      {data?.connected && data.repos.length === 0 && <p className="empty">No public repositories on your account yet.</p>}

      {data?.connected && data.repos.length > 0 && (
        <>
          <ol className="runs">
            {data.repos.map((repo) => (
              <li key={repo.full_name}>
                <a href={repo.url} className="run-row" target="_blank" rel="noreferrer">
                  <span className="run-row__id">{repo.full_name}</span>
                  <span className="run-row__meta">
                    {[repo.language, `${repo.stars} star${repo.stars === 1 ? "" : "s"}`, `pushed ${timeAgo(repo.pushed_at)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="run-row__status status">{repo.private ? "Private" : "Public"}</span>
                  <span className="visually-hidden"> (opens on GitHub)</span>
                </a>
              </li>
            ))}
          </ol>
          <p className="hint repos__note">
            Public repositories from your GitHub sign-in. Checking their pull requests comes with the Receipts GitHub
            App.
          </p>
        </>
      )}
    </section>
  );
}
