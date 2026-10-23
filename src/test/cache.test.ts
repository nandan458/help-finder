// fake-indexeddb gives Node a pretend browser database, so we can test the cache.
import "fake-indexeddb/auto";
import { clear, keys } from "idb-keyval";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cacheKey,
  fetchPlacesCached,
  needsRefresh,
  pruneCache,
  readCache,
  writeCache,
} from "../lib/cache";
import { OverpassError, type Place } from "../lib/overpass";

const HOUR = 60 * 60_000;
const here = { lat: 38.8988, lng: -77.0249 };
const library: Place = {
  id: "node/1",
  name: "Library",
  category: "internet",
  lat: 38.9,
  lng: -77.02,
  free: "unknown",
  osmUrl: "https://www.openstreetmap.org/node/1",
};

beforeEach(async () => {
  await clear();
});

describe("cacheKey", () => {
  it("files nearby spots (within about 1 km) under the same key", () => {
    expect(cacheKey(here, 2000)).toBe("places:2000:38.9:-77.02");
    expect(cacheKey({ lat: 38.9012, lng: -77.0231 }, 2000)).toBe(cacheKey(here, 2000));
  });

  it("keeps different radii apart", () => {
    expect(cacheKey(here, 5000)).not.toBe(cacheKey(here, 2000));
  });
});

describe("fetchPlacesCached", () => {
  it("asks the server the first time and saves the answer", async () => {
    const fetcher = vi.fn().mockResolvedValue([library]);
    expect(await fetchPlacesCached(here, 2000, fetcher)).toEqual([library]);
    expect((await readCache(here, 2000))?.places).toEqual([library]);
  });

  it("answers from the cache the second time, without asking the server", async () => {
    const now = Date.now();
    await writeCache(here, 2000, [library], now - 3 * HOUR);
    const fetcher = vi.fn();
    expect(await fetchPlacesCached(here, 2000, fetcher, now)).toEqual([library]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("asks again when the saved answer is over a day old", async () => {
    const now = Date.now();
    await writeCache(here, 2000, [], now - 25 * HOUR);
    const fetcher = vi.fn().mockResolvedValue([library]);
    expect(await fetchPlacesCached(here, 2000, fetcher, now)).toEqual([library]);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("falls back to an old answer when the server can't be reached", async () => {
    const now = Date.now();
    await writeCache(here, 2000, [library], now - 3 * 24 * HOUR);
    const fetcher = vi.fn().mockRejectedValue(new OverpassError("offline"));
    expect(await fetchPlacesCached(here, 2000, fetcher, now)).toEqual([library]);
  });

  it("passes the error on when there's nothing saved", async () => {
    const fetcher = vi.fn().mockRejectedValue(new OverpassError("busy"));
    await expect(fetchPlacesCached(here, 2000, fetcher)).rejects.toThrow(OverpassError);
  });
});

describe("needsRefresh and pruneCache", () => {
  it("refreshes answers older than an hour", () => {
    const now = Date.now();
    expect(needsRefresh({ savedAt: now - 30 * 60_000, places: [] }, now)).toBe(false);
    expect(needsRefresh({ savedAt: now - 2 * HOUR, places: [] }, now)).toBe(true);
  });

  it("deletes answers older than a week and keeps newer ones", async () => {
    const now = Date.now();
    await writeCache(here, 2000, [library], now - 8 * 24 * HOUR);
    await writeCache(here, 5000, [library], now - 2 * 24 * HOUR);
    await pruneCache(now);
    expect(await keys()).toEqual([cacheKey(here, 5000)]);
  });
});
