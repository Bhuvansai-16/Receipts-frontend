import { API_URL } from "../api";
import { socialCallbacks } from "../authFlow";
import { loadAuth } from "../session";

/** Link a GitHub account to the signed-in user; GitHub sends them back to `next`. */
export async function connectGitHub(next = "/app"): Promise<void> {
  await (await loadAuth()).linkSocial({ provider: "github", ...socialCallbacks(next, window.location.origin, API_URL) });
}
