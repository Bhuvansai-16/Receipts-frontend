// Helpers for the sign-in and sign-up pages.

/** Where to go after signing in: only paths inside this app (no open redirect). */
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/app";
}

/** A sentence for a failed auth call. Neon's client throws errors carrying the service's message. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof TypeError) return "Couldn't reach Receipts. Check your connection and try again.";
  const message = err instanceof Error ? err.message : "";
  return message && !message.startsWith("HTTP ") ? message : "That didn't work. Check your details and try again.";
}
