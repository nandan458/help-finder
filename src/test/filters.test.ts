import { describe, expect, it } from "vitest";
import { directionsUrl, isApplePhone } from "../lib/directions";
import { matchesFilters, NO_FILTERS, toggleCategory, hasFilters } from "../lib/filters";
import type { HoursStatus } from "../lib/hours";
import type { Place } from "../lib/overpass";

const foodBank: Place = {
  id: "node/1",
  name: "Food bank",
  category: "food",
  lat: 38.9,
  lng: -77,
  free: "yes",
  wheelchair: "yes",
  osmUrl: "https://www.openstreetmap.org/node/1",
};
const pharmacy: Place = { ...foodBank, id: "node/2", category: "health", free: "no" };
const open: HoursStatus = { kind: "open", soon: false };
const unknown: HoursStatus = { kind: "unknown" };

describe("matchesFilters", () => {
  it("shows everything when no filter is on", () => {
    expect(matchesFilters(pharmacy, unknown, NO_FILTERS)).toBe(true);
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });

  it("filters by category, and categories can be combined", () => {
    const foodOnly = toggleCategory(NO_FILTERS, "food");
    expect(matchesFilters(foodBank, open, foodOnly)).toBe(true);
    expect(matchesFilters(pharmacy, open, foodOnly)).toBe(false);
    const foodAndHealth = toggleCategory(foodOnly, "health");
    expect(matchesFilters(pharmacy, open, foodAndHealth)).toBe(true);
    expect(toggleCategory(foodAndHealth, "food").categories).toEqual(["health"]);
  });

  it("'Open now' hides closed places and places with unknown hours", () => {
    const filters = { ...NO_FILTERS, openNow: true };
    expect(matchesFilters(foodBank, open, filters)).toBe(true);
    expect(matchesFilters(foodBank, { kind: "closed" }, filters)).toBe(false);
    expect(matchesFilters(foodBank, unknown, filters)).toBe(false);
  });

  it("'Free' only shows places known to be free", () => {
    const filters = { ...NO_FILTERS, freeOnly: true };
    expect(matchesFilters(foodBank, open, filters)).toBe(true);
    expect(matchesFilters(pharmacy, open, filters)).toBe(false);
    expect(matchesFilters({ ...foodBank, free: "unknown" }, open, filters)).toBe(false);
  });

  it("'Wheelchair accessible' needs wheelchair=yes", () => {
    const filters = { ...NO_FILTERS, wheelchair: true };
    expect(matchesFilters(foodBank, open, filters)).toBe(true);
    expect(matchesFilters({ ...foodBank, wheelchair: "limited" }, open, filters)).toBe(false);
    expect(matchesFilters({ ...foodBank, wheelchair: undefined }, open, filters)).toBe(false);
  });
});

describe("directions", () => {
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15";
  const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0";
  const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";

  it("spots iPhones and iPads (which pretend to be Macs)", () => {
    expect(isApplePhone(iphone, 5)).toBe(true);
    expect(isApplePhone(ipad, 5)).toBe(true);
    expect(isApplePhone(ipad, 0)).toBe(false); // a real Mac
    expect(isApplePhone(android, 5)).toBe(false);
  });

  it("builds bike, drive, and bus or train links", () => {
    const to = { lat: 38.9103, lng: -77.0217 };
    expect(directionsUrl(to, false, "driving")).toContain("travelmode=driving");
    expect(directionsUrl(to, false, "bicycling")).toContain("travelmode=bicycling");
    expect(directionsUrl(to, false, "transit")).toContain("travelmode=transit");
    expect(directionsUrl(to, true, "driving")).toBe(
      "https://maps.apple.com/?daddr=38.9103,-77.0217&dirflg=d",
    );
    expect(directionsUrl(to, true, "transit")).toContain("dirflg=r");
    // Apple's links have no cycling flag, so none is added.
    expect(directionsUrl(to, true, "bicycling")).toBe(
      "https://maps.apple.com/?daddr=38.9103,-77.0217",
    );
  });

  it("builds walking directions links", () => {
    const to = { lat: 38.9103, lng: -77.0217 };
    expect(directionsUrl(to, true)).toBe("https://maps.apple.com/?daddr=38.9103,-77.0217&dirflg=w");
    expect(directionsUrl(to, false)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=38.9103,-77.0217&travelmode=walking",
    );
  });
});
