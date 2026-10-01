// What a finished check means, in plain words, and the one thing to do next.
import type { Evidence } from "../api";
import type { Tone } from "../components/VerdictChip";
import type { Receipt } from "../receipt";

export interface Explanation {
  tone: Tone;
  headline: string;
  body: string;
  next?: string;
  /** The assertion worth reading (a failing run's message), when there is one. */
  detail?: string;
}

const UNPROVEN: { match: RegExp; headline: string; body: string; next?: string }[] = [
  {
    match: /no valid reproducing test|does not reproduce the bug/,
    headline: "Receipts couldn't reproduce the bug",
    body: "The test writer couldn't write a test that fails on the original code the way the issue describes, so there was nothing to prove.",
    next: "Add steps to reproduce (an input and the wrong output) to the issue, then check again.",
  },
  {
    match: /flaky/,
    headline: "The original code gave different results",
    body: "The same test failed differently across the three runs on the original code, so no run can be trusted as a baseline.",
    next: "Check again. If it keeps happening, the code under test may depend on timing or randomness.",
  },
  {
    match: /patch does not apply/,
    headline: "The change didn't apply cleanly",
    body: "The pull request's diff doesn't apply to the commit it starts from, so it couldn't be tested.",
    next: "Rebase the pull request on its base branch, then check again.",
  },
  {
    match: /did not run on the PR/,
    headline: "The test didn't run with the change",
    body: "With the pull request applied, the blind test didn't run every time (skipped, not collected, or a sandbox error), so the result can't count.",
  },
  {
    match: /existing test suite could not run/,
    headline: "The existing tests couldn't run",
    body: "The blind test passed with the change, but the repository's own tests didn't run, so a regression can't be ruled out.",
  },
  {
    match: /mixed or fail differently/,
    headline: "The blind test fails differently with the change",
    body: "With the change applied, the blind test no longer fails the way it did on the original code, but it doesn't pass either. That can mean the change misses part of the issue, or the test expects something the issue doesn't.",
    next: "Read the failing assertion before merging.",
  },
  {
    match: /second opinion doubts/,
    headline: "The test may not match the issue",
    body: "The pull request still fails the blind test, but a second model thinks the test checks something the issue didn't ask for, so Receipts won't call it a failure.",
  },
  {
    match: /EnvironmentSetupError|setting up .* failed|larger than|need SANDBOX_PROVIDER/,
    headline: "The repository couldn't be set up",
    body: "Receipts installs Python projects with pip and runs pytest. This repository didn't install in the sandbox.",
    next: "Make sure `pip install -e .` or a requirements file works for the project, then check again.",
  },
  {
    match: /^Stopped before it finished/,
    headline: "You stopped this check",
    body: "The check ended before a verdict. Nothing was posted as a failure.",
    next: "Start it again whenever you're ready.",
  },
  {
    match: /model was unavailable/,
    headline: "The model service didn't answer",
    body: "The test-writing model didn't respond, so nothing was checked. This says nothing about the pull request.",
    next: "Check again in a few minutes.",
  },
];

/** A retry is part of the story: the first writer failed, which says nothing about the pull request. */
export function explainVerdict(r: Receipt, ev: Evidence): Explanation {
  const e = explainBase(r, ev);
  if (!r.writerRetry) return e;
  return {
    ...e,
    body: `${e.body} The first test writer couldn't write a valid test, so Receipts retried once with ${r.writerRetry.model}.`,
  };
}

function explainBase(r: Receipt, ev: Evidence): Explanation {
  const verdict = r.verdict?.verdict ?? ev.verdict;
  const reason = r.verdict?.reason ?? ev.reason ?? r.error ?? "";
  const prFailure = r.pr.find((t) => !t.passed)?.message || undefined;

  switch (verdict) {
    case "PROVEN":
      return {
        tone: "ok",
        headline: "The pull request does what it claims",
        body: `The blind test failed on the original code and passed with the change, three times each${
          r.suite ? ", and the existing tests still pass." : ". No existing tests were found to run for this change."
        }`,
        next: "Safe to review first.",
      };
    case "REFUTED":
      return {
        tone: "bad",
        headline: "The pull request doesn't fix the issue",
        body: "With the change applied, the blind test still fails the same way it did on the original code.",
        next: "Share this receipt with the author.",
        detail: prFailure,
      };
    case "REGRESSION":
      return {
        tone: "rust",
        headline: "It fixes the issue but breaks existing tests",
        body: `The blind test now passes, but ${reason.replace(/^fixes the claim but breaks /, "")}.`,
        next: "Look at the broken tests before merging.",
      };
    case "NO_CHECKABLE_CLAIM":
      return {
        tone: "neutral",
        headline: "Nothing to check",
        body: "Neither the linked issue nor the description says this pull request fixes a bug.",
        next: "Link the issue with \"Fixes #123\" in the pull request description, then check again.",
      };
  }
  // A mixed result can mean a partial fix or a wrong test. The backend asks a second opinion only when the runs show
  // a partial fix, and a model's view is worded as one (sympy #15: it backed a check that could never pass).
  if (/mixed or fail differently/.test(reason) && r.secondOpinion)
    return r.secondOpinion.faithful
      ? {
          tone: "neutral",
          headline: "The change may miss part of the issue",
          body: `With the change, part of the blind test passes and the rest fails exactly as it did on the original code. A second model thinks the failing check is one the issue asks for: ${r.secondOpinion.reason} A model can be wrong, so read the failing assertion before acting on it.`,
          next: "Read the failing case, then share it with the author if it holds.",
          detail: prFailure,
        }
      : {
          tone: "neutral",
          headline: "The blind test may be wrong",
          body: `With the change, part of the blind test passes and one check still fails, but a second model thinks that check expects something the issue doesn't: ${r.secondOpinion.reason} Nothing here counts against the pull request.`,
          next: "Review the pull request as usual. The failing check is shown for reference.",
          detail: prFailure,
        };
  const known = UNPROVEN.find((u) => u.match.test(reason));
  if (known) return { tone: "neutral", ...known, detail: known.match.source.includes("mixed") ? prFailure : undefined };
  return {
    tone: "neutral",
    headline: "Not enough evidence either way",
    body: reason ? `${reason[0].toUpperCase()}${reason.slice(1)}${/[.!?]$/.test(reason) ? "" : "."}` : "The check ended without a verdict.",
  };
}
