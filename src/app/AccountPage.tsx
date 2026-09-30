import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Usage } from "../api";
import { authErrorMessage } from "../authFlow";
import { loadAuth, useSession } from "../session";
import { connectGitHub } from "./github";
import { Avatar, displayName } from "./ProfileMenu";

const PROVIDERS: { id: string; label: string }[] = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
  { id: "credential", label: "Email and password" },
];

export function AccountPage() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [linked, setLinked] = useState<Set<string> | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    document.title = "Account · Receipts";
    api.me().then((me) => setUsage(me.usage), () => undefined);
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
        <p className="lead">Your profile, today's checks, and how you sign in.</p>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="panel profile-card" aria-labelledby="profile-title">
        <Avatar user={user} size={56} />
        <div>
          <h2 id="profile-title" className="panel__title">
            {displayName(user)}
          </h2>
          <p>{user?.email}</p>
        </div>
      </section>
      <section className="panel" aria-labelledby="usage-title">
        <h2 id="usage-title" className="panel__title">
          Usage
        </h2>
        {usage ? (
          <dl className="usage-grid">
            <div>
              <dt>Checks left today</dt>
              <dd>
                {Math.max(0, usage.per_day - usage.today)} <span>of {usage.per_day}</span>
              </dd>
            </div>
            <div>
              <dt>Running now</dt>
              <dd>
                {usage.active} <span>of {usage.max_active} at a time</span>
              </dd>
            </div>
          </dl>
        ) : (
          <span className="skeleton" style={{ width: "50%", margin: "18px 0 4px" }} aria-hidden="true" />
        )}
        <p className="hint usage-note">The daily count covers the last 24 hours, so it frees up as older checks age out.</p>
      </section>
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
