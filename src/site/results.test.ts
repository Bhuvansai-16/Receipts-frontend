import { describe, expect, it } from "vitest";
import { percent, repoRows } from "./results";

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
