import { describe, expect, it } from "vitest";
import { distanceMeters, formatDistance, roundCoord, usesMiles, walkMinutes } from "../lib/geo";

describe("distanceMeters", () => {
  it("is zero for the same point", () => {
    expect(distanceMeters({ lat: 38.9, lng: -77 }, { lat: 38.9, lng: -77 })).toBe(0);
  });

  it("measures the Washington Monument to the Capitol (about 2.3 km)", () => {
    const monument = { lat: 38.8895, lng: -77.0353 };
    const capitol = { lat: 38.8899, lng: -77.0091 };
    expect(distanceMeters(monument, capitol)).toBeGreaterThan(2200);
    expect(distanceMeters(monument, capitol)).toBeLessThan(2350);
  });
});

describe("walkMinutes", () => {
  it("is at least 1 minute", () => {
    expect(walkMinutes(0)).toBe(1);
  });

  it("allows extra time for streets that aren't straight", () => {
    // 800 m straight line * 1.3 / 80 m per minute = 13 minutes
    expect(walkMinutes(800)).toBe(13);
  });
});

describe("roundCoord", () => {
  it("rounds to about 100 m with 3 decimals", () => {
    expect(roundCoord(38.89876, 3)).toBe(38.899);
    expect(roundCoord(-77.02491, 3)).toBe(-77.025);
  });
});

describe("usesMiles", () => {
  it("uses miles in the U.S. and kilometers elsewhere", () => {
    expect(usesMiles("en-US")).toBe(true);
    expect(usesMiles("es-US")).toBe(true);
    expect(usesMiles("en")).toBe(true); // plain "en" means U.S. English
    expect(usesMiles("es-MX")).toBe(false);
    expect(usesMiles("en-GB")).toBe(false);
  });
});

describe("formatDistance", () => {
  it("formats kilometers", () => {
    expect(formatDistance(450, false)).toBe("450 m");
    expect(formatDistance(2000, false)).toBe("2 km");
    expect(formatDistance(2500, false)).toBe("2.5 km");
    expect(formatDistance(15000, false)).toBe("15 km");
  });

  it("uses feet for very short distances in miles mode", () => {
    expect(formatDistance(10, true)).toBe("50 ft");
    expect(formatDistance(80, true)).toBe("250 ft");
  });

  it("formats miles", () => {
    expect(formatDistance(2000, true)).toBe("1.2 mi");
    expect(formatDistance(15000, true)).toBe("9.3 mi");
    expect(formatDistance(20000, true)).toBe("12 mi");
  });
});
