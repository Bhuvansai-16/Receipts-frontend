import { describe, expect, it } from "vitest";
import type { ReceiptEvent } from "../api";
import { fromEvents } from "../receipt";
import { progressSteps } from "./progress";

const e = (type: string, data: Record<string, unknown> = {}): ReceiptEvent => ({ type, data });
const states = (events: ReceiptEvent[], live = true, queued = false) =>
  progressSteps(fromEvents(events), live, queued).steps.map((s) => s.state);

describe("progressSteps", () => {
  it("waits for a sandbox before anything starts", () => {
    const p = progressSteps(fromEvents([]), true, true);
    expect(p.steps.every((s) => s.state === "waiting")).toBe(true);
    expect([p.done, p.total]).toEqual([0, 7]);
  });

  it("marks the first unfinished step active while the check runs", () => {
    expect(states([e("status"), e("claim", { kind: "fix", claim: "c" }), e("env_ready")])).toEqual([
      "done", "done", "active", "waiting", "waiting", "waiting", "waiting",
    ]);
  });

  it("describes the runs as they arrive", () => {
    const p = progressSteps(
      fromEvents([
        e("claim", { kind: "fix", claim: "c" }), e("env_ready"), e("test_accepted", { attempts: 2 }),
        e("fork", { side: "base", n: 1, passed: false }), e("fork", { side: "base", n: 2, passed: false }),
      ]),
      true,
      false,
    );
    expect(p.steps[3]).toMatchObject({ id: "base", state: "active", detail: "2 of 3 runs" });
    expect(p.steps[2].detail).toBe("2 attempts");
  });

  it("skips what a finished check never needed", () => {
    const events = [e("claim", { kind: "none", claim: "docs" }), e("verdict", { verdict: "NO_CHECKABLE_CLAIM", reason: "r", seconds: 1, tokens: 1 })];
    expect(states(events, false)).toEqual(["done", "skipped", "skipped", "skipped", "skipped", "skipped", "done"]);
  });

  it("shows where a stopped or broken check ended", () => {
    const events = [e("claim", { kind: "fix", claim: "c" }), e("error", { message: "Stopped before it finished." })];
    expect(states(events, false)).toEqual(["done", "failed", "skipped", "skipped", "skipped", "skipped", "skipped"]);
  });
});
