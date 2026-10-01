import { describe, expect, it } from "vitest";
import { ApiError, type DemoCase } from "./api";
import { demoMessage, groupCases } from "./demo";

const c = (id: string, instance_id: string, kind: string): DemoCase => ({
  id,
  instance_id,
  kind,
  repo: `repo-${instance_id}`,
  title: `title-${instance_id}`,
  summary: "s",
});

describe("groupCases", () => {
  it("groups by issue in file order, each as real fix, empty patch, wrong patch", () => {
    const groups = groupCases([
      c("a-wrong", "a", "wrong patch"),
      c("b-fix", "b", "real fix"),
      c("a-fix", "a", "real fix"),
      c("a-empty", "a", "empty patch"),
    ]);
    expect(groups.map((g) => g.instance_id)).toEqual(["a", "b"]);
    expect(groups[0].cases.map((x) => x.id)).toEqual(["a-fix", "a-empty", "a-wrong"]);
    expect([groups[0].title, groups[0].repo]).toEqual(["title-a", "repo-a"]);
  });
});

describe("demoMessage", () => {
  it("shows the server's words when today's demo checks are used up", () => {
    expect(demoMessage(new ApiError(429, "Today's demo checks are used up."))).toBe("Today's demo checks are used up.");
  });

  it("falls back to a plain sentence for anything else", () => {
    const plain = "Couldn't start the check. Try again in a moment.";
    expect(demoMessage(new ApiError(500, "Request failed (500)."))).toBe(plain);
    expect(demoMessage(new TypeError("Failed to fetch"))).toBe(plain);
  });
});
