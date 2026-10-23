// Finds free resources near a point by asking OpenStreetMap's Overpass API,
// then turns OSM's raw data into clean Place objects the rest of the app uses.
//
// Overpass is a free, volunteer-run service, so we follow its usage policy:
// - one modest query per search, never repeated in a loop
// - a sensible timeout
// - if the main server is busy, try the backup server once, then stop and
//   let the person press Retry (no automatic hammering)
// - results get cached on the device (added in Phase 3)
// The browser automatically tells the server which website is asking (the
// "Referer" header), which is how the policy asks web apps to identify themselves.

import {
  buildAddress,
  categorize,
  freeStatus,
  wheelchairStatus,
  type Category,
  type Tags,
} from "./categories";
import { distanceMeters, roundCoord, type LatLng } from "./geo";

export type Place = {
  id: string; // OSM type + id, e.g. "node/123456"
  name?: string; // missing if OSM has no name; the screen then shows "Drinking water", etc.
  category: Category;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string; // raw OSM opening_hours string, like "Mo-Fr 09:00-17:00"
  description?: string;
  free: "yes" | "no" | "unknown";
  wheelchair?: "yes" | "limited" | "no";
  osmUrl: string; // link to the place on openstreetmap.org
};

// The shape of Overpass's JSON answer (only the parts we use).
export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number; // nodes (single points) have lat/lon
  lon?: number;
  center?: { lat: number; lon: number }; // ways/areas get a center from "out center"
  tags?: Tags;
};
export type OverpassResponse = { elements: OverpassElement[] };

// Main server first, then a backup mirror. Both are free and need no key.
// On 2026-10-23 we tested the public mirrors: private.coffee and kumi.systems
// didn't answer within 40 seconds, while mail.ru answered with up-to-date data
// and allows requests from web pages (CORS), so it's our backup.
export const SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Give up on a server after 60 seconds. When the main server is busy, even small
// searches can take 30-45 seconds (measured on 2026-10-17), so 30 was too short.
const TIMEOUT_MS = 60_000;

/**
 * Build the Overpass query: "find these kinds of places within radiusM meters of lat/lng".
 * `nwr` means nodes, ways, and relations (points, buildings, and bigger areas).
 * `out center` gives buildings a single center point we can put a pin on.
 * Every line here must match a rule in categorize() in categories.ts.
 */
export function buildQuery(lat: number, lng: number, radiusM: number): string {
  const around = `(around:${radiusM},${lat},${lng})`;
  return [
    "[out:json][timeout:25];",
    "(",
    `  nwr["social_facility"~"^(food_bank|soup_kitchen|shelter)$"]${around};`,
    `  nwr["social_facility:for"~"homeless"]${around};`,
    `  nwr["amenity"~"^(food_bank|food_sharing|shower|drinking_water|toilets|clinic|pharmacy|library|community_centre)$"]${around};`,
    `  nwr["healthcare"~"^(clinic|pharmacy)$"]${around};`,
    `  nwr["healthcare"]["fee"="no"]${around};`,
    `  nwr["amenity"~"^(doctors|dentist)$"]["fee"="no"]${around};`,
    `  nwr["internet_access"]["internet_access:fee"="no"]${around};`,
    ");",
    "out center;",
  ].join("\n");
}

/** Make a website link clickable even if the mapper left off "https://". */
function fixUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Turn one raw OSM element into a Place, or null if we don't show it. */
export function elementToPlace(el: OverpassElement): Place | null {
  const tags = el.tags ?? {};
  const category = categorize(tags);
  if (!category) return null;

  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat === undefined || lng === undefined) return null;

  return {
    id: `${el.type}/${el.id}`,
    name: tags.name,
    category,
    lat,
    lng,
    address: buildAddress(tags),
    // A place can list several numbers separated by ";". We show the first.
    phone: (tags.phone ?? tags["contact:phone"])?.split(";")[0].trim(),
    website: fixUrl(tags.website ?? tags["contact:website"] ?? tags.url),
    openingHours: tags.opening_hours,
    description: tags.description,
    free: freeStatus(tags, category),
    wheelchair: wheelchairStatus(tags),
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

/** How many details a place has. Used to keep the better copy of a duplicate. */
function detailCount(place: Place): number {
  return Object.values(place).filter((value) => value !== undefined).length;
}

/**
 * Two entries are the same place if they have the same category and name and
 * are within 150 m of each other. This happens a lot: a library is often
 * mapped once as a point and again as its building outline.
 * Unnamed places (water fountains, restrooms) are never merged, because two
 * fountains a few steps apart are really two fountains.
 */
function isSamePlace(a: Place, b: Place): boolean {
  if (a.category !== b.category || !a.name || !b.name) return false;
  if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase()) return false;
  return distanceMeters(a, b) < 150;
}

export function removeDuplicates(places: Place[]): Place[] {
  const kept: Place[] = [];
  for (const place of places) {
    const twin = kept.findIndex((other) => isSamePlace(place, other));
    if (twin === -1) kept.push(place);
    else if (detailCount(place) > detailCount(kept[twin])) kept[twin] = place;
  }
  return kept;
}

/** Turn a whole Overpass response into a clean list of places. */
export function parseOverpass(response: OverpassResponse): Place[] {
  const places = response.elements
    .map(elementToPlace)
    .filter((place): place is Place => place !== null);
  return removeDuplicates(places);
}

// ---- Fetching ----

export type FetchErrorKind = "offline" | "timeout" | "busy" | "server";

/** An error with a `kind`, so the screen can show a friendly message for each case. */
export class OverpassError extends Error {
  kind: FetchErrorKind;
  constructor(kind: FetchErrorKind) {
    super(`Overpass request failed: ${kind}`);
    this.name = "OverpassError";
    this.kind = kind;
  }
}

async function askServer(url: string, query: string): Promise<OverpassResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new OverpassError("timeout");
    }
    throw new OverpassError(navigator.onLine === false ? "offline" : "server");
  }
  // 429 = "too many requests". 502, 503, and 504 = server overloaded ("all query
  // workers are busy"). All of them mean "busy, try again later".
  if ([429, 502, 503, 504].includes(response.status)) throw new OverpassError("busy");
  if (!response.ok) throw new OverpassError("server");
  try {
    return (await response.json()) as OverpassResponse;
  } catch {
    throw new OverpassError("server");
  }
}

async function runQuery(query: string): Promise<Place[]> {
  if (navigator.onLine === false) throw new OverpassError("offline");
  // We report the main server's error, because it says the most about what went
  // wrong ("too slow", "busy"). The backup is only a second chance.
  let mainError: OverpassError | undefined;
  // Try the main server, and if it fails, the backup once. Then give up.
  for (const server of SERVERS) {
    try {
      return parseOverpass(await askServer(server, query));
    } catch (err) {
      const error = err instanceof OverpassError ? err : new OverpassError("server");
      mainError ??= error;
      // No point trying the backup if this device has no internet.
      if (error.kind === "offline") throw error;
    }
  }
  throw mainError ?? new OverpassError("server");
}

// Searches that are already running, so asking twice doesn't send two requests.
const inFlight = new Map<string, Promise<Place[]>>();

/**
 * Find places within radiusM meters of center.
 * The location is rounded to about 100 m first, so the server never sees your exact spot.
 */
export function fetchPlaces(center: LatLng, radiusM: number): Promise<Place[]> {
  const query = buildQuery(roundCoord(center.lat, 3), roundCoord(center.lng, 3), radiusM);
  const running = inFlight.get(query);
  if (running) return running;

  const promise = runQuery(query).finally(() => inFlight.delete(query));
  inFlight.set(query, promise);
  return promise;
}
