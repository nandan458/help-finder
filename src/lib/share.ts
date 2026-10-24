// Links to one place, like .../help-finder/?place=node/367141203&at=38.91030,-77.02170
// Opening one goes straight to that place's card.
//
// The link holds the place's OpenStreetMap id and where the place is (so the
// app knows where to search). It never holds the location of the person sharing it.

import type { LatLng } from "./geo";

export type SharedPlace = LatLng & { id: string };

/** The link for a place, built on the current page's address. */
export function placeLink(place: SharedPlace, pageUrl: string): string {
  const url = new URL(pageUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("place", place.id);
  url.searchParams.set("at", `${place.lat.toFixed(5)},${place.lng.toFixed(5)}`);
  return url.toString();
}

/** The page's address with no place in it (used when a place card closes). */
export function pageWithoutPlace(pageUrl: string): string {
  const url = new URL(pageUrl);
  url.searchParams.delete("place");
  url.searchParams.delete("at");
  return url.toString();
}

/**
 * Read a shared place from the page address, or null if there isn't a valid one.
 * Anyone can type anything into a link, so every part is checked.
 */
export function readSharedPlace(search: string): SharedPlace | null {
  const params = new URLSearchParams(search);
  const id = params.get("place");
  const at = params.get("at");
  if (!id || !at || !/^(node|way|relation)\/\d+$/.test(id)) return null;
  const [lat, lng] = at.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { id, lat, lng };
}

/**
 * A link that opens one place in OpenStreetMap's editor, so anyone can fix its
 * hours, phone number, or name. ("node/123" becomes "?node=123".)
 */
export function osmEditUrl(id: string): string {
  const [type, number] = id.split("/");
  return `https://www.openstreetmap.org/edit?${type}=${number}`;
}
