// Holds everything about the current search: where we searched, how far,
// what we found, and whether it's still loading or failed.
// The screens just call search(center) and read `state`.

import { useCallback, useRef, useState } from "react";
import { SEARCH_RADII_M } from "../config";
import { needsRefresh, readCache, writeCache } from "../lib/cache";
import { distanceMeters, type LatLng } from "../lib/geo";
import { fetchPlaces, OverpassError, type FetchErrorKind, type Place } from "../lib/overpass";
import { searchNearby } from "../lib/search";

export type SearchState = {
  status: "idle" | "loading" | "done" | "error";
  center?: LatLng; // where the last search was centered
  radiusM: number; // how far it reached
  places: Place[]; // the last results (kept while a new search loads)
  errorKind?: FetchErrorKind;
};

export function useNearbySearch() {
  const [state, setState] = useState<SearchState>({ status: "idle", radiusM: 0, places: [] });
  // Each search gets a number. If an older, slower search finishes after a newer
  // one started, we ignore it, so old results never replace new ones.
  const latest = useRef(0);
  const lastRequest = useRef<{ center: LatLng; radii?: number[] } | null>(null);

  const search = useCallback(async (center: LatLng, radii?: number[]) => {
    const id = ++latest.current;
    const isLatest = () => id === latest.current;
    lastRequest.current = { center, radii };
    const firstRadius = (radii ?? SEARCH_RADII_M)[0];
    setState((prev) => ({
      ...prev,
      status: "loading",
      center,
      radiusM: firstRadius,
      errorKind: undefined,
    }));

    let result;
    try {
      result = await searchNearby(
        center,
        (radiusM) => {
          if (isLatest()) setState((prev) => ({ ...prev, radiusM }));
        },
        radii,
      );
    } catch (err) {
      const errorKind = err instanceof OverpassError ? err.kind : "server";
      if (isLatest()) setState((prev) => ({ ...prev, status: "error", errorKind }));
      return;
    }
    if (!isLatest()) return;
    const { places: shown, radiusM, fetchedM } = result;
    setState({ status: "done", center, places: shown, radiusM });

    // If those results came from a cache entry over an hour old, fetch fresh
    // ones now and swap them in quietly. The person already sees results, so
    // if this fails we just keep what's on screen.
    const entry = await readCache(center, fetchedM);
    if (!entry || !needsRefresh(entry)) return;
    try {
      const fresh = await fetchPlaces(center, fetchedM);
      await writeCache(center, fetchedM, fresh);
      // Keep showing the same radius as before.
      const places = fresh.filter((p) => distanceMeters(center, p) <= radiusM);
      if (isLatest()) setState((prev) => ({ ...prev, places }));
    } catch {
      // keep the cached results
    }
  }, []);

  /** Run the last search again (for the Retry button). */
  const retry = useCallback(() => {
    const last = lastRequest.current;
    if (last) void search(last.center, last.radii);
  }, [search]);

  return { state, search, retry };
}
