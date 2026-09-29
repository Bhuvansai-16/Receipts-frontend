import { useEffect, useRef, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/Landing";
import { NewCheckPage } from "./pages/NewCheck";
import { RunPage } from "./pages/RunPage";
import { SessionProvider, useSession } from "./session";

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<AuthPage mode="signin" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <NewCheckPage />
                </RequireAuth>
              }
            />
            <Route path="/runs/:runId" element={<RunPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Shell>
      </SessionProvider>
    </BrowserRouter>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <p className="hint" aria-busy="true">
        Checking your session…
      </p>
    );
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useSession();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    // After client-side navigation, move focus to the new page for keyboard and screen reader users.
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand" aria-label="Receipts home">
            <span className="brand__dot" aria-hidden="true" />
            Receipts
          </Link>
          <nav aria-label="Primary" className="topnav">
            {loading ? null : user ? (
              <>
                {pathname !== "/app" && (
                  <Link to="/app" className="btn btn--primary btn--sm">
                    New check
                  </Link>
                )}
                <span className="nav-user" title={user.email}>
                  {user.email}
                </span>
                <button type="button" className="link-btn" onClick={() => signOut().then(() => navigate("/"))}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                {pathname !== "/signin" && (
                  <Link to="/signin" className="link-btn">
                    Sign in
                  </Link>
                )}
                {pathname !== "/signup" && (
                  <Link to="/signup" className="btn btn--primary btn--sm">
                    Get started
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="content" ref={main} tabIndex={-1} className="container main">
        {children}
      </main>
    </>
  );
}

function NotFound() {
  return (
    <div className="not-found">
      <h1 className="page-title">Nothing here</h1>
      <p className="lead">That page doesn't exist.</p>
      <Link to="/app" className="btn btn--primary">
        Check a pull request
      </Link>
    </div>
  );
}
