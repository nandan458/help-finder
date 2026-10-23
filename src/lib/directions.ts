// Walking directions open in the phone's own maps app. We don't draw the route
// ourselves: those apps already do it well, with turn-by-turn and transit.

import type { LatLng } from "./geo";

/** iPhones and iPads use Apple's maps app. Newer iPads say they're Macs, but have touch. */
export function isApplePhone(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return userAgent.includes("Macintosh") && maxTouchPoints > 1;
}

/**
 * A link that opens walking directions from wherever the person is to `to`.
 * On iPhone it opens Apple's maps app; elsewhere Google's, which Android
 * phones open in their maps app and computers open in the browser.
 */
export function directionsUrl(to: LatLng, apple: boolean): string {
  const where = `${to.lat},${to.lng}`;
  if (apple) return `https://maps.apple.com/?daddr=${where}&dirflg=w`;
  return `https://www.google.com/maps/dir/?api=1&destination=${where}&travelmode=walking`;
}
