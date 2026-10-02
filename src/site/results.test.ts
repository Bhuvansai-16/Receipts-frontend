import { describe, expect, it } from "vitest";
import { percent, rankPatches, readerAgrees, receiptsAgree, repoRows, totalCost } from "./results";

describe("eval results helpers", () => {
  it("rounds rates to whole percents", () => {
    expect(percent(0.4567)).toBe("46%");
    expect(percent(0)).toBe("0%");
    expect(percent(undefined)).toBe("0%");
  });

  it("lists repositories alphabetically", () => {
    const rows = repoRows({ "psf/requests": { cases: 5, caught: 1 }, "astropy/astropy": { cases: 6, caught: 0.5 } });
    expect(rows.map((r) => r.repo)).toEqual(["astropy/astropy", "psf/requests"]);
    expect(rows[0].cases).toBe(6);
  });
});

const p = (name: string, verdict: string | null, fixed = true, reader: string | null = null, cost_usd = 0.01) => ({
  name,
  verdict,
  fixed,
  reader,
  cost_usd,
});

describe("issue race helpers", () => {
  it("ranks Proven, then no answer, then Refuted or Regression, keeping dataset order in ties", () => {
    const ranked = rankPatches([
      p("a", "REFUTED"),
      p("b", "PROVEN"),
      p("c", null),
      p("d", "REGRESSION"),
      p("e", "UNPROVEN"),
      p("f", "PROVEN"),
    ]);
    expect(ranked.map((x) => x.name)).toEqual(["b", "f", "c", "e", "a", "d"]);
  });

  it("counts agreement with SWE-bench; Unproven and not run are no answer", () => {
    expect(receiptsAgree(p("a", "PROVEN", true))).toBe(true);
    expect(receiptsAgree(p("a", "REGRESSION", false))).toBe(true);
    expect(receiptsAgree(p("a", "PROVEN", false))).toBe(false);
    expect(receiptsAgree(p("a", "UNPROVEN", false))).toBeNull();
    expect(receiptsAgree(p("a", null, true))).toBeNull();
    expect(readerAgrees(p("a", null, false, "not_fixed"))).toBe(true);
    expect(readerAgrees(p("a", null, false, "fixed"))).toBe(false);
    expect(readerAgrees(p("a", null, true, "unsure"))).toBeNull();
  });

  it("totals the cost", () => {
    expect(totalCost([p("a", null, true, null, 0.01), p("b", null, true, null, 0.0045)])).toBeCloseTo(0.0145);
  });
});
