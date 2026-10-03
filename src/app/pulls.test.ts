import { describe, expect, it } from "vitest";
import type { PullSummary } from "../api";
import { uncheckedPulls } from "./pulls";

const pr = (number: number, latest: PullSummary["latest"] = null, draft = false): PullSummary => ({
  number,
  title: "t",
  author: null,
  url: "u",
  draft,
  updated_at: null,
  head_sha: "h",
  linked_issue: null,
  latest,
});
const run = (status: "done" | "running" | "error", head_sha: string) => ({ id: "r", status, verdict: null, head_sha });

describe("uncheckedPulls", () => {
  it("skips drafts and PRs checked, or being checked, at their current commit", () => {
    const pulls = [
      pr(1),
      pr(2, null, true),
      pr(3, run("done", "old")),
      pr(4, run("done", "h")),
      pr(5, run("running", "h")),
      pr(6, run("error", "h")),
    ];
    expect(uncheckedPulls(pulls).map((p) => p.number)).toEqual([1, 3, 6]);
  });
});
