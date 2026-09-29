import { expect, it } from "vitest";
import type { Evidence } from "./api";
import example from "./example-receipt.json";
import { fromEvidence } from "./receipt";

it("the landing page's bundled receipt is a real, complete PROVEN run", () => {
  const ev = example as unknown as Evidence;
  const r = fromEvidence(ev);
  expect(r.verdict?.verdict).toBe("PROVEN");
  expect([r.base.length, r.pr.length, r.testAttempts]).toEqual([3, 3, 4]);
  expect(ev.run_id).toBe("pydata__xarray-4629-gold-20260928-201414");
});
