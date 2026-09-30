// The three steps a new account takes before its first real receipt.

export type StepId = "connect" | "install" | "check";

export interface Step {
  id: StepId;
  done: boolean;
}

export function checklist(s: { githubLinked: boolean; installations: number; prChecks: number }): Step[] {
  return [
    { id: "connect", done: s.githubLinked },
    { id: "install", done: s.installations > 0 },
    { id: "check", done: s.prChecks > 0 },
  ];
}

/** The first step not done yet, or null when onboarding is finished. */
export function nextStep(steps: Step[]): StepId | null {
  return steps.find((s) => !s.done)?.id ?? null;
}
