import { FlaskConical, FolderGit2, LayoutDashboard, ReceiptText } from "lucide-react";
import { useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useRouteFocus } from "../components/useRouteFocus";
import "./app.css";
import { ProfileMenu } from "./ProfileMenu";

// Account lives in the profile menu at the foot of the sidebar (the last tab on phones).
const NAV = [
  { to: "/app", label: "Overview", Icon: LayoutDashboard, end: true },
  { to: "/app/repos", label: "Repositories", Icon: FolderGit2, end: false },
  { to: "/app/receipts", label: "Receipts", Icon: ReceiptText, end: false },
  { to: "/app/demo", label: "Try a demo", Icon: FlaskConical, end: false },
];

export function AppLayout() {
  const main = useRef<HTMLElement>(null);
  useRouteFocus(main);

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
        <ProfileMenu />
      </aside>
      <main id="content" ref={main} tabIndex={-1} className="appshell__main">
        <Outlet />
      </main>
    </div>
  );
}
