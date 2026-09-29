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

## Deploy

`npm run build` writes a static site to `dist/`. Host it anywhere static, with every path falling back to
`index.html` (`public/_redirects` does this on Netlify and Cloudflare Pages, `vercel.json` on Vercel). Set
`VITE_API_URL` at build time.

Serve the UI and the API from one parent domain, for example `app.example.com` and `api.example.com`: the
session cookie belongs to the API, and browsers only send it along from a page on the same site.
