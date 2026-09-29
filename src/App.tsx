import type { ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { NewCheckPage } from "./pages/NewCheck";
import { RunPage } from "./pages/RunPage";
import { SessionProvider, useSession } from "./session";
import { DocsPage } from "./site/DocsPage";
import { HomePage } from "./site/HomePage";
import { HowItWorksPage } from "./site/HowItWorksPage";
import { SecurityPage } from "./site/SecurityPage";
import { SiteLayout } from "./site/SiteLayout";

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/signin" element={<AuthPage mode="signin" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/runs/:runId" element={<RunPage />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <NewCheckPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
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

function NotFound() {
  return (
    <div className="not-found">
      <h1 className="page-title">Nothing here</h1>
      <p className="lead">That page doesn't exist.</p>
      <Link to="/" className="btn btn--primary">
        Go to the home page
      </Link>
    </div>
  );
}
