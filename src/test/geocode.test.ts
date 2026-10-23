import { afterEach, describe, expect, it, vi } from "vitest";
import { geocode, GeocodeError, parseNominatim } from "../lib/geocode";

// Trimmed from a real Nominatim answer for "Frederick, MD".
const frederick = {
  lat: "39.4142688",
  lon: "-77.4105409",
  name: "Frederick",
  display_name: "Frederick, Frederick County, Maryland, United States",
};

describe("parseNominatim", () => {
  it("reads the first match", () => {
    expect(parseNominatim([frederick])).toEqual({
      lat: 39.4142688,
      lng: -77.4105409,
      label: "Frederick",
    });
  });

  it("uses the start of the long name when there's no short name", () => {
    const address = {
      lat: "38.8976",
      lon: "-77.0365",
      name: "",
      display_name: "1600, Pennsylvania Avenue Northwest, Washington, District of Columbia",
    };
    expect(parseNominatim([address])?.label).toBe("1600, Pennsylvania Avenue Northwest");
  });

  it("returns null when nothing matched", () => {
    expect(parseNominatim([])).toBeNull();
  });
});

describe("geocode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const reply = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  it("waits so requests are at least 1 second apart (Nominatim's rule)", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(async () => reply([frederick]));
    vi.stubGlobal("fetch", fetchMock);

    await geocode("Place one", "en");
    const second = geocode("Place two", "en");
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock).toHaveBeenCalledTimes(1); // still waiting
    await vi.advanceTimersByTimeAsync(600);
    await second;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("remembers answers instead of asking again", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => reply([frederick]));
    vi.stubGlobal("fetch", fetchMock);
    await geocode("Frederick, MD", "en");
    await geocode("  frederick, md ", "en");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("says 'not found' when there are no matches", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply([])));
    const error = await geocode("Nowhereville 12345", "en").catch((e) => e);
    expect(error).toBeInstanceOf(GeocodeError);
    expect(error.kind).toBe("notFound");
  });

  it("asks for place names in the app's language", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply([frederick]));
    vi.stubGlobal("fetch", fetchMock);
    await geocode("Washington", "es");
    expect(String(fetchMock.mock.calls[0][0])).toContain("accept-language=es");
  });
});
