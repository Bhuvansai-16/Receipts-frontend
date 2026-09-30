// The seven steps of a check, with where a live (or finished) run is. Drives the run page's timeline.
import type { Receipt } from "../receipt";

export type StepState = "done" | "active" | "waiting" | "skipped" | "failed";

export interface ProgressStep {
  id: "claim" | "env" | "writer" | "base" | "pr" | "suite" | "verdict";
  label: string;
  detail?: string;
  state: StepState;
}

export interface Progress {
  steps: ProgressStep[];
  done: number;
  total: number;
}

const CLAIM: Record<string, string> = { fix: "a bug fix", dependency: "a dependency bump", none: "no bug to test" };

export function progressSteps(r: Receipt, live: boolean, queued: boolean): Progress {
  const runs = (n: number) => `${n} of 3 runs`;
  const wrote = r.testAttempts !== undefined;
  const defs: (Omit<ProgressStep, "state"> & { done: boolean })[] = [
    { id: "claim", label: "Read the claim", done: !!r.claim, detail: r.claim ? CLAIM[r.claim.kind] : undefined },
    { id: "env", label: "Set up the sandbox", done: r.envReady || wrote, detail: r.envReady ? "code installed" : undefined },
    {
      id: "writer",
      label: "Write the blind test",
      done: wrote,
      detail: wrote
        ? `${r.testAttempts} attempt${r.testAttempts === 1 ? "" : "s"}`
        : r.writerCommands
          ? `attempt ${r.submissions.length + 1}, ${r.writerCommands} commands`
          : undefined,
    },
    { id: "base", label: "Run it on the original code", done: r.base.length >= 3, detail: r.base.length ? runs(r.base.length) : undefined },
    {
      id: "pr",
      label: "Run it with the pull request",
      done: r.pr.length >= 3 || (!r.patchApplied && wrote),
      detail: !r.patchApplied ? "the change didn't apply" : r.pr.length ? runs(r.pr.length) : undefined,
    },
    {
      id: "suite",
      label: "Check the existing tests",
      done: !!r.suite,
      detail: r.suite ? `${r.suite.basePassed} of ${r.suite.baseTotal} pass on the original code` : undefined,
    },
    { id: "verdict", label: "Decide the verdict", done: !!r.verdict },
  ];

  const firstOpen = defs.findIndex((d) => !d.done);
  const steps = defs.map(({ done, ...step }, i): ProgressStep => {
    if (queued) return { ...step, state: "waiting" };
    if (done) return { ...step, state: "done" };
    if (live) return { ...step, state: i === firstOpen ? "active" : "waiting" };
    return { ...step, state: r.error && i === firstOpen ? "failed" : "skipped" };
  });
  return { steps, done: steps.filter((s) => s.state === "done").length, total: steps.length };
}
