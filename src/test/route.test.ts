// The fixtures are real answers from the Valhalla server (saved 2026-10-23):
// a walk in downtown DC to the Bread for the City food bank.

import { afterEach, describe, expect, it, vi } from "vitest";
import { distanceMeters } from "../lib/geo";
import {
  decodePolyline,
  mapsModeFor,
  parseRoute,
  RouteError,
  travelRoute,
  walkingRoute,
} from "../lib/route";
import autoJson from "./fixtures/route-dc-auto.json";
import bicycleJson from "./fixtures/route-dc-bicycle.json";
import englishJson from "./fixtures/route-dc-en.json";
import spanishJson from "./fixtures/route-dc-es.json";

const start = { lat: 38.899, lng: -77.025 };
const foodBank = { lat: 38.9103, lng: -77.0217 };

describe("decodePolyline", () => {
  it("decodes a known example", () => {
    // Google's documented example, at 5 decimal places.
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@", 5)).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });
});

describe("parseRoute with a real answer", () => {
  const route = parseRoute(englishJson);

  it("reads the distance, time, and steps", () => {
    expect(route.meters).toBe(1525);
    expect(route.seconds).toBe(1120);
    expect(route.steps).toHaveLength(11);
    expect(route.steps[3]).toEqual({
      instruction: "Turn left onto 9th Street Northwest.",
      meters: 512,
    });
    expect(route.steps.at(-1)?.instruction).toBe("Your destination is on the right.");
  });

  it("draws a line from the start to the food bank", () => {
    expect(distanceMeters(route.line[0], start)).toBeLessThan(50);
    expect(distanceMeters(route.line.at(-1)!, foodBank)).toBeLessThan(50);
  });

  it("works in Spanish too", () => {
    expect(parseRoute(spanishJson).steps[3].instruction).toBe(
      "Gire a la izquierda hacia 9th Street Northwest.",
    );
  });

  it("says 'no route' when there isn't one", () => {
    expect(() => parseRoute({})).toThrow(RouteError);
  });
});

describe("walkingRoute", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rounds the starting point and asks for the app's language", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(spanishJson)));
    vi.stubGlobal("fetch", fetchMock);
    await walkingRoute({ lat: 38.898765, lng: -77.024912 }, foodBank, "es");
    const url = decodeURIComponent(String(fetchMock.mock.calls[0][0]));
    expect(url).toContain('"lat":38.899,"lon":-77.025');
    expect(url).not.toContain("38.898765");
    expect(url).toContain('"language":"es"');
    expect(url).toContain('"costing":"pedestrian"');
  });

  it("remembers routes instead of asking twice", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(englishJson)));
    vi.stubGlobal("fetch", fetchMock);
    await walkingRoute({ lat: 38.95, lng: -77.0 }, foodBank, "en");
    await walkingRoute({ lat: 38.95, lng: -77.0 }, foodBank, "en");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("says 'no route' when the server can't find one", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
    const error = await walkingRoute({ lat: 1, lng: 1 }, foodBank, "en").catch((e) => e);
    expect(error.kind).toBe("noRoute");
  });
});

describe("biking and driving", () => {
  it("reads real bike and drive routes (they follow roads, so they differ from walking)", () => {
    const walk = parseRoute(englishJson);
    const bike = parseRoute(bicycleJson);
    const drive = parseRoute(autoJson);
    expect(bike.steps[0].instruction).toBe("Bike west.");
    expect(drive.steps[0].instruction).toBe("Drive west.");
    expect(bike.seconds).toBeLessThan(walk.seconds); // faster than walking
    expect(drive.seconds).toBeLessThan(walk.seconds);
    expect(distanceMeters(drive.line.at(-1)!, foodBank)).toBeLessThan(100);
  });

  it("asks the server for the right kind of route", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify(bicycleJson)));
    vi.stubGlobal("fetch", fetchMock);
    await travelRoute({ lat: 38.97, lng: -77.01 }, foodBank, "bicycle", "en");
    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('"costing":"bicycle"');
    await travelRoute({ lat: 38.97, lng: -77.01 }, foodBank, "auto", "en");
    expect(decodeURIComponent(String(fetchMock.mock.calls[1][0]))).toContain('"costing":"auto"');
    vi.unstubAllGlobals();
  });

  it("keeps routes for different ways of traveling apart in its memory", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify(englishJson)));
    vi.stubGlobal("fetch", fetchMock);
    const from = { lat: 38.98, lng: -77.02 };
    await travelRoute(from, foodBank, "pedestrian", "en");
    await travelRoute(from, foodBank, "auto", "en");
    await travelRoute(from, foodBank, "auto", "en"); // remembered
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("maps each choice to the words a maps app uses", () => {
    expect(mapsModeFor("pedestrian")).toBe("walking");
    expect(mapsModeFor("bicycle")).toBe("bicycling");
    expect(mapsModeFor("auto")).toBe("driving");
    expect(mapsModeFor("transit")).toBe("transit");
  });
});
