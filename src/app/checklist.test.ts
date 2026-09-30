import { describe, expect, it } from "vitest";
import { checklist, nextStep } from "./checklist";

const state = (githubLinked: boolean, installations: number, prChecks: number) => ({ githubLinked, installations, prChecks });

describe("checklist", () => {
  it("starts with connecting GitHub", () => {
    const steps = checklist(state(false, 0, 0));
    expect(steps.map((s) => s.done)).toEqual([false, false, false]);
    expect(nextStep(steps)).toBe("connect");
  });

  it("moves on to adding repositories once GitHub is linked", () => {
    expect(nextStep(checklist(state(true, 0, 0)))).toBe("install");
  });

  it("asks for a first check once a repository is installed", () => {
    expect(nextStep(checklist(state(true, 1, 0)))).toBe("check");
  });

  it("is finished after the first pull request check", () => {
    const steps = checklist(state(true, 2, 3));
    expect(steps.every((s) => s.done)).toBe(true);
    expect(nextStep(steps)).toBeNull();
  });
});
