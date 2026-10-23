// Turns a typed place ("Frederick, MD" or a street address) into map coordinates,
// using Nominatim, OpenStreetMap's free search service. We only use it when
// someone says no to sharing their location.
//
// Nominatim is run by volunteers, so we follow its usage policy:
// - at most 1 request per second (we wait if needed)
// - only search when the person presses Search, never while they type
// - the browser sends our website's address (the "Referer" header) with each
//   request, which is how the policy asks web apps to identify themselves
// - remember answers, so searching the same place twice doesn't ask again

import type { LatLng } from "./geo";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const MIN_GAP_MS = 1000;

export type GeocodeResult = LatLng & { label: string };

export type GeocodeErrorKind = "notFound" | "offline" | "server";

export class GeocodeError extends Error {
  kind: GeocodeErrorKind;
  constructor(kind: GeocodeErrorKind) {
    super(`Place search failed: ${kind}`);
    this.name = "GeocodeError";
    this.kind = kind;
  }
}

// The parts of Nominatim's answer we use.
type NominatimHit = { lat: string; lon: string; name?: string; display_name: string };

/** Pick the first match out of Nominatim's answer, or null if there wasn't one. */
export function parseNominatim(hits: NominatimHit[]): GeocodeResult | null {
  const hit = hits[0];
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // "name" is the short name ("Frederick"). Addresses have no name, so we use
  // the first part of the long one ("1600, Pennsylvania Avenue Northwest, ...").
  const label = hit.name || hit.display_name.split(",").slice(0, 2).join(",");
  return { lat, lng, label };
}

let lastRequestAt = 0;
const answers = new Map<string, GeocodeResult>();

/** Forget places typed earlier (part of "Clear data on this device"). */
export function forgetGeocodes(): void {
  answers.clear();
}

// The connection can drop while we wait, so this is checked fresh each time.
const isOffline = () => navigator.onLine === false;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Find where a typed place is. `lang` asks for place names in the app's language. */
export async function geocode(text: string, lang: string): Promise<GeocodeResult> {
  const key = `${lang}|${text.trim().toLowerCase()}`;
  const remembered = answers.get(key);
  if (remembered) return remembered;

  if (isOffline()) throw new GeocodeError("offline");

  // Never send two requests less than a second apart.
  const tooSoon = lastRequestAt + MIN_GAP_MS - Date.now();
  if (tooSoon > 0) await wait(tooSoon);
  lastRequestAt = Date.now();

  const params = new URLSearchParams({
    q: text.trim(),
    format: "jsonv2",
    limit: "1",
    "accept-language": lang,
  });

  let hits: NominatimHit[];
  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new GeocodeError("server");
    hits = (await response.json()) as NominatimHit[];
  } catch (err) {
    if (err instanceof GeocodeError) throw err;
    throw new GeocodeError(isOffline() ? "offline" : "server");
  }

  const result = parseNominatim(hits);
  if (!result) throw new GeocodeError("notFound");
  answers.set(key, result);
  return result;
}
