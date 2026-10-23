// Searching with a growing radius: show places within 2 km, and if there are
// fewer than 5, within 5 km, then 15 km. Someone in a city sees close places;
// someone in a small town still gets results instead of an empty screen.
//
// Each request to the free map server can take 30-60 seconds, mostly waiting in
// line, and a bigger area hardly takes longer. So we don't ask for 2 km and then
// 5 km separately: we ask for 5 km once and pick out the 2 km places on the
// phone. Only if 5 km still has too few do we ask again, for 15 km.

import { ENOUGH_PLACES, FIRST_FETCH_M, SEARCH_RADII_M } from "../config";
import { distanceMeters, type LatLng } from "./geo";
import { fetchPlacesFast } from "./packs";
import type { fetchPlaces, Place } from "./overpass";

// places: everything the server answer held (it can reach past radiusM).
// radiusM: how far to show places by default. fetchedM: how far the answer reached
// (what the cache is filed under).
export type SearchResult = { places: Place[]; radiusM: number; fetchedM: number };

/**
 * Search around `center`, widening the radius until we find enough places.
 * `onWiden` is called before each extra request to the server, so the screen
 * can say "Looking farther away…". Requests go one after another, never at
 * the same time, to go easy on the free map server.
 */
export async function searchNearby(
  center: LatLng,
  onWiden?: (radiusM: number) => void,
  radii: number[] = SEARCH_RADII_M,
  fetcher: typeof fetchPlaces = fetchPlacesFast,
): Promise<SearchResult> {
  // Which radii to actually ask the server for: the first one that's at least
  // FIRST_FETCH_M, and every bigger one. Smaller radii are checked on the phone.
  const fetchRadii = radii.filter((r) => r >= FIRST_FETCH_M);
  if (fetchRadii.length === 0) fetchRadii.push(radii[radii.length - 1]);

  let checked = 0; // how many of `radii` we've looked at so far
  let places: Place[] = [];
  for (const [i, fetchRadius] of fetchRadii.entries()) {
    if (i > 0) onWiden?.(fetchRadius);
    places = await fetcher(center, fetchRadius);

    // Check each radius this answer covers, smallest first.
    while (checked < radii.length && radii[checked] <= fetchRadius) {
      const radiusM = radii[checked++];
      const within = places.filter((p) => distanceMeters(center, p) <= radiusM);
      if (within.length >= ENOUGH_PLACES) return { places, radiusM, fetchedM: fetchRadius };
    }
  }
  // Even the biggest radius found few places: show what there is.
  const biggest = fetchRadii[fetchRadii.length - 1];
  return { places, radiusM: biggest, fetchedM: biggest };
}

/**
 * Should we show the "Search this area" button? Yes once the map's center has
 * moved more than half the search radius away from where we last searched.
 * Small nudges don't count, so the button doesn't flash on and off.
 */
export function movedFarEnough(searchCenter: LatLng, mapCenter: LatLng, radiusM: number): boolean {
  return distanceMeters(searchCenter, mapCenter) > radiusM / 2;
}

/** How many matching places must be found before we stop looking farther. */
const ENOUGH_MATCHES = 3;

/**
 * How far to show places, for the filter the person picked.
 * With no category chosen it's just the search's own radius. With categories
 * chosen (say, only free food), the first 2 km may hold plenty of water
 * fountains and no food banks, so we look farther, up to everything we fetched,
 * until there are at least a few places of that kind.
 */
export function reachFor(
  places: Place[],
  center: LatLng,
  categories: string[],
  radiusM: number,
  fetchedM: number,
  radii: number[] = SEARCH_RADII_M,
): number {
  if (categories.length === 0) return radiusM;
  const steps = [...radii.filter((r) => r > radiusM && r < fetchedM), fetchedM];
  let reach = radiusM;
  for (const step of [radiusM, ...steps]) {
    reach = step;
    const matches = places.filter(
      (p) => categories.includes(p.category) && distanceMeters(center, p) <= step,
    );
    if (matches.length >= ENOUGH_MATCHES) break;
  }
  return reach;
}
