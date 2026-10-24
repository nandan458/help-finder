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
  // The browser's own words for what went wrong, shown in small print so a bug
  // report can say exactly what the phone answered (for example "code 1, denied").
  detail: string;
  constructor(kind: LocationErrorKind, detail = "") {
    super(`Location failed: ${kind}`);
    this.name = "LocationError";
    this.kind = kind;
    this.detail = detail;
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
      (error) => {
        // Codes: 1 = not allowed, 2 = couldn't find the position, 3 = took too long.
        const kind = error.code === error.PERMISSION_DENIED ? "denied" : "unavailable";
        const said = `code ${error.code}${error.message ? `: ${error.message}` : ""}`;
        // Also note what the browser says the site's permission is (allowed / blocked / ask).
        void locationPermission().then((state) =>
          reject(new LocationError(kind, `${said}; permission: ${state}`)),
        );
      },
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
