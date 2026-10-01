# Receipts UI

React front end for Receipts: landing page, sign-up and sign-in (email and password, or GitHub), the check
form with your receipts, and public receipt pages. It talks only to the Receipts API (`receipts-backend`),
which handles sign-in through Neon Auth and stores runs in Neon Postgres.

## Develop

```bash
npm install
cp .env.example .env    # VITE_API_URL: where the API runs (default http://localhost:8000)
npm run dev             # http://localhost:5173
npm test                # unit tests
```

Run the API next to it (`python -m receipts serve` in `receipts-backend`). The API's `FRONTEND_URL` must be
this app's origin (`http://localhost:5173` by default), or the browser blocks its responses.

## Structure

- `src/site/`: public pages in one layout with the navbar and footer: Home, Live demo (`/demo`), How it works,
  Security, Docs, and public receipts (`/runs/:id`). Illustrations are inline SVG (`illustrations.tsx`).
- `src/pages/`: sign-in and sign-up, the live demo, the public receipt page.
- `src/app/`: the signed-in app at `/app`: Overview (setup checklist), Repositories, Pull requests
  (`/app/repos/:owner/:repo`), Receipts, Try a demo, Account.
- `src/components/`: the receipt card, evidence, verdict chips, issue picker.
- `src/api.ts`: typed client for the API; `src/config.ts`: where the API and live events live;
  `src/session.tsx`: the signed-in user; `src/auth.ts`: Neon's auth client, pointed at the API's `/api/auth`
  proxy and loaded after first paint.

## Deploy on Vercel

The backend runs on Google Cloud Run (see `receipts-backend`'s README). Vercel serves this app and forwards
`/api/*` to the backend (`vercel.json`), so the browser talks to one origin and the session cookie stays
first-party, even on the free `*.vercel.app` and `*.run.app` hostnames. Live events stream straight from the
backend (`VITE_EVENTS_URL`), because Vercel ends proxied requests after 120 seconds; that stream is public and
needs no cookie.

1. In `vercel.json`, replace `CLOUD-RUN-SERVICE-URL` with the backend's host (e.g.
   `receipts-api-123456789.us-east5.run.app`).
2. Vercel > Add New > Project > import this repository. Vite is detected: build `npm run build`, output
   `dist`.
3. Environment variable `VITE_EVENTS_URL` = `https://<cloud-run-url>` (Production and Preview). Leave
   `VITE_API_URL` unset: production builds then call `/api` on their own origin.
4. Deploy, then set the backend's `FRONTEND_URL` to this app's URL (CORS for the event stream, redirects after
   sign-in).

Without Vercel, `npm run build` writes a static site to `dist/` for any static host with every path falling
back to `index.html` (`public/_redirects` does this on Netlify and Cloudflare Pages); set `VITE_API_URL` to
the API at build time and serve both from one parent domain so the session cookie is sent.

## License

Apache-2.0. See [LICENSE](LICENSE).
