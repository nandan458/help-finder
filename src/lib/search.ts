// Searching with a growing radius: try 2 km, and if that finds fewer than
// 5 places, try 5 km, then 15 km. Someone in a city sees close places fast;
// someone in a small town still gets results instead of an empty screen.

import { ENOUGH_PLACES, SEARCH_RADII_M } from "../config";
import { distanceMeters, type LatLng } from "./geo";
import { fetchPlacesCached } from "./cache";
import type { fetchPlaces, Place } from "./overpass";

export type SearchResult = { places: Place[]; radiusM: number };

/**
 * Search around `center`, widening the radius until we find enough places.
 * `onWiden` is called before each bigger search, so the screen can say
 * "Looking farther away…". The searches run one after another, never at
 * the same time, to go easy on the free map server.
 */
export async function searchNearby(
  center: LatLng,
  onWiden?: (radiusM: number) => void,
  radii: number[] = SEARCH_RADII_M,
  fetcher: typeof fetchPlaces = fetchPlacesCached,
): Promise<SearchResult> {
  let places: Place[] = [];
  for (const [i, radiusM] of radii.entries()) {
    if (i > 0) onWiden?.(radiusM);
    places = await fetcher(center, radiusM);
    const isLast = i === radii.length - 1;
    if (places.length >= ENOUGH_PLACES || isLast) return { places, radiusM };
  }
  // Only reached if radii is empty.
  return { places, radiusM: 0 };
}

/**
 * Should we show the "Search this area" button? Yes once the map's center has
 * moved more than half the search radius away from where we last searched.
 * Small nudges don't count, so the button doesn't flash on and off.
 */
export function movedFarEnough(searchCenter: LatLng, mapCenter: LatLng, radiusM: number): boolean {
  return distanceMeters(searchCenter, mapCenter) > radiusM / 2;
}
