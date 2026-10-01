import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Usage } from "../api";
import { useSession } from "../session";
import { Avatar, displayName } from "./ProfileMenu";

export function AccountPage() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    document.title = "Account · Receipts";
    api.me().then((me) => setUsage(me.usage), () => undefined);
  }, []);

  return (
    <div className="app-page">
      <header className="app-page__head">
        <h1 className="page-title">Account</h1>
      </header>
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
      <section className="panel panel__head" aria-labelledby="session-title">
        <h2 id="session-title" className="panel__title">
          Session
        </h2>
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => signOut().then(() => navigate("/"))}>
          Sign out
        </button>
      </section>
    </div>
  );
}
