// Helpers for the sign-in and sign-up pages.

/** Where to go after signing in: only paths inside this app (no open redirect). */
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/app";
}

/** Neon returns the browser to the API, which finishes sign-in and forwards to `next` (receipts/auth.py). */
export function socialCallbacks(next: string, origin: string, apiUrl: string) {
  const back = `${apiUrl}/api/auth/complete?next=${encodeURIComponent(origin + next)}`;
  // New accounts get newUserCallbackURL; without it Neon sends them to the site's home page instead.
  return { callbackURL: back, newUserCallbackURL: back, errorCallbackURL: `${origin}/signin?error=oauth` };
}

/** True when Neon sent the browser to a page with its one-time sign-in code (the client exchanges it). */
export function returnedFromSocialSignIn(search: string): boolean {
  return new URLSearchParams(search).has("neon_auth_session_verifier");
}

/** Neon's client throws this when an account must confirm its email before signing in. */
export function needsEmailCode(err: unknown): boolean {
  return err instanceof Error && (err as Error & { code?: string }).code === "email_not_confirmed";
}

/** A sentence for a failed auth call. Neon's client throws errors carrying the service's message. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof TypeError) return "Couldn't reach Receipts. Check your connection and try again.";
  const message = err instanceof Error ? err.message : "";
  return message && !message.startsWith("HTTP ") ? message : "That didn't work. Check your details and try again.";
}
