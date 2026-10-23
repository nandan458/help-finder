// Distance math and formatting.

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;

/**
 * Straight-line distance between two points in meters ("as the crow flies").
 * Uses the haversine formula, which accounts for the Earth being round.
 * Real walking distance is longer because streets aren't straight lines.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Rough walking time in whole minutes.
 * We assume 80 meters per minute (about 3 mph), a bit slower than average,
 * and add 30% because streets zig-zag. Better to arrive early than late.
 */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.ceil((meters * 1.3) / 80));
}

/**
 * Round a coordinate. 3 decimal places is about 100 m; 2 is about 1 km.
 * We round before sending a location to any server, so it never gets your exact spot.
 */
export function roundCoord(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** The U.S., Liberia, and Myanmar use miles; everyone else uses kilometers. */
export function usesMiles(locale: string): boolean {
  const region = new Intl.Locale(locale).maximize().region;
  return region === "US" || region === "LR" || region === "MM";
}

/** "0.3 mi" / "450 m" / "2 km" style labels. */
export function formatDistance(meters: number, miles: boolean): string {
  if (miles) {
    const mi = meters / 1609.344;
    // Under 0.1 mile, feet are easier to picture than "0.0 mi".
    if (mi < 0.1) return `${Math.max(50, Math.round((meters * 3.281) / 50) * 50)} ft`;
    return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1).replace(/\.0$/, "")} km` : `${Math.round(km)} km`;
}
