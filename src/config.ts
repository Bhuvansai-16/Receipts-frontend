// Where the API lives. In production the UI is on Vercel, which forwards /api/* to the backend on Cloud Run,
// so the browser sees one origin and the session cookie stays first-party. Live events skip that proxy (it
// ends requests at 120 s) and stream straight from the backend; they are public and need no cookie.

interface Env {
  VITE_API_URL?: string;
  VITE_EVENTS_URL?: string;
  DEV: boolean;
}

const trim = (url: string) => url.replace(/\/$/, "");

export function resolveUrls(env: Env): { api: string; events: string } {
  const api = trim(env.VITE_API_URL ?? (env.DEV ? "http://localhost:8000" : ""));
  return { api, events: trim(env.VITE_EVENTS_URL ?? api) };
}

/** An absolute base for URLs that must be absolute (the auth client, sign-in callbacks). */
export function absoluteBase(apiUrl: string, origin: string): string {
  return apiUrl || origin;
}
