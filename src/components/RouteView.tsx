// Walking directions to one place: time and distance, then each step.
// The route line itself is drawn on the map by MapView.

import { useEffect, useRef } from "react";
import type { WalkingRouteState } from "../app/useWalkingRoute";
import { useT } from "../i18n/useT";
import { ROUTE_LANGUAGES } from "../lib/route";
import { directionsUrl, isApplePhone } from "../lib/directions";
import { formatDistance } from "../lib/geo";
import type { Origin } from "../lib/location";
import type { Place } from "../lib/overpass";
import { LoadingRows } from "./SearchStates";

type Props = {
  place: Place;
  origin: Origin;
  miles: boolean;
  route: WalkingRouteState;
  onRetry: () => void;
  onBack: () => void;
};

const apple = isApplePhone(navigator.userAgent, navigator.maxTouchPoints);

export function RouteView({ place, origin, miles, route, onRetry, onBack }: Props) {
  const { t, lang } = useT();
  const title = useRef<HTMLHeadingElement>(null);
  const name = place.name ?? t(`unnamed.${place.category}`);

  // Start keyboard and screen reader users at the top of the directions.
  useEffect(() => {
    title.current?.focus();
  }, []);

  // Escape goes back to the place, unless a pop-up is open on top.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) onBack();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onBack]);

  // The phone's maps app, as a backup and for live turn-by-turn navigation.
  const mapsAppLink = (
    <a href={directionsUrl(place, apple)} target="_blank" rel="noreferrer">
      {t("route.openApp")}
    </a>
  );

  return (
    <section className="route-view" aria-labelledby="route-title">
      <button type="button" className="link-button" onClick={onBack}>
        ‹ {t("route.back")}
      </button>

      <header>
        <h2 id="route-title" className="card-title" ref={title} tabIndex={-1}>
          {t("route.title")}
        </h2>
        <p className="muted">{t("route.to", { place: name })}</p>
        {"start" in route && (
          <p className="muted">
            {route.start.fromYou
              ? t("route.fromYou")
              : t("route.fromPlace", { place: origin.label ?? "" })}
          </p>
        )}
      </header>

      {/* Screen readers announce changes here: "Finding a walking route…", then the time. */}
      <div aria-live="polite">
        {(route.status === "locating" || route.status === "loading") && (
          <>
            <p className="summary">{t("route.loading")}</p>
            <LoadingRows />
          </>
        )}

        {route.status === "noStart" && (
          <div className="state-card">
            <p>{t("route.noStart")}</p>
            {mapsAppLink}
          </div>
        )}

        {route.status === "error" && (
          <div className="state-card" role="alert">
            <p>{t(`route.error.${route.errorKind}`)}</p>
            <button type="button" className="button" onClick={onRetry}>
              {t("error.retry")}
            </button>
            {mapsAppLink}
          </div>
        )}

        {route.status === "done" && (
          <p className="route-summary">
            <strong>
              {t("route.minutes", { minutes: Math.max(1, Math.round(route.route.seconds / 60)) })}
            </strong>
            {" · "}
            {formatDistance(route.route.meters, miles)}
          </p>
        )}
      </div>

      {route.status === "done" && (
        <>
          {!ROUTE_LANGUAGES.includes(lang) && <p className="muted">{t("route.languageNote")}</p>}
          <ol className="route-steps">
            {route.route.steps.map((step, i) => (
              <li key={i}>
                <span>{step.instruction}</span>
                {step.meters > 0 && (
                  <span className="muted">{formatDistance(step.meters, miles)}</span>
                )}
              </li>
            ))}
          </ol>
          <p>{mapsAppLink}</p>
          <p className="muted card-note">
            {t("route.credit")}{" "}
            <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">
              {t("map.reportError")}
            </a>
          </p>
        </>
      )}
    </section>
  );
}
