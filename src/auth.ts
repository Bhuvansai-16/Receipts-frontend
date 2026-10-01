import { createAuthClient } from "@neondatabase/auth";
import { API_URL } from "./api";
import { absoluteBase } from "./config";

// Every auth call goes through the API's proxy (receipts-backend: receipts/auth.py), never to Neon directly,
// so the session cookie is first-party to the API. Failed calls throw (Neon's client does), they don't return.
// The client needs an absolute URL; with a same-origin API that is this page's origin.
export const authClient = createAuthClient(`${absoluteBase(API_URL, window.location.origin)}/api/auth`);
