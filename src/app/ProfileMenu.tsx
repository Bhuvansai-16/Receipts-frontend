import { BookOpen, ChevronsUpDown, House, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, type Usage } from "../api";
import { useSession, type User } from "../session";

export function displayName(user: User | null): string {
  return user?.name?.trim() || user?.email?.split("@")[0] || "You";
}

/** The account's picture from GitHub or Google, or its initials when there is none (or it fails to load). */
export function Avatar({ user, size = 32 }: { user: User | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initials = displayName(user)
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  if (user?.image && !broken)
    return (
      <img
        className="avatar"
        src={user.image}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {initials}
    </span>
  );
}

/** Who is signed in, at the foot of the sidebar; opens account links, today's checks and sign out. */
export function ProfileMenu() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const name = displayName(user);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    api.me().then((me) => setUsage(me.usage), () => undefined);
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="profile" ref={root}>
      <button
        ref={button}
        type="button"
        className="profile__button"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar user={user} />
        <span className="profile__who">
          <strong>{name}</strong>
          <span>{user?.email}</span>
        </span>
        <span className="profile__tab">Account</span>
        <ChevronsUpDown className="profile__chevron" size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="profile__menu" id="profile-menu">
          <div className="profile__head">
            <Avatar user={user} size={40} />
            <span className="profile__who">
              <strong>{name}</strong>
              <span>{user?.email}</span>
            </span>
          </div>
          <p className="profile__usage">
            {usage ? (
              <>
                <strong>{Math.max(0, usage.per_day - usage.today)}</strong> of {usage.per_day} checks left today
              </>
            ) : (
              <span className="skeleton" style={{ width: "70%", margin: 0 }} aria-hidden="true" />
            )}
          </p>
          <ul className="profile__links">
            <li>
              <Link to="/app/account">
                <Settings size={17} aria-hidden="true" />
                Account settings
              </Link>
            </li>
            <li>
              <Link to="/docs">
                <BookOpen size={17} aria-hidden="true" />
                Docs and help
              </Link>
            </li>
            <li>
              <Link to="/">
                <House size={17} aria-hidden="true" />
                Receipts website
              </Link>
            </li>
          </ul>
          <button type="button" className="profile__signout" onClick={() => signOut().then(() => navigate("/"))}>
            <LogOut size={17} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
