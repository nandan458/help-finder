import { afterEach, describe, expect, it, vi } from "vitest";
import { distanceMeters } from "../lib/geo";
import {
  buildQuery,
  fetchPlaces,
  OverpassError,
  parseOverpass,
  removeDuplicates,
  SERVERS,
  type OverpassResponse,
  type Place,
} from "../lib/overpass";
import dcJson from "./fixtures/dc-downtown-2km.json";
import ruralJson from "./fixtures/thurmont-md-15km.json";

const dc = dcJson as OverpassResponse;
const rural = ruralJson as OverpassResponse;

describe("parseOverpass with real downtown DC data", () => {
  const places = parseOverpass(dc);
  const byId = (id: string) => places.find((p) => p.id === id);

  it("finds places in many categories", () => {
    const categories = new Set(places.map((p) => p.category));
    for (const c of ["food", "health", "shelter", "internet", "water", "restroom"]) {
      expect(categories).toContain(c);
    }
  });

  it("gives every place a category and a real position", () => {
    for (const p of places) {
      expect(p.category).toBeTruthy();
      expect(Number.isFinite(p.lat) && Number.isFinite(p.lng)).toBe(true);
    }
    expect(places.length).toBeLessThanOrEqual(dc.elements.length);
  });

  it("turns a food bank into a full Place", () => {
    expect(byId("node/367141203")).toEqual({
      id: "node/367141203",
      name: "Bread for the City",
      category: "food",
      lat: 38.9103,
      lng: -77.0217,
      address: "1525 7th Street Northwest, Washington, DC 20001",
      phone: "+1-202-265-2400",
      website: "https://breadforthecity.org/",
      openingHours: "Mo-Th 09:00-17:00; Fr 09:00-12:00",
      description: undefined,
      free: "yes",
      wheelchair: undefined,
      osmUrl: "https://www.openstreetmap.org/node/367141203",
    } satisfies Place);
  });

  it("gives buildings (ways) a center point and reads contact:* tags", () => {
    const rachaels = byId("way/66816884");
    expect(rachaels?.category).toBe("shelter");
    expect(rachaels?.lat).toBeCloseTo(38.90637, 4);
    expect(rachaels?.phone).toBe("+1 202-682-1005");
    expect(rachaels?.website).toBe("https://www.rachaels.org"); // "https://" added
  });

  it("finds shelters tagged for several groups at once", () => {
    expect(byId("node/367144261")?.category).toBe("shelter"); // homeless;women
  });

  it("has no duplicate ids", () => {
    const ids = places.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("parseOverpass with real small-town data", () => {
  it("still finds a few places, including a food bank", () => {
    const places = parseOverpass(rural);
    expect(places.length).toBeGreaterThan(10);
    expect(places.some((p) => p.category === "food")).toBe(true);
  });
});

describe("removeDuplicates", () => {
  const base: Place = {
    id: "node/1",
    name: "Central Library",
    category: "internet",
    lat: 38.9,
    lng: -77.0,
    free: "unknown",
    osmUrl: "https://www.openstreetmap.org/node/1",
  };

  it("merges a point and a building with the same name, keeping the more detailed one", () => {
    const building: Place = {
      ...base,
      id: "way/2",
      lat: 38.9005, // about 55 m away
      phone: "+1 202 555 0100",
      osmUrl: "https://www.openstreetmap.org/way/2",
    };
    const result = removeDuplicates([base, building]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("way/2");
  });

  it("keeps same-name places that are far apart", () => {
    const far = { ...base, id: "node/3", lat: 38.91 }; // about 1.1 km away
    expect(distanceMeters(base, far)).toBeGreaterThan(150);
    expect(removeDuplicates([base, far])).toHaveLength(2);
  });

  it("never merges unnamed places", () => {
    const fountain: Place = { ...base, name: undefined, category: "water" };
    const nextFountain = { ...fountain, id: "node/4" };
    expect(removeDuplicates([fountain, nextFountain])).toHaveLength(2);
  });
});

describe("buildQuery", () => {
  it("searches around the given point and asks for center points", () => {
    const query = buildQuery(38.899, -77.025, 2000);
    expect(query).toContain("(around:2000,38.899,-77.025)");
    expect(query).toContain("out center;");
    expect(query.startsWith("[out:json]")).toBe(true);
  });
});

describe("fetchPlaces", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const ok = (body: OverpassResponse) => new Response(JSON.stringify(body), { status: 200 });

  it("rounds the location before sending it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ elements: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await fetchPlaces({ lat: 38.898765, lng: -77.024912 }, 2000);
    const body = String(fetchMock.mock.calls[0][1].body);
    expect(decodeURIComponent(body)).toContain("38.899,-77.025");
    expect(decodeURIComponent(body)).not.toContain("38.898765");
  });

  it("tries the backup server once when the main one is busy", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 502 }))
      .mockResolvedValueOnce(ok(dc));
    vi.stubGlobal("fetch", fetchMock);
    const places = await fetchPlaces({ lat: 38.9, lng: -77.03 }, 2000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(SERVERS[0]);
    expect(fetchMock.mock.calls[1][0]).toBe(SERVERS[1]);
    expect(places.length).toBeGreaterThan(0);
  });

  it("gives up after both servers fail, with a friendly error kind", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("slow down", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    const error = await fetchPlaces({ lat: 38.91, lng: -77.03 }, 2000).catch((e) => e);
    expect(error).toBeInstanceOf(OverpassError);
    expect(error.kind).toBe("busy");
    expect(fetchMock).toHaveBeenCalledTimes(2); // never more than two requests
  });

  it("reports the main server's problem, not the backup's", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("too slow", "TimeoutError"))
      .mockResolvedValueOnce(new Response("oops", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const error = await fetchPlaces({ lat: 38.93, lng: -77.03 }, 2000).catch((e) => e);
    expect(error.kind).toBe("timeout");
  });

  it("sends only one request when the same search is asked for twice at once", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ elements: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const here = { lat: 38.92, lng: -77.03 };
    await Promise.all([fetchPlaces(here, 2000), fetchPlaces(here, 2000)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
