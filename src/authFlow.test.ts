import { describe, expect, it } from "vitest";
import { authErrorMessage, needsEmailCode, safeNext, socialCallbacks } from "./authFlow";

describe("safeNext", () => {
  it("keeps paths inside the app", () => {
    expect(safeNext("/runs/abc?x=1")).toBe("/runs/abc?x=1");
  });

  it("falls back to /app for anything that could leave the site", () => {
    const backslash = String.raw`/\evil.com`; // browsers read \ as /, making it //evil.com
    for (const bad of [null, "", "https://evil.com", "//evil.com", backslash, "app"]) expect(safeNext(bad)).toBe("/app");
  });
});

describe("authErrorMessage", () => {
  it("shows the sign-in service's own message", () => {
    expect(authErrorMessage(new Error("Invalid email or password"))).toBe("Invalid email or password");
  });

  it("explains a network failure instead of 'Failed to fetch'", () => {
    expect(authErrorMessage(new TypeError("Failed to fetch"))).toBe("Couldn't reach Receipts. Check your connection and try again.");
  });

  it("falls back to a plain sentence for bare HTTP errors and non-errors", () => {
    for (const err of [new Error("HTTP 500 Internal Server Error"), "boom", undefined])
      expect(authErrorMessage(err)).toBe("That didn't work. Check your details and try again.");
  });
});

describe("needsEmailCode", () => {
  it("is true for Neon's email-not-confirmed error", () => {
    const err = Object.assign(new Error("Email verification required"), { code: "email_not_confirmed" });
    expect(needsEmailCode(err)).toBe(true);
  });

  it("is false for any other failure", () => {
    for (const err of [new Error("Invalid email or password"), { code: "email_not_confirmed" }, undefined])
      expect(needsEmailCode(err)).toBe(false);
  });
});

describe("socialCallbacks", () => {
  it("sends the browser back through the API's completion route to the requested page", () => {
    expect(socialCallbacks("/app/repos", "http://localhost:5173", "http://localhost:8000")).toEqual({
      callbackURL: "http://localhost:8000/api/auth/complete?next=http%3A%2F%2Flocalhost%3A5173%2Fapp%2Frepos",
      errorCallbackURL: "http://localhost:5173/signin?error=oauth",
    });
  });
});
