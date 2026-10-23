// Keeps search results on the phone (in IndexedDB, the browser's built-in
// database), so searching the same area again is instant, uses no data, and
// still works with no signal. It also means fewer requests to the volunteer-run
// map server.
//
// Results are filed under a rounded location (2 decimal places, about a 1 km
// square), so searching from a few steps away still finds them.
//
// How old results are handled:
//   under 1 hour   use them as they are
//   1 to 24 hours  show them right away, then quietly fetch fresh ones
//   over 24 hours  fetch fresh ones; only use the old ones if that fails
//   over 7 days    delete them

import { del, entries, get, set } from "idb-keyval";
import { roundCoord, type LatLng } from "./geo";
import { fetchPlaces, type Place } from "./overpass";

const HOUR = 60 * 60_000;
const REFRESH_AFTER_MS = HOUR;
const MAX_AGE_MS = 24 * HOUR;
const DELETE_AFTER_MS = 7 * 24 * HOUR;

export type CacheEntry = { savedAt: number; places: Place[] };

export function cacheKey(center: LatLng, radiusM: number): string {
  return `places:${radiusM}:${roundCoord(center.lat, 2)}:${roundCoord(center.lng, 2)}`;
}

// The browser can refuse storage (private mode, full disk). Then we just
// don't cache: every function below fails quietly instead of breaking the app.

export async function readCache(center: LatLng, radiusM: number): Promise<CacheEntry | undefined> {
  try {
    return await get<CacheEntry>(cacheKey(center, radiusM));
  } catch {
    return undefined;
  }
}

export async function writeCache(
  center: LatLng,
  radiusM: number,
  places: Place[],
  now = Date.now(),
): Promise<void> {
  try {
    await set(cacheKey(center, radiusM), { savedAt: now, places } satisfies CacheEntry);
  } catch {
    // see note above
  }
}

/** Old enough that we should quietly fetch newer results? */
export function needsRefresh(entry: CacheEntry, now = Date.now()): boolean {
  return now - entry.savedAt > REFRESH_AFTER_MS;
}

/**
 * Like fetchPlaces, but answers from the cache when it can.
 * If the server can't be reached (offline, busy), even old results are
 * better than nothing, so we fall back to them.
 */
export async function fetchPlacesCached(
  center: LatLng,
  radiusM: number,
  fetcher: typeof fetchPlaces = fetchPlaces,
  now = Date.now(),
): Promise<Place[]> {
  const cached = await readCache(center, radiusM);
  if (cached && now - cached.savedAt < MAX_AGE_MS) return cached.places;
  try {
    const places = await fetcher(center, radiusM);
    await writeCache(center, radiusM, places, now);
    return places;
  } catch (err) {
    if (cached) return cached.places;
    throw err;
  }
}

/** Delete results older than a week, so the cache doesn't grow forever. */
export async function pruneCache(now = Date.now()): Promise<void> {
  await deleteWhere((entry) => now - entry.savedAt > DELETE_AFTER_MS);
}

/** Delete every saved search result, and the last search ("Clear data on this device"). */
export async function clearCache(): Promise<void> {
  await deleteWhere(() => true);
  try {
    await del(LAST_SEARCH_KEY);
  } catch {
    // see note above
  }
}

async function deleteWhere(shouldDelete: (entry: CacheEntry) => boolean): Promise<void> {
  try {
    for (const [key, value] of await entries<string, CacheEntry>()) {
      if (key.startsWith("places:") && shouldDelete(value)) await del(key);
    }
  } catch {
    // see note above
  }
}

// ---- Your last search, for opening the app with no signal ----
// To offer "Show my last results" offline, we remember roughly where you last
// searched: rounded to about 1 km, like the results above, and only for a week.
// "Clear data on this device" deletes it too.

export type LastSearch = LatLng & { label?: string };
type SavedLastSearch = LastSearch & { savedAt: number };
const LAST_SEARCH_KEY = "last-search";

export async function saveLastSearch(where: LastSearch, now = Date.now()): Promise<void> {
  const rounded: SavedLastSearch = {
    lat: roundCoord(where.lat, 2),
    lng: roundCoord(where.lng, 2),
    label: where.label,
    savedAt: now,
  };
  try {
    await set(LAST_SEARCH_KEY, rounded);
  } catch {
    // see note above
  }
}

export async function loadLastSearch(now = Date.now()): Promise<LastSearch | undefined> {
  try {
    const saved = await get<SavedLastSearch>(LAST_SEARCH_KEY);
    if (!saved || now - saved.savedAt > DELETE_AFTER_MS) return undefined;
    return { lat: saved.lat, lng: saved.lng, label: saved.label };
  } catch {
    return undefined;
  }
}
