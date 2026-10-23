// App-wide settings live here so they are easy to find and change.
// To rename the app, change APP_NAME. The page title uses it too
// (vite.config.ts copies it into index.html when the app is built).

export const APP_NAME = "Help Finder";

// Search radii in meters, tried in order. We start small (fast, and the
// closest help matters most) and only look farther when we find too few places.
export const SEARCH_RADII_M = [2000, 5000, 15000];

// Fewer places than this means "look farther".
export const ENOUGH_PLACES = 5;

// When even the biggest radius finds nothing, the empty screen offers one more,
// much wider search. This only happens in rural areas, where it stays small.
export const FARTHER_RADIUS_M = 40000;
