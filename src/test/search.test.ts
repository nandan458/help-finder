import { describe, expect, it, vi } from "vitest";
import type { Place } from "../lib/overpass";
import { movedFarEnough, searchNearby } from "../lib/search";

// n fake places, all `km` kilometers north of `here`.
const here = { lat: 38.9, lng: -77.03 };
const fakePlaces = (n: number, km: number, prefix = "a"): Place[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `node/${prefix}${i}`,
    category: "water",
    lat: here.lat + km / 111, // 1 degree of latitude is about 111 km
    lng: here.lng,
    free: "yes",
    osmUrl: `https://www.openstreetmap.org/node/${i}`,
  }));

const radii = [2000, 5000, 15000];

describe("searchNearby", () => {
  it("asks for 5 km once and shows the 2 km places when there are enough", async () => {
    const near = fakePlaces(6, 1); // 1 km away
    const far = fakePlaces(10, 4, "b"); // 4 km away
    const fetcher = vi.fn().mockResolvedValue([...near, ...far]);
    const result = await searchNearby(here, undefined, radii, fetcher);
    expect(fetcher.mock.calls.map((call) => call[1])).toEqual([5000]);
    expect(result).toEqual({ places: near, radiusM: 2000, fetchedM: 5000 });
  });

  it("shows 5 km with no extra request when 2 km has too few", async () => {
    const places = [...fakePlaces(2, 1), ...fakePlaces(4, 4, "b")];
    const onWiden = vi.fn();
    const fetcher = vi.fn().mockResolvedValue(places);
    const result = await searchNearby(here, onWiden, radii, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onWiden).not.toHaveBeenCalled();
    expect(result.radiusM).toBe(5000);
    expect(result.places).toHaveLength(6);
  });

  it("asks again for 15 km only when 5 km has too few", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(fakePlaces(2, 3))
      .mockResolvedValueOnce(fakePlaces(9, 10));
    const onWiden = vi.fn();
    const result = await searchNearby(here, onWiden, radii, fetcher);
    expect(fetcher.mock.calls.map((call) => call[1])).toEqual([5000, 15000]);
    expect(onWiden.mock.calls).toEqual([[15000]]);
    expect(result).toEqual({ places: fakePlaces(9, 10), radiusM: 15000, fetchedM: 15000 });
  });

  it("returns what the biggest radius found, even if it's still few", async () => {
    const fetcher = vi.fn().mockResolvedValue(fakePlaces(2, 1));
    const result = await searchNearby(here, undefined, radii, fetcher);
    expect(result.radiusM).toBe(15000);
    expect(result.places).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledTimes(2); // 5 km and 15 km, never more
  });

  it("asks for a single bigger radius directly (the 'Search farther' button)", async () => {
    const fetcher = vi.fn().mockResolvedValue(fakePlaces(1, 30));
    const result = await searchNearby(here, undefined, [40000], fetcher);
    expect(fetcher.mock.calls.map((call) => call[1])).toEqual([40000]);
    expect(result.radiusM).toBe(40000);
  });

  it("stops and reports the error if a search fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("busy"));
    await expect(searchNearby(here, undefined, radii, fetcher)).rejects.toThrow("busy");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("movedFarEnough", () => {
  const start = here;

  it("ignores small nudges", () => {
    const nudge = { lat: 38.905, lng: -77.03 }; // about 550 m north
    expect(movedFarEnough(start, nudge, 2000)).toBe(false);
  });

  it("notices a move of more than half the radius", () => {
    const moved = { lat: 38.912, lng: -77.03 }; // about 1.3 km north
    expect(movedFarEnough(start, moved, 2000)).toBe(true);
  });
});
