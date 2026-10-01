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
    const x = explain("PROVEN", "test fails on base and passes on the PR in 3/3 runs; existing tests hold", [
      e("suite", { base_passed: 30, base_total: 31, pr_failed: 0 }),
    ]);
    expect(x.tone).toBe("ok");
    expect(x.headline).toBe("The pull request does what it claims");
    expect(x.body).toContain("the existing tests still pass");
  });

  it("doesn't say existing tests pass when none ran", () => {
    const x = explain("PROVEN", "test fails on base and passes on the PR in 3/3 runs; no existing tests were found to run");
    expect(x.body).not.toContain("still pass");
    expect(x.body).toContain("No existing tests were found to run");
  });

  // A mixed result alone can't say whether the change missed part of the issue or the test is wrong
  // (sympy #15: the test could never pass). The backend asks a second opinion only when the runs show a partial fix.
  const MIXED = "PR runs are mixed or fail differently from base";
  const prFail = e("fork", { side: "pr", n: 1, passed: false, message: "Expected z**4, got -z**4" });

  it("words a mixed result neutrally without a second opinion", () => {
    const x = explain("UNPROVEN", MIXED, [prFail]);
    expect(x.headline).toBe("The blind test fails differently with the change");
    expect(x.body).not.toContain("part of the blind test passes");
    expect(x.body).toContain("or the test expects something the issue doesn't");
    expect(x.detail).toBe("Expected z**4, got -z**4");
  });

  it("says the test may be wrong when the second opinion doubts it", () => {
    const x = explain("UNPROVEN", MIXED, [
      prFail,
      e("second_opinion", { faithful: false, reason: "It expects an evaluated expression.", about: "mixed" }),
    ]);
    expect(x.headline).toBe("The blind test may be wrong");
    expect(x.body).toContain("It expects an evaluated expression.");
  });

  it("hedges a partial fix even when the second opinion backs the failing check", () => {
    // sympy #15 live: the second model backed a check that could never pass. A model's view is not a finding.
    const x = explain("UNPROVEN", MIXED, [
      prFail,
      e("second_opinion", { faithful: true, reason: "The issue asks for z**4.", about: "mixed" }),
    ]);
    expect(x.headline).toBe("The change may miss part of the issue");
    expect(x.body).toContain("can be wrong");
    expect(x.detail).toBe("Expected z**4, got -z**4");
  });

  it("explains each Unproven reason in plain words", () => {
    const cases: [string, string][] = [
      ["no valid reproducing test after 5 attempt(s): every test passed", "Receipts couldn't reproduce the bug"],
      ["base run 1/3 does not reproduce the bug: every test passed", "Receipts couldn't reproduce the bug"],
      ["base runs disagree on which tests fail (flaky)", "The original code gave different results"],
      ["patch does not apply to the base commit", "The change didn't apply cleanly"],
      ["the blind test did not run on the PR (deselected or not collected)", "The test didn't run with the change"],
      ["the blind test did not run on the PR in 1/3 runs (sandbox error or timeout)", "The test didn't run with the change"],
      ["existing test suite could not run", "The existing tests couldn't run"],
      ["second opinion doubts the test: checks formatting", "The test may not match the issue"],
      ["pipeline error: EnvironmentSetupError: setting up octo/hello failed: pip", "The repository couldn't be set up"],
      ["Stopped before it finished.", "You stopped this check"],
      ["the test writer's model was unavailable: APIConnectionError: down", "The model service didn't answer"],
      ["a model was unavailable: APIConnectionError: Connection error.", "The model service didn't answer"],
      ["something new", "Not enough evidence either way"],
    ];
    for (const [reason, headline] of cases) expect(explain("UNPROVEN", reason).headline).toBe(headline);
  });

  it("tells people how to make a pull request checkable", () => {
    const x = explain("NO_CHECKABLE_CLAIM", "classified as 'none': nothing to check");
    expect(x.next).toContain("Fixes #");
  });

  it("mentions an automatic retry and its model", () => {
    const x = explain("PROVEN", "test fails on base and passes on the PR in 3/3 runs; existing tests hold", [
      e("writer_retry", { model: "nvidia/Nemotron-3-Ultra-550b-a55b" }),
    ]);
    expect(x.body).toContain("retried once with Nemotron-3-Ultra-550b-a55b");
  });
});
