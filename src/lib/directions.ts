// Directions that open in the phone's own maps app: for live turn-by-turn
// navigation, and for bus and train times, which only the maps apps have.

import type { LatLng } from "./geo";

/** iPhones and iPads use Apple's maps app. Newer iPads say they're Macs, but have touch. */
export function isApplePhone(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return userAgent.includes("Macintosh") && maxTouchPoints > 1;
}

/** The ways to get there that the phone's maps app understands. */
export type MapsMode = "walking" | "bicycling" | "driving" | "transit";

// Apple's maps links say how to travel with a one-letter flag. They have no
// cycling flag, so for biking the link opens with Apple's own default.
const APPLE_FLAG: Record<MapsMode, string> = {
  walking: "w",
  driving: "d",
  transit: "r",
  bicycling: "",
};

/**
 * A link that opens directions from wherever the person is to `to`.
 * On iPhone it opens Apple's maps app; elsewhere Google's, which Android
 * phones open in their maps app and computers open in the browser.
 */
export function directionsUrl(to: LatLng, apple: boolean, mode: MapsMode = "walking"): string {
  const where = `${to.lat},${to.lng}`;
  if (apple) {
    const flag = APPLE_FLAG[mode];
    return `https://maps.apple.com/?daddr=${where}${flag ? `&dirflg=${flag}` : ""}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${where}&travelmode=${mode}`;
}
