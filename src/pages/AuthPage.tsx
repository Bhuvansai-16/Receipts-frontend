import { Eye, EyeOff, KeyRound, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../api";
import { authErrorMessage, needsEmailCode, safeNext, socialCallbacks } from "../authFlow";
import { useRouteFocus } from "../components/useRouteFocus";
import { loadAuth, useSession } from "../session";
import "../site/site.css";
import { AuthShowcase } from "./AuthShowcase";

const GITHUB_MARK =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

/** Split sign-in screen: the form on the left, the product at work on the right (hidden on phones). */
function AuthFrame({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  useRouteFocus(main);
  return (
    <div className="authsplit">
      <main id="content" ref={main} tabIndex={-1} className="authsplit__main">
        <div className="authsplit__col">
          <Link to="/" className="brand authsplit__brand" aria-label="Receipts home">
            <span className="brand__dot" aria-hidden="true" />
            Receipts
          </Link>
          {children}
        </div>
      </main>
      <AuthShowcase />
    </div>
  );
}

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
  const [notice, setNotice] = useState<string | undefined>(
    params.get("confirmed") ? "Email confirmed. Sign in to continue." : undefined,
  );
  // Set while an account waits for the code that confirms its email address.
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const signup = mode === "signup";

  useEffect(() => {
    document.title = `${codeFor ? "Confirm your email" : signup ? "Create your account" : "Sign in"} · Receipts`;
  }, [signup, codeFor]);

  if (user) return <Navigate to={next} replace />;

  async function sendCode(address: string) {
    await (await loadAuth()).emailOtp.sendVerificationOtp({ email: address, type: "email-verification" });
    setCodeFor(address);
    setCode("");
    setNotice(`We sent a 6-digit code to ${address}. It can take a minute to arrive.`);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const authClient = await loadAuth();
      const result = signup
        ? await authClient.signUp.email({ name: name.trim() || email.split("@")[0], email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message ?? "");
      if (await refresh()) return navigate(next, { replace: true });
      // Sign-up returns no session token when the project wants a confirmed email first.
      if ((result.data as { token?: string | null } | null)?.token === null) await sendCode(email);
      else setError("You're signed in, but this browser didn't keep the session. Try again.");
    } catch (err) {
      try {
        if (needsEmailCode(err)) await sendCode(email);
        else setError(authErrorMessage(err));
      } catch (sendErr) {
        setError(authErrorMessage(sendErr));
      }
    }
    setBusy(false);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!codeFor) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await (await loadAuth()).emailOtp.verifyEmail({ email: codeFor, otp: code });
      if (result.error) throw new Error(result.error.message ?? "");
      if (await refresh()) return navigate(next, { replace: true });
      // The project doesn't sign people in after confirming: send them to sign in.
      return navigate(`/signin?confirmed=1${next !== "/app" ? `&next=${encodeURIComponent(next)}` : ""}`, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    }
    setBusy(false);
  }

  async function resend() {
    if (!codeFor) return;
    setBusy(true);
    setError(undefined);
    try {
      await sendCode(codeFor);
    } catch (err) {
      setError(authErrorMessage(err));
    }
    setBusy(false);
  }

  async function social(provider: "github" | "google") {
    setBusy(true);
    setError(undefined);
    try {
      await (await loadAuth()).signIn.social({ provider, ...socialCallbacks(next, window.location.origin, API_URL) });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  const switchTo = `${signup ? "/signin" : "/signup"}${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`;

  if (codeFor)
    return (
      <AuthFrame>
        <h1 className="authsplit__title">Check your email</h1>
        <p className="authsplit__lead">Enter the 6-digit code we sent to {codeFor} to finish.</p>
        <form className="authsplit__form" onSubmit={verify}>
          {notice && (
            <p className="hint" role="status">
              {notice}
            </p>
          )}
          <div className="field">
            <label className="label" htmlFor="code">
              Verification code
            </label>
            <div className="input-icon">
              <KeyRound size={18} aria-hidden="true" />
              <input
                id="code"
                className="input input--code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--block btn--tall" disabled={busy || code.length < 6}>
            {busy ? "One moment…" : "Confirm email"}
          </button>
        </form>
        <p className="authsplit__switch">
          No email?{" "}
          <button type="button" className="link-btn" onClick={resend} disabled={busy}>
            Send a new code
          </button>
        </p>
      </AuthFrame>
    );

  return (
    <AuthFrame>
      <h1 className="authsplit__title">{signup ? "Welcome to Receipts" : "Welcome back"}</h1>
      <p className="authsplit__lead">
        {signup
          ? "Sign up to check pull requests with evidence, not opinions."
          : "Sign in to check pull requests and see your receipts."}
      </p>
      <div className="authsplit__social">
        <button type="button" className="btn btn--github btn--block btn--tall" onClick={() => social("google")} disabled={busy}>
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {signup ? "Sign up with Google" : "Sign in with Google"}
        </button>
        <button type="button" className="btn btn--github btn--block btn--tall" onClick={() => social("github")} disabled={busy}>
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d={GITHUB_MARK} />
          </svg>
          {signup ? "Sign up with GitHub" : "Sign in with GitHub"}
        </button>
      </div>
      <p className="authsplit__or">or</p>
      <form className="authsplit__form" onSubmit={submit}>
        {notice && (
          <p className="hint" role="status">
            {notice}
          </p>
        )}
        {signup && (
          <div className="field">
            <label className="label" htmlFor="name">
              Full name
            </label>
            <div className="input-icon">
              <UserRound size={18} aria-hidden="true" />
              <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="email">
            Email address
          </label>
          <div className="input-icon">
            <Mail size={18} aria-hidden="true" />
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
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="input-icon">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              id="password"
              className="input input--toggle"
              type={showPassword ? "text" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              required
              minLength={8}
              aria-describedby={signup ? "password-hint" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="input-icon__toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
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
        <button type="submit" className="btn btn--primary btn--block btn--tall" disabled={busy}>
          {busy ? "One moment…" : "Continue"}
        </button>
      </form>
      <p className="authsplit__switch">
        {signup ? "Already have an account? " : "New to Receipts? "}
        <Link to={switchTo}>{signup ? "Sign in" : "Create an account"}</Link>
      </p>
      <p className="authsplit__fine">
        Receipts only reads the repositories you pick. <Link to="/security">How we keep your code safe</Link>
      </p>
    </AuthFrame>
  );
}
