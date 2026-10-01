import { describe, expect, it } from "vitest";
import { EVENT_TYPES } from "./api";

describe("live events", () => {
  it("listens for every event a check emits", () => {
    // engine.py, writer.py and checks.py emit these; EventSource drops any type without a listener, which hid
    // the automatic retry while a check ran.
    const emitted = ["status", "claim", "env_ready", "research", "writer_progress", "writer_submit", "writer_retry",
      "test_accepted", "fork", "suite", "second_opinion", "verdict", "error", "done"];
    for (const type of emitted) expect(EVENT_TYPES).toContain(type);
  });
});
