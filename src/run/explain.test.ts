import { describe, expect, it } from "vitest";
import type { Evidence, ReceiptEvent } from "../api";
import { fromEvents } from "../receipt";
import { explainVerdict } from "./explain";

const e = (type: string, data: Record<string, unknown> = {}): ReceiptEvent => ({ type, data });

function explain(verdict: string, reason: string, extra: ReceiptEvent[] = []) {
  const events = [...extra, e("verdict", { verdict, reason, seconds: 60, tokens: 1000 })];
  return explainVerdict(fromEvents(events), { instance_id: "x", events } as Evidence);
}

describe("explainVerdict", () => {
  it("says what Proven means and what to do", () => {
    const x = explain("PROVEN", "test fails on base and passes on the PR in 3/3 runs; existing tests hold");
    expect(x.tone).toBe("ok");
    expect(x.headline).toBe("The pull request does what it claims");
  });

  it("turns a mixed result into a partial fix with the failing assertion", () => {
    const x = explain("UNPROVEN", "PR runs are mixed or fail differently from base", [
      e("fork", { side: "pr", n: 1, passed: false, message: "Expected z**4, got -z**4" }),
    ]);
    expect(x.headline).toBe("The pull request fixed part of it");
    expect(x.detail).toBe("Expected z**4, got -z**4");
  });

  it("explains each Unproven reason in plain words", () => {
    const cases: [string, string][] = [
      ["no valid reproducing test after 5 attempt(s): every test passed", "Receipts couldn't reproduce the bug"],
      ["base run 1/3 does not reproduce the bug: every test passed", "Receipts couldn't reproduce the bug"],
      ["base runs disagree on which tests fail (flaky)", "The original code gave different results"],
      ["patch does not apply to the base commit", "The change didn't apply cleanly"],
      ["the blind test did not run on the PR (deselected or not collected)", "The test didn't run with the change"],
      ["existing test suite could not run", "The existing tests couldn't run"],
      ["second opinion doubts the test: checks formatting", "The test may not match the issue"],
      ["pipeline error: EnvironmentSetupError: setting up octo/hello failed: pip", "The repository couldn't be set up"],
      ["Stopped before it finished.", "You stopped this check"],
      ["something new", "Not enough evidence either way"],
    ];
    for (const [reason, headline] of cases) expect(explain("UNPROVEN", reason).headline).toBe(headline);
  });

  it("tells people how to make a pull request checkable", () => {
    const x = explain("NO_CHECKABLE_CLAIM", "classified as 'none': nothing to check");
    expect(x.next).toContain("Fixes #");
  });
});
