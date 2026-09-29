import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../api";
import { authErrorMessage, safeNext } from "../authFlow";
import { loadAuth, useSession } from "../session";

const GITHUB_MARK =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

export function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, refresh } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(
    params.get("error") === "oauth" ? "GitHub sign-in didn't finish. Try again." : undefined,
  );
  const signup = mode === "signup";

  useEffect(() => {
    document.title = `${signup ? "Create your account" : "Sign in"} · Receipts`;
  }, [signup]);

  if (user) return <Navigate to={next} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const authClient = await loadAuth();
      const result = signup
        ? await authClient.signUp.email({ name: name.trim() || email.split("@")[0], email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message ?? "");
      if (await refresh()) return navigate(next, { replace: true });
      // Signed up, but the project requires a confirmed email before the first sign-in.
      setError("Check your inbox to confirm your email address, then sign in.");
    } catch (err) {
      setError(authErrorMessage(err));
    }
    setBusy(false);
  }

  async function github() {
    setBusy(true);
    setError(undefined);
    try {
      // Neon sends the browser back to the API, which finishes sign-in and forwards to `next` (receipts/auth.py).
      await (await loadAuth()).signIn.social({
        provider: "github",
        callbackURL: `${API_URL}/api/auth/complete?next=${encodeURIComponent(window.location.origin + next)}`,
        errorCallbackURL: `${window.location.origin}/signin?error=oauth`,
      });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  const switchTo = `${signup ? "/signin" : "/signup"}${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="auth">
      <h1 className="page-title">{signup ? "Create your account" : "Sign in"}</h1>
      <p className="lead">{signup ? "Check pull requests and keep every receipt." : "Welcome back."}</p>
      <div className="auth-card">
        <button type="button" className="btn btn--github btn--block" onClick={github} disabled={busy}>
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d={GITHUB_MARK} />
          </svg>
          Continue with GitHub
        </button>
        <p className="divider">or with email</p>
        <form className="form form--tight" onSubmit={submit}>
          {signup && (
            <div className="field">
              <label className="label" htmlFor="name">
                Name
              </label>
              <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              required
              minLength={8}
              aria-describedby={signup ? "password-hint" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {signup && (
              <p id="password-hint" className="hint">
                At least 8 characters.
              </p>
            )}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
      <p className="hint auth-switch">
        {signup ? "Already have an account? " : "New to Receipts? "}
        <Link to={switchTo}>{signup ? "Sign in" : "Create an account"}</Link>
      </p>
    </div>
  );
}
