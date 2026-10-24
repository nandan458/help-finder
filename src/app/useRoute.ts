// Gets a route (walking, biking, or driving) to `to`, or nothing when `to` is null.
//
// Where the trip starts:
// - if we have the phone's location, from there
// - otherwise we ask for the phone's location now, so the route starts where
//   the person actually is
// - if that's not allowed, from the place they typed
// - a shared link with no location has no sensible start, so: "noStart"

import { useEffect, useState } from "react";
import type { LatLng } from "../lib/geo";
import { getCurrentLocation, type Origin } from "../lib/location";
import {
  RouteError,
  travelRoute,
  type Route,
  type RouteErrorKind,
  type TravelMode,
} from "../lib/route";

export type RouteStart = { spot: LatLng; fromYou: boolean };

export type RouteState =
  | { status: "idle" }
  | { status: "locating" } // asking the phone where it is
  | { status: "noStart" }
  | { status: "loading"; start: RouteStart }
  | { status: "done"; start: RouteStart; route: Route }
  | { status: "error"; start: RouteStart; errorKind: RouteErrorKind };

export function useRoute(origin: Origin, to: LatLng | null, mode: TravelMode, lang: string) {
  // The phone's location, looked up when the origin isn't already it.
  // Remembers which origin it was looked up for, so a new origin looks again.
  const [lookup, setLookup] = useState<{ forOrigin: Origin; spot: LatLng | null } | null>(null);
  // The latest route answer, and what it was for (so an old answer is never shown).
  const [answer, setAnswer] = useState<{
    key: string;
    route?: Route;
    errorKind?: RouteErrorKind;
  } | null>(null);
  // Bumping this asks again (the Try again button).
  const [attempt, setAttempt] = useState(0);

  const needLookup = to !== null && origin.source !== "gps" && lookup?.forOrigin !== origin;

  useEffect(() => {
    if (!needLookup) return;
    let ignore = false;
    getCurrentLocation()
      .then((spot) => !ignore && setLookup({ forOrigin: origin, spot }))
      .catch(() => !ignore && setLookup({ forOrigin: origin, spot: null }));
    return () => {
      ignore = true;
    };
  }, [needLookup, origin]);

  // Work out the starting point from what we know so far.
  let start: RouteStart | "locating" | "noStart" | null = null;
  if (to) {
    if (origin.source === "gps") start = { spot: origin, fromYou: true };
    else if (needLookup) start = "locating";
    else if (lookup?.spot) start = { spot: lookup.spot, fromYou: true };
    else if (origin.source === "typed") start = { spot: origin, fromYou: false };
    else start = "noStart";
  }

  const startSpot = typeof start === "object" && start ? start.spot : null;
  const key =
    to && startSpot
      ? `${mode}|${lang}|${startSpot.lat},${startSpot.lng}|${to.lat},${to.lng}|${attempt}`
      : null;

  useEffect(() => {
    if (!key || !to || !startSpot) return;
    let ignore = false;
    travelRoute(startSpot, to, mode, lang)
      .then((route) => !ignore && setAnswer({ key, route }))
      .catch((err: unknown) => {
        const errorKind = err instanceof RouteError ? err.kind : "server";
        if (!ignore) setAnswer({ key, errorKind });
      });
    return () => {
      ignore = true;
    };
  }, [key, to, startSpot, mode, lang]);

  let state: RouteState = { status: "idle" };
  if (start === "locating") state = { status: "locating" };
  else if (start === "noStart") state = { status: "noStart" };
  else if (start) {
    const current = answer?.key === key ? answer : null;
    if (current?.route) state = { status: "done", start, route: current.route };
    else if (current?.errorKind) state = { status: "error", start, errorKind: current.errorKind };
    else state = { status: "loading", start };
  }

  return { state, retry: () => setAttempt((n) => n + 1) };
}
