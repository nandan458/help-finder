// Gets the phone's location using the browser's Geolocation API.
// The location stays in memory only: we never save it or send it anywhere
// except (rounded to about 100 m) to the map data server in overpass.ts.

import type { LatLng } from "./geo";

/**
 * The spot we measure distances from: the phone's location ("gps"), a place
 * the person typed, or a place from a shared link.
 */
export type Origin = LatLng & { source: "gps" | "typed" | "shared"; label?: string };

export type LocationErrorKind = "denied" | "unavailable" | "unsupported";

export class LocationError extends Error {
  kind: LocationErrorKind;
  constructor(kind: LocationErrorKind) {
    super(`Location failed: ${kind}`);
    this.name = "LocationError";
    this.kind = kind;
  }
}

/**
 * Ask the phone where it is. The first time, the browser shows its
 * "Allow location?" prompt.
 */
export function getCurrentLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new LocationError("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) =>
        reject(
          new LocationError(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
        ),
      {
        // Rough location (Wi-Fi / cell towers) is enough to find places nearby,
        // and it is much faster and easier on the battery than GPS.
        enableHighAccuracy: false,
        timeout: 15_000,
        // A location from the last 5 minutes is fine to reuse.
        maximumAge: 5 * 60_000,
      },
    );
  });
}

/**
 * Has the person already said yes to location? Lets us skip the welcome screen
 * for returning visitors. Some browsers can't answer this, so "unknown" is possible.
 */
export async function locationPermission(): Promise<PermissionState | "unknown"> {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unknown";
  }
}
