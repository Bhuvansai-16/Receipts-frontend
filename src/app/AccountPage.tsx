import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authErrorMessage } from "../authFlow";
import { loadAuth, useSession } from "../session";
import { connectGitHub } from "./github";

const PROVIDERS: { id: string; label: string }[] = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
  { id: "credential", label: "Email and password" },
];

export function AccountPage() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [linked, setLinked] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    document.title = "Account · Receipts";
    loadAuth()
      .then((auth) => auth.listAccounts())
      .then(({ data }) => setLinked(new Set((data ?? []).map((a: { providerId: string }) => a.providerId))))
      .catch((e) => (setError(authErrorMessage(e)), setLinked(new Set())));
  }, []);

  async function connect() {
    try {
      await connectGitHub("/app/account");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <h1 className="page-title">Account</h1>
        <p className="lead">{user?.email}</p>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="panel" aria-labelledby="accounts-title">
        <h2 id="accounts-title" className="panel__title">
          Ways to sign in
        </h2>
        <ul className="accounts">
          {PROVIDERS.map((p) => (
            <li key={p.id}>
              <span>{p.label}</span>
              {linked === null ? (
                <span className="skeleton" style={{ width: 90 }} aria-hidden="true" />
              ) : linked.has(p.id) ? (
                <span className="accounts__on">
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                  Connected
                </span>
              ) : p.id === "github" ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={connect}>
                  Connect GitHub
                </button>
              ) : (
                <span className="hint">Not connected</span>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="panel" aria-labelledby="session-title">
        <h2 id="session-title" className="panel__title">
          Session
        </h2>
        <p className="hint">Signing out ends this browser's session.</p>
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => signOut().then(() => navigate("/"))}>
          Sign out
        </button>
      </section>
    </div>
  );
}
