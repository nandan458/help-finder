// Directions to one place: pick how you're traveling (walk, bike, drive, or bus
// or train), then see the time, distance, and each step.
// The route line itself is drawn on the map by MapView.
// Bus and train times can't be worked out from free map data, so that choice
// opens the phone's maps app, which has the live schedules.

import { useEffect, useRef } from "react";
import type { RouteState } from "../app/useRoute";
import { useT } from "../i18n/useT";
import { directionsUrl, isApplePhone } from "../lib/directions";
import { formatDistance } from "../lib/geo";
import type { Origin } from "../lib/location";
import type { Place } from "../lib/overpass";
import { mapsModeFor, ROUTE_CHOICES, ROUTE_LANGUAGES, type RouteChoice } from "../lib/route";
import { LoadingRows } from "./SearchStates";

type Props = {
  place: Place;
  origin: Origin;
  miles: boolean;
  choice: RouteChoice;
  onChoice: (choice: RouteChoice) => void;
  route: RouteState;
  onRetry: () => void;
  onBack: () => void;
};

const apple = isApplePhone(navigator.userAgent, navigator.maxTouchPoints);

// Which text says "12 min" for each way of traveling.
const MINUTES_KEY = {
  pedestrian: "route.minutes",
  bicycle: "route.minutes.bicycle",
  auto: "route.minutes.auto",
} as const;

export function RouteView(props: Props) {
  const { place, origin, miles, choice, onChoice, route, onRetry, onBack } = props;
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

  // The phone's maps app, for live turn-by-turn navigation and as a backup.
  const mapsAppLink = (
    <a href={directionsUrl(place, apple, mapsModeFor(choice))} target="_blank" rel="noreferrer">
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
        {choice !== "transit" && "start" in route && (
          <p className="muted">
            {route.start.fromYou
              ? t("route.fromYou")
              : t("route.fromPlace", { place: origin.label ?? "" })}
          </p>
        )}
      </header>

      {/* Side-by-side choices where one is picked. Under the hood they're radio buttons,
          so keyboards and screen readers already know how to use them. */}
      <fieldset className="choice">
        <legend className="visually-hidden">{t("route.mode.label")}</legend>
        <div className="segmented">
          {ROUTE_CHOICES.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name="route-mode"
                value={option}
                checked={choice === option}
                onChange={() => onChoice(option)}
              />
              <span>{t(`route.mode.${option}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {choice === "transit" ? (
        <div className="state-card">
          <p>{t("route.transit")}</p>
          <a
            className="button"
            href={directionsUrl(place, apple, "transit")}
            target="_blank"
            rel="noreferrer"
          >
            {t("route.openApp")}
          </a>
        </div>
      ) : (
        <>
          {/* Screen readers announce changes here: "Finding a route…", then the time. */}
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
                  {t(MINUTES_KEY[choice], {
                    minutes: Math.max(1, Math.round(route.route.seconds / 60)),
                  })}
                </strong>
                {" · "}
                {formatDistance(route.route.meters, miles)}
              </p>
            )}
          </div>

          {route.status === "done" && (
            <>
              {!ROUTE_LANGUAGES.includes(lang) && (
                <p className="muted">{t("route.languageNote")}</p>
              )}
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
            </>
          )}
        </>
      )}

      <p className="muted card-note">
        {t("route.credit")}{" "}
        <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">
          {t("map.reportError")}
        </a>
      </p>
    </section>
  );
}
