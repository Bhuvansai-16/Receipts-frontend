import { describe, expect, it } from "vitest";
import { absoluteBase, resolveUrls } from "./config";

describe("resolveUrls", () => {
  it("talks to the local API in development", () => {
    expect(resolveUrls({ DEV: true })).toEqual({ api: "http://localhost:8000", events: "http://localhost:8000" });
  });

  it("uses its own origin in a production build, where Vercel forwards /api to the backend", () => {
    expect(resolveUrls({ DEV: false })).toEqual({ api: "", events: "" });
  });

  it("streams live events straight from the backend, past Vercel's 120 s proxy limit", () => {
    expect(resolveUrls({ DEV: false, VITE_EVENTS_URL: "https://receipts-api.run.app/" })).toEqual({
      api: "",
      events: "https://receipts-api.run.app",
    });
  });

  it("lets VITE_API_URL point anywhere, without a trailing slash", () => {
    expect(resolveUrls({ DEV: false, VITE_API_URL: "https://api.example.com/" })).toEqual({
      api: "https://api.example.com",
      events: "https://api.example.com",
    });
  });
});

describe("absoluteBase", () => {
  it("falls back to the page's origin when the API is same-origin", () => {
    expect(absoluteBase("", "https://receipts.vercel.app")).toBe("https://receipts.vercel.app");
    expect(absoluteBase("http://localhost:8000", "http://localhost:5173")).toBe("http://localhost:8000");
  });
});
