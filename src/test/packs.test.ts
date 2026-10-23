import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPacks,
  isCovered,
  loadIndex,
  placesFromPacks,
  resetPacks,
  saveState,
  savedStates,
  stateAt,
  type PackIndex,
} from "../lib/packs";
import { neighborIds, tileId, tilesAround } from "../lib/tiles";

// Downtown DC, and the square it sits in.
const dc = { lat: 38.8988, lng: -77.0249 };
const square = tileId(dc.lat, dc.lng);

// A pack with one square: a library near the center, and a water fountain about 12 km away.
const library: [string, number, number, number, Record<string, string>] = [
  "n",
  1,
  38.9,
  -77.025,
  { amenity: "library", name: "Central Library", opening_hours: "Mo-Fr 09:00-17:00" },
];
const farFountain: [string, number, number, number, Record<string, string>] = [
  "n",
  2,
  39.01,
  -77.025,
  { amenity: "drinking_water" },
];

const index: PackIndex = {
  version: 1,
  builtAt: "2026-10-25T06:00:00Z",
  tiles: [square],
  states: { DC: { name: "District of Columbia", tiles: [square] } },
};

/** Pretend GitHub Pages: serves the index and the one square. */
function serve(overrides: Record<string, () => Response> = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = String(url);
    for (const [part, make] of Object.entries(overrides)) if (path.includes(part)) return make();
    if (path.endsWith("index.json")) return new Response(JSON.stringify(index));
    if (path.endsWith(`t/${square}.json`))
      return new Response(JSON.stringify([library, farFountain]));
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(async () => {
  vi.unstubAllGlobals();
  await clearPacks();
});

describe("tile math", () => {
  it("finds the square a point is in", () => {
    expect(tileId(38.8988, -77.0249)).toBe("155_-309");
  });

  it("asks for every square a search touches, and no more", () => {
    // 2 km around downtown DC stays inside one square; 15 km reaches the next one north.
    expect(tilesAround(dc.lat, dc.lng, 2000)).toEqual([square]);
    expect(tilesAround(dc.lat, dc.lng, 15000).length).toBeGreaterThan(1);
  });

  it("lists a square and its neighbors", () => {
    expect(neighborIds("10_-20")).toHaveLength(9);
    expect(neighborIds("10_-20")).toContain("9_-21");
  });
});

describe("placesFromPacks", () => {
  it("answers a search from the pack, within the radius", async () => {
    serve();
    const near = await placesFromPacks(dc, 2000);
    expect(near?.map((p) => p.name ?? p.category)).toEqual(["Central Library"]);
    const wide = await placesFromPacks(dc, 15000);
    expect(wide).toHaveLength(2); // the fountain is about 12 km away
  });

  it("says 'can't answer' for places outside the packs, so the live server is used", async () => {
    serve();
    expect(await placesFromPacks({ lat: 43.65, lng: -79.38 }, 2000)).toBeNull(); // Toronto
  });

  it("says 'can't answer' when there are no packs at all", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html></html>", { status: 404 })),
    );
    expect(await placesFromPacks(dc, 2000)).toBeNull();
  });

  it("downloads each square once, then answers from the phone", async () => {
    const fetchMock = serve();
    await placesFromPacks(dc, 2000);
    await placesFromPacks(dc, 2000);
    const squareDownloads = fetchMock.mock.calls.filter(([url]) => String(url).includes("/t/"));
    expect(squareDownloads).toHaveLength(1);
  });

  it("keeps working with no signal after a square was saved", async () => {
    serve();
    await placesFromPacks(dc, 2000);
    resetPacks();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    // The index and the square both come from the phone now.
    const places = await placesFromPacks(dc, 2000);
    expect(places).toHaveLength(1);
  });

  it("treats a square with no file as empty, not as an error", async () => {
    serve();
    // A spot next to a square that has places, but with no file of its own.
    const emptyNeighbor = { lat: dc.lat + 0.3, lng: dc.lng };
    expect(isCovered(emptyNeighbor, index)).toBe(true);
    expect(await placesFromPacks(emptyNeighbor, 2000)).toEqual([]);
  });
});

describe("saving a state for offline use", () => {
  it("downloads every square, reports progress, and remembers it", async () => {
    serve();
    const progress: Array<[number, number]> = [];
    const saved = await saveState("DC", (done, total) => progress.push([done, total]));
    expect(progress.at(0)).toEqual([0, 1]);
    expect(progress.at(-1)).toEqual([1, 1]);
    expect(saved.builtAt).toBe(index.builtAt);
    expect((await savedStates()).DC.builtAt).toBe(index.builtAt);
  });

  it("does not claim a state is saved when a square fails to download", async () => {
    serve({ [`t/${square}.json`]: () => new Response("busy", { status: 503 }) });
    await expect(saveState("DC", () => {})).rejects.toThrow();
    expect(await savedStates()).toEqual({});
  });

  it("is deleted by Clear data", async () => {
    serve();
    await saveState("DC", () => {});
    await clearPacks();
    expect(await savedStates()).toEqual({});
  });
});

describe("stateAt", () => {
  it("names the state a spot is in", async () => {
    expect(stateAt(dc, index)).toEqual({ code: "DC", name: "District of Columbia" });
    expect(stateAt({ lat: 43.65, lng: -79.38 }, index)).toBeNull();
  });
});

describe("loadIndex", () => {
  it("uses the saved index when the network is down", async () => {
    serve();
    expect((await loadIndex())?.builtAt).toBe(index.builtAt);
    resetPacks();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect((await loadIndex())?.builtAt).toBe(index.builtAt);
  });
});
