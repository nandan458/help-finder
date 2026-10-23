// Turns one line of osmium's GeoJSON output into a place for an offline pack.
// Used by the weekly pack builder (scripts/build-packs.mjs), which runs in Node,
// so the imports below name their .ts files in full.
//
// The pack builder downloads each state's OpenStreetMap file from Geofabrik,
// keeps the places we care about, and calls this for each one. The decision of
// WHAT counts as a place comes from categorize() in categories.ts: the very same
// function the app uses, so a pack can never disagree with the app.

import { categorize } from "./categories.ts";
import { PACK_TAG_KEYS } from "./osmFilters.ts";

export type PackPlace = {
  type: "n" | "w" | "r"; // node, way, or relation: the first letter
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

type Position = number[];
type Geometry = {
  type: string;
  coordinates: Position | Position[] | Position[][] | Position[][][];
};

/** The middle of a shape: a point is itself; a building is the middle of its outline's box. */
export function centerOf(geometry: Geometry): { lat: number; lon: number } | null {
  let ring: Position[];
  if (geometry.type === "Point") {
    const [lon, lat] = geometry.coordinates as Position;
    return { lat, lon };
  } else if (geometry.type === "Polygon") {
    ring = (geometry.coordinates as Position[][])[0];
  } else if (geometry.type === "MultiPolygon") {
    ring = (geometry.coordinates as Position[][][])[0][0];
  } else {
    return null; // lines and other shapes aren't places we show
  }
  if (!ring || ring.length === 0) return null;
  let [minLon, maxLon, minLat, maxLat] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 };
}

/**
 * Buildings and other shapes come out of osmium as "areas" (prefix a), numbered
 * from the object they were made from: a way's area is twice its id, and a
 * relation's area is twice its id plus one. This turns that back into the
 * original way or relation, so the link to openstreetmap.org works.
 */
export function originalId(
  prefix: string,
  number: number,
): { type: PackPlace["type"]; id: number } {
  if (prefix !== "a") return { type: prefix as PackPlace["type"], id: number };
  return number % 2 === 0 ? { type: "w", id: number / 2 } : { type: "r", id: (number - 1) / 2 };
}

/**
 * One line of `osmium export -f geojsonseq --add-unique-id=type_id` output.
 * Returns the place, or null if it isn't something the app shows (or the line is empty).
 */
export function featureToPlace(line: string): PackPlace | null {
  // osmium starts each line with an invisible "record separator" character.
  const text = line.replaceAll("\u001e", "").trim();
  if (!text) return null;
  const feature = JSON.parse(text) as {
    id?: string;
    geometry?: Geometry;
    properties?: Record<string, string>;
  };
  const match = /^([nwra])(\d+)$/.exec(feature.id ?? "");
  const tags = feature.properties ?? {};
  if (!match || !feature.geometry || categorize(tags) === null) return null;
  const center = centerOf(feature.geometry);
  if (!center) return null;

  // Keep only the tags the app reads; positions to about 1 meter (smaller files).
  const kept: Record<string, string> = {};
  for (const key of PACK_TAG_KEYS) if (tags[key] !== undefined) kept[key] = tags[key];
  const { type, id } = originalId(match[1], Number(match[2]));
  return {
    type,
    id,
    lat: Math.round(center.lat * 1e5) / 1e5,
    lon: Math.round(center.lon * 1e5) / 1e5,
    tags: kept,
  };
}
