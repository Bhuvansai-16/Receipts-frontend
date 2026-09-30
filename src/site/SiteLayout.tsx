import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { returnedFromSocialSignIn } from "../authFlow";
import { useRouteFocus } from "../components/useRouteFocus";
import { useSession } from "../session";
import "./site.css";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/security", label: "Security" },
  { to: "/docs", label: "Docs" },
];

export function SiteLayout() {
  const main = useRef<HTMLElement>(null);
  useRouteFocus(main);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();

  useEffect(() => setOpen(false), [pathname]);

  // Signed in by a social provider that landed on a public page: go straight to the app.
  useEffect(() => {
    if (user && returnedFromSocialSignIn(search)) navigate("/app", { replace: true });
  }, [user, search, navigate]);

  const account = loading ? null : user ? (
    <Link to="/app" className="btn btn--primary btn--sm">
      Open app
    </Link>
  ) : (
    <>
      <Link to="/signin" className="sitenav__link sitenav__signin">
        Sign in
      </Link>
      <Link to="/signup" className="btn btn--primary btn--sm">
        Get started
      </Link>
    </>
  );

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
          <nav aria-label="Primary" className="sitenav">
            <ul className="sitenav__links">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} className="sitenav__link">
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sitenav__actions">
            {account}
            <button
              type="button"
              className="sitenav__menu"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="site-menu" className="sitemenu" aria-label="Menu">
            <ul className="container">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to}>{l.label}</NavLink>
                </li>
              ))}
              {!user && (
                <li>
                  <Link to="/signin">Sign in</Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>
      <main id="content" ref={main} tabIndex={-1} className="container main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="sitefooter">
      <div className="container sitefooter__inner">
        <div className="sitefooter__brand">
          <Link to="/" className="brand" aria-label="Receipts home">
            <span className="brand__dot" aria-hidden="true" />
            Receipts
          </Link>
          <p>Evidence, not opinions, for every pull request.</p>
        </div>
        <nav aria-label="Footer" className="sitefooter__cols">
          <div>
            <h2>Product</h2>
            <ul>
              <li>
                <Link to="/how-it-works">How it works</Link>
              </li>
              <li>
                <Link to="/security">Security</Link>
              </li>
              <li>
                <Link to="/docs">Docs</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Account</h2>
            <ul>
              <li>
                <Link to="/signup">Get started</Link>
              </li>
              <li>
                <Link to="/signin">Sign in</Link>
              </li>
              <li>
                <Link to="/runs/pydata__xarray-4629-gold-20260928-201414">Example receipt</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Built with</h2>
            <ul>
              <li>
                <a href="https://nebius.com/token-factory" target="_blank" rel="noreferrer">
                  Nebius Token Factory
                </a>
              </li>
              <li>
                <a href="https://neon.com" target="_blank" rel="noreferrer">
                  Neon
                </a>
              </li>
              <li>
                <a href="https://smith.langchain.com" target="_blank" rel="noreferrer">
                  LangSmith
                </a>
              </li>
              <li>
                <a href="https://tavily.com" target="_blank" rel="noreferrer">
                  Tavily
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="container sitefooter__base">
        <span>© 2026 Receipts</span>
        <span>Built for the Nebius hackathon</span>
      </div>
    </footer>
  );
}
