import "fake-indexeddb/auto";
import { clear } from "idb-keyval";
import { beforeEach, describe, expect, it } from "vitest";
import { clearCache, loadLastSearch, saveLastSearch } from "../lib/cache";
import { pageWithoutPlace, placeLink, readSharedPlace } from "../lib/share";

const breadForTheCity = { id: "node/367141203", lat: 38.9103, lng: -77.0217 };
const page = "https://example.github.io/help-finder/";

describe("place links", () => {
  it("builds a link that reads back to the same place", () => {
    const link = placeLink(breadForTheCity, page);
    expect(link).toBe(
      "https://example.github.io/help-finder/?place=node%2F367141203&at=38.91030%2C-77.02170",
    );
    expect(readSharedPlace(new URL(link).search)).toEqual(breadForTheCity);
  });

  it("replaces an old place in the address instead of adding a second one", () => {
    const first = placeLink(breadForTheCity, page);
    const second = placeLink({ id: "way/1", lat: 1, lng: 2 }, first);
    expect(new URL(second).searchParams.getAll("place")).toEqual(["way/1"]);
  });

  it("removes the place when the card closes", () => {
    expect(pageWithoutPlace(placeLink(breadForTheCity, page))).toBe(page);
  });

  it("ignores links that are broken or made up", () => {
    expect(readSharedPlace("")).toBeNull();
    expect(readSharedPlace("?place=node/1")).toBeNull(); // no location
    expect(readSharedPlace("?place=<script>&at=1,2")).toBeNull();
    expect(readSharedPlace("?place=node/1&at=abc,def")).toBeNull();
    expect(readSharedPlace("?place=node/1&at=95,10")).toBeNull(); // not on Earth
  });
});

describe("last search (for offline)", () => {
  beforeEach(async () => {
    await clear();
  });

  it("remembers only a rounded location (about 1 km)", async () => {
    await saveLastSearch({ lat: 38.898765, lng: -77.024912, label: "Washington" });
    expect(await loadLastSearch()).toEqual({ lat: 38.9, lng: -77.02, label: "Washington" });
  });

  it("forgets it after a week", async () => {
    const now = Date.now();
    await saveLastSearch({ lat: 38.9, lng: -77 }, now - 8 * 24 * 60 * 60_000);
    expect(await loadLastSearch(now)).toBeUndefined();
  });

  it("is deleted by Clear data", async () => {
    await saveLastSearch({ lat: 38.9, lng: -77 });
    await clearCache();
    expect(await loadLastSearch()).toBeUndefined();
  });
});
