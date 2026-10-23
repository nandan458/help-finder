import { describe, expect, it, vi } from "vitest";
import type { Place } from "../lib/overpass";
import { movedFarEnough, searchNearby } from "../lib/search";

// n fake places, enough to test counting without real map data.
const fakePlaces = (n: number): Place[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `node/${i}`,
    category: "water",
    lat: 38.9,
    lng: -77,
    free: "yes",
    osmUrl: `https://www.openstreetmap.org/node/${i}`,
  }));

const here = { lat: 38.9, lng: -77.03 };
const radii = [2000, 5000, 15000];

describe("searchNearby", () => {
  it("stops at 2 km when that finds enough places", async () => {
    const fetcher = vi.fn().mockResolvedValue(fakePlaces(12));
    const result = await searchNearby(here, undefined, radii, fetcher);
    expect(result.radiusM).toBe(2000);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("widens to 5 km, then 15 km, when there are too few", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(fakePlaces(1))
      .mockResolvedValueOnce(fakePlaces(3))
      .mockResolvedValueOnce(fakePlaces(9));
    const onWiden = vi.fn();
    const result = await searchNearby(here, onWiden, radii, fetcher);
    expect(fetcher.mock.calls.map((call) => call[1])).toEqual([2000, 5000, 15000]);
    expect(onWiden.mock.calls).toEqual([[5000], [15000]]);
    expect(result).toEqual({ places: fakePlaces(9), radiusM: 15000 });
  });

  it("returns what the biggest radius found, even if it's still few", async () => {
    const fetcher = vi.fn().mockResolvedValue(fakePlaces(2));
    const result = await searchNearby(here, undefined, radii, fetcher);
    expect(result.radiusM).toBe(15000);
    expect(result.places).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledTimes(3); // never more than one per radius
  });

  it("stops and reports the error if a search fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("busy"));
    await expect(searchNearby(here, undefined, radii, fetcher)).rejects.toThrow("busy");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("movedFarEnough", () => {
  const start = { lat: 38.9, lng: -77.03 };

  it("ignores small nudges", () => {
    const nudge = { lat: 38.905, lng: -77.03 }; // about 550 m north
    expect(movedFarEnough(start, nudge, 2000)).toBe(false);
  });

  it("notices a move of more than half the radius", () => {
    const moved = { lat: 38.912, lng: -77.03 }; // about 1.3 km north
    expect(movedFarEnough(start, moved, 2000)).toBe(true);
  });
});
