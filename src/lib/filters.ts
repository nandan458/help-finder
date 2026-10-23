// The filter buttons: which categories to show, and "Open now", "Free",
// and "Wheelchair accessible".

import type { Category } from "./categories";
import { isOpenNow, type HoursStatus } from "./hours";
import type { Place } from "./overpass";

export type Filters = {
  categories: Category[]; // empty means "all categories"
  openNow: boolean;
  freeOnly: boolean;
  wheelchair: boolean;
};

export const NO_FILTERS: Filters = {
  categories: [],
  openNow: false,
  freeOnly: false,
  wheelchair: false,
};

/** Does this place pass every filter that's turned on? */
export function matchesFilters(place: Place, status: HoursStatus, filters: Filters): boolean {
  if (filters.categories.length > 0 && !filters.categories.includes(place.category)) return false;
  // "Open now" hides places whose hours are unknown too. We can't promise they're open.
  if (filters.openNow && !isOpenNow(status)) return false;
  // "Free" only shows places the map data says are free, not "cost unknown".
  if (filters.freeOnly && place.free !== "yes") return false;
  if (filters.wheelchair && place.wheelchair !== "yes") return false;
  return true;
}

/** Turn a category on or off in the filter. */
export function toggleCategory(filters: Filters, category: Category): Filters {
  const on = filters.categories.includes(category);
  return {
    ...filters,
    categories: on
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category],
  };
}

export function hasFilters(filters: Filters): boolean {
  return filters.categories.length > 0 || filters.openNow || filters.freeOnly || filters.wheelchair;
}
