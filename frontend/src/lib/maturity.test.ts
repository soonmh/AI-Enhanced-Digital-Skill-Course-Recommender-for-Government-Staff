import { describe, it, expect } from "vitest";
import {
  getMaturityLevel,
  getNextMaturityLevel,
  getMaturityColor,
  getMaturityLabelEn,
  MATURITY_LEVELS,
} from "./maturity";

describe("getMaturityLevel — DSRI score to maturity band", () => {
  it.each([
    [0, "novice"],
    [30, "novice"],
    [31, "developing"],
    [50, "developing"],
    [51, "capable"],
    [70, "capable"],
    [71, "proficient"],
    [89, "proficient"],
    [90, "expert"],
    [100, "expert"],
  ] as const)("score %i -> %s", (score, code) => {
    expect(getMaturityLevel(score).code).toBe(code);
  });

  it("maps DSRI 0-100 to levels 1-5 in ascending order", () => {
    expect(getMaturityLevel(10).level).toBe(1);
    expect(getMaturityLevel(40).level).toBe(2);
    expect(getMaturityLevel(60).level).toBe(3);
    expect(getMaturityLevel(80).level).toBe(4);
    expect(getMaturityLevel(95).level).toBe(5);
  });

  it("clamps defensively for out-of-range scores", () => {
    expect(getMaturityLevel(-5).code).toBe("novice");
    expect(getMaturityLevel(150).code).toBe("expert");
  });

  it("handles decimal scores just below the expert threshold", () => {
    // Seed DSRI values are decimals (e.g. 89.5); < 90 stays proficient.
    expect(getMaturityLevel(89.5).code).toBe("proficient");
    expect(getMaturityLevel(90.0).code).toBe("expert");
  });

  it("every integer 0-100 falls within its band's declared range", () => {
    for (let score = 0; score <= 100; score++) {
      const level = getMaturityLevel(score);
      expect(score).toBeGreaterThanOrEqual(level.rangeMin);
      expect(score).toBeLessThanOrEqual(level.rangeMax);
    }
  });
});

describe("getNextMaturityLevel — progression target", () => {
  it("returns the next band up", () => {
    expect(getNextMaturityLevel(10).code).toBe("developing");
    expect(getNextMaturityLevel(40).code).toBe("capable");
    expect(getNextMaturityLevel(60).code).toBe("proficient");
    expect(getNextMaturityLevel(80).code).toBe("expert");
  });

  it("returns null at the top band (expert has no next)", () => {
    expect(getNextMaturityLevel(95)).toBeNull();
    expect(getNextMaturityLevel(100)).toBeNull();
  });
});

describe("derived helpers stay in sync with getMaturityLevel", () => {
  it("getMaturityColor returns the band hex", () => {
    expect(getMaturityColor(10)).toBe(MATURITY_LEVELS.novice.hex);
    expect(getMaturityColor(95)).toBe(MATURITY_LEVELS.expert.hex);
  });

  it("getMaturityLabelEn returns the English label", () => {
    expect(getMaturityLabelEn(60)).toBe("Capable");
    expect(getMaturityLabelEn(95)).toBe("Expert");
  });
});
