// Walking directions, drawn on our own map instead of sending people to
// another app. The route comes from Valhalla, a free routing service that the
// FOSSGIS volunteers run on OpenStreetMap data (the same group behind our
// main place-search server). It needs no key and can write steps in Spanish.
//
// Its usage rules (fossgis.de, "Nutzungsbedingungen"):
// - at most 1 request per second (we wait if needed, and only ask when
//   someone taps Directions)
// - credit OpenStreetMap and link to a page for reporting map errors
// - the browser identifies our site automatically (the "Referer" header)

import { roundCoord, type LatLng } from "./geo";

const VALHALLA_URL = "https://valhalla1.openstreetmap.de/route";
const MIN_GAP_MS = 1000;

// Languages the routing server can write steps in (checked 2026-10-23). For any
// other app language (Chinese, Tagalog, Haitian Creole...) the steps come in English.
export const ROUTE_LANGUAGES = ["en", "es", "fr", "ko", "ru", "vi"];

export function routeLanguage(appLanguage: string): string {
  return ROUTE_LANGUAGES.includes(appLanguage) ? appLanguage : "en";
}

// How to travel. These are Valhalla's own names for what it calls "costing".
// (Bus and train times aren't available from the free service, so transit is
// handled by handing off to the phone's maps app instead; see directions.ts.)
export type TravelMode = "pedestrian" | "bicycle" | "auto";

export type RouteStep = {
  instruction: string; // "Turn left onto 9th Street Northwest."
  meters: number; // how far until the next step
};

export type Route = {
  line: LatLng[]; // the path, as points to draw on the map
  meters: number;
  seconds: number;
  steps: RouteStep[];
};

export type RouteErrorKind = "offline" | "noRoute" | "server";

export class RouteError extends Error {
  kind: RouteErrorKind;
  constructor(kind: RouteErrorKind) {
    super(`Walking route failed: ${kind}`);
    this.name = "RouteError";
    this.kind = kind;
  }
}

/**
 * Turn Valhalla's squeezed path text (an "encoded polyline") back into points.
 * To keep answers small, each point is stored as the change from the last one,
 * written as a few letters. This undoes that, 6 decimal places per number.
 */
export function decodePolyline(encoded: string, decimals = 6): LatLng[] {
  const factor = 10 ** decimals;
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  // Reads one number: 5 bits per letter, until a letter says "that's the end".
  function next(): number {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    // The lowest bit says whether the number is negative.
    return result & 1 ? ~(result >> 1) : result >> 1;
  }

  while (index < encoded.length) {
    lat += next();
    lng += next();
    points.push({ lat: lat / factor, lng: lng / factor });
  }
  return points;
}

// The parts of Valhalla's answer we use. We always ask for kilometers.
type ValhallaAnswer = {
  trip?: {
    summary: { length: number; time: number };
    legs: { shape: string; maneuvers: { instruction: string; length: number }[] }[];
  };
};

export function parseRoute(answer: ValhallaAnswer): Route {
  const trip = answer.trip;
  if (!trip || trip.legs.length === 0) throw new RouteError("noRoute");
  const leg = trip.legs[0];
  return {
    line: decodePolyline(leg.shape),
    meters: Math.round(trip.summary.length * 1000),
    seconds: Math.round(trip.summary.time),
    steps: leg.maneuvers.map((m) => ({
      instruction: m.instruction,
      meters: Math.round(m.length * 1000),
    })),
  };
}

let lastRequestAt = 0;
const routes = new Map<string, Route>();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isOffline = () => navigator.onLine === false;

/**
 * A route from `from` to `to` for walking, biking, or driving, with steps in
 * `lang` ("en", "es"...). The starting point is rounded to about 100 m before
 * it's sent, like every location this app sends; the route is still right.
 */
export async function travelRoute(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
  lang: string,
): Promise<Route> {
  const start = { lat: roundCoord(from.lat, 3), lon: roundCoord(from.lng, 3) };
  const key = `${mode}|${lang}|${start.lat},${start.lon}|${to.lat},${to.lng}`;
  const remembered = routes.get(key);
  if (remembered) return remembered;

  if (isOffline()) throw new RouteError("offline");

  // Never send two requests less than a second apart.
  const tooSoon = lastRequestAt + MIN_GAP_MS - Date.now();
  if (tooSoon > 0) await wait(tooSoon);
  lastRequestAt = Date.now();

  const request = {
    locations: [start, { lat: to.lat, lon: to.lng }],
    costing: mode,
    directions_options: { units: "kilometers", language: lang },
  };

  let answer: ValhallaAnswer;
  try {
    const response = await fetch(
      `${VALHALLA_URL}?json=${encodeURIComponent(JSON.stringify(request))}`,
      {
        signal: AbortSignal.timeout(20_000),
      },
    );
    // 400 means "no route between these points" (say, across an ocean).
    if (response.status === 400) throw new RouteError("noRoute");
    if (!response.ok) throw new RouteError("server");
    answer = (await response.json()) as ValhallaAnswer;
  } catch (err) {
    if (err instanceof RouteError) throw err;
    throw new RouteError(isOffline() ? "offline" : "server");
  }

  const route = parseRoute(answer);
  routes.set(key, route);
  return route;
}

/** A walking route (the most common case, and what the place card's time is based on). */
export const walkingRoute = (from: LatLng, to: LatLng, lang: string): Promise<Route> =>
  travelRoute(from, to, "pedestrian", lang);

/**
 * The four choices on the directions screen. Walking, biking, and driving get a
 * real route drawn in the app; "transit" (bus and train) hands off to the
 * phone's maps app, because only it has the live schedules.
 */
export type RouteChoice = TravelMode | "transit";
export const ROUTE_CHOICES: RouteChoice[] = ["pedestrian", "bicycle", "auto", "transit"];

/** The matching word for a maps app's link (see directions.ts). */
export function mapsModeFor(choice: RouteChoice): "walking" | "bicycling" | "driving" | "transit" {
  return { pedestrian: "walking", bicycle: "bicycling", auto: "driving", transit: "transit" }[
    choice
  ] as "walking" | "bicycling" | "driving" | "transit";
}
