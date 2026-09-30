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

- `src/site/`: public pages in one layout with the navbar and footer: Home, How it works, Security, Docs,
  sign-in and sign-up, and public receipts (`/runs/:id`). Illustrations are inline SVG (`illustrations.tsx`).
- `src/app/`: the signed-in app at `/app`: Overview (setup checklist), Repositories, Pull requests
  (`/app/repos/:owner/:repo`), Receipts, Try a demo, Account.
- `src/components/`: the receipt card, evidence, verdict chips, issue picker.
- `src/api.ts`: typed client for the API; `src/session.tsx`: the signed-in user; `src/auth.ts`: Neon's auth
  client, pointed at the API's `/api/auth` proxy and loaded after first paint.

## Deploy

`npm run build` writes a static site to `dist/`. Host it anywhere static, with every path falling back to
`index.html` (`public/_redirects` does this on Netlify and Cloudflare Pages, `vercel.json` on Vercel). Set
`VITE_API_URL` at build time.

Serve the UI and the API from one parent domain, for example `app.example.com` and `api.example.com`: the
session cookie belongs to the API, and browsers only send it along from a page on the same site.
