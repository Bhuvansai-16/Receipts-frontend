import { createAuthClient } from "@neondatabase/auth";
import { API_URL } from "./api";

// Every auth call goes through the API's proxy (receipts-backend: receipts/auth.py), never to Neon directly,
// so the session cookie is first-party to the API. Failed calls throw (Neon's client does), they don't return.
export const authClient = createAuthClient(`${API_URL}/api/auth`);
