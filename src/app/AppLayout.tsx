import { CircleUserRound, FlaskConical, FolderGit2, LayoutDashboard, LogOut, ReceiptText } from "lucide-react";
import { useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useRouteFocus } from "../components/useRouteFocus";
import { useSession } from "../session";
import "./app.css";

const NAV = [
  { to: "/app", label: "Overview", Icon: LayoutDashboard, end: true },
  { to: "/app/repos", label: "Repositories", Icon: FolderGit2, end: false },
  { to: "/app/receipts", label: "Receipts", Icon: ReceiptText, end: false },
  { to: "/app/demo", label: "Try a demo", Icon: FlaskConical, end: false },
  { to: "/app/account", label: "Account", Icon: CircleUserRound, end: false },
];

export function AppLayout() {
  const main = useRef<HTMLElement>(null);
  useRouteFocus(main);
  const { user, signOut } = useSession();
  const navigate = useNavigate();

  return (
    <div className="appshell">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="appshell__side">
        <Link to="/" className="brand" aria-label="Receipts home">
          <span className="brand__dot" aria-hidden="true" />
          Receipts
        </Link>
        <nav aria-label="App" className="appnav">
          <ul>
            {NAV.map(({ to, label, Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className="appnav__link">
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="appshell__user">
          <span className="appshell__email" title={user?.email}>
            {user?.email}
          </span>
          <button type="button" className="link-btn appshell__signout" onClick={() => signOut().then(() => navigate("/"))}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
      <main id="content" ref={main} tabIndex={-1} className="appshell__main">
        <Outlet />
      </main>
    </div>
  );
}
