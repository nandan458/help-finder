// The "What do you need?" choices on the first screen. Each one is a few
// categories to start with; the person can change the filters later.

import type { Category } from "./categories";

export type Need = "food" | "health" | "shelter" | "internet" | "water" | "restroom" | "all";

export const NEEDS: Need[] = ["food", "health", "shelter", "internet", "water", "restroom", "all"];

/** The categories to show first for a need. An empty list means "show everything". */
export function categoriesForNeed(need: Need): Category[] {
  switch (need) {
    case "all":
      return [];
    case "restroom":
      return ["restroom", "shower"]; // "restrooms & showers" is one choice
    default:
      return [need];
  }
}
