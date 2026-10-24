// The welcome screen, in two steps:
//   1. "What do you need?" Big buttons: food, health care, a place to stay...
//      so people get to what matters in one tap, even if reading is hard.
//   2. "Where are you?" We explain why we want the location before the browser
//      asks, so people know what they're agreeing to. If they say no (or it
//      doesn't work), they can type a city or address instead.

import { useEffect, useState, type CSSProperties } from "react";
import { useLocate } from "../app/useLocate";
import { useOnline } from "../app/useOnline";
import { loadLastSearch, type LastSearch } from "../lib/cache";
import type { Category } from "../lib/categories";
import { useT } from "../i18n/useT";
import { locationPermission, type Origin } from "../lib/location";
import { categoriesForNeed, NEEDS, type Need } from "../lib/needs";
import { CategoryIcon } from "./CategoryIcon";
import { Hero } from "./Hero";
import { HelpLinesButton } from "./HelpLines";
import { LanguagePicker } from "./LanguagePicker";
import { LocationProblem } from "./LocationProblem";
import { PlaceSearch } from "./PlaceSearch";
import "./PermissionScreen.css";

type Props = {
  onLocation: (origin: Origin) => void;
  onNeed: (categories: Category[]) => void;
};

// The icon shown on each need's button (the "show everything" button has none).
const NEED_ICON: Record<Exclude<Need, "all">, Category> = {
  food: "food",
  health: "health",
  shelter: "shelter",
  internet: "internet",
  water: "water",
  restroom: "restroom",
};

export function PermissionScreen({ onLocation, onNeed }: Props) {
  const { t } = useT();
  const { locate, locating, errorKind } = useLocate(onLocation);
  const online = useOnline();
  const [lastSearch, setLastSearch] = useState<LastSearch>();
  // Which need was picked. Null means we're still on step 1.
  const [need, setNeed] = useState<Need | null>(null);

  // Look up where the last search was, in case there's no signal.
  useEffect(() => {
    void loadLastSearch().then(setLastSearch);
  }, []);

  function choose(next: Need) {
    setNeed(next);
    onNeed(categoriesForNeed(next));
    // Already allowed location before? Go straight to the map; no extra tap.
    void locationPermission().then((state) => {
      if (state === "granted") void locate();
    });
  }

  return (
    <main className="welcome">
      <div className="welcome-top">
        <HelpLinesButton />
        <LanguagePicker />
      </div>

      <Hero compact />

      <div className="welcome-card">
        {/* No signal: offer the results saved on this phone from the last search. */}
        {!online && (
          <div className="offline-card">
            <p role="status">{t("offline.welcome")}</p>
            {lastSearch && (
              <button
                type="button"
                className="button"
                onClick={() =>
                  onLocation({
                    lat: lastSearch.lat,
                    lng: lastSearch.lng,
                    label: lastSearch.label ?? t("offline.lastArea"),
                    source: "typed",
                  })
                }
              >
                {t("offline.showLast")}
              </button>
            )}
          </div>
        )}

        {need === null ? (
          <>
            <h2 className="need-title">{t("need.title")}</h2>
            <p className="muted">{t("need.subtitle")}</p>
            <ul className="need-grid">
              {NEEDS.filter((n) => n !== "all").map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    className="need-button"
                    // Each tile is tinted in its category color (the same one used on the map).
                    style={
                      {
                        "--tint": `var(--cat-${NEED_ICON[n as Exclude<Need, "all">]})`,
                      } as CSSProperties
                    }
                    onClick={() => choose(n)}
                  >
                    <CategoryIcon category={NEED_ICON[n as Exclude<Need, "all">]} />
                    <span>{t(`need.${n}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="button button-secondary" onClick={() => choose("all")}>
              {t("need.all")}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="link-button" onClick={() => setNeed(null)}>
              ‹ {t("common.back")}
            </button>
            <h2 className="need-title">{t("need.where")}</h2>
            <p className="welcome-lead">{t("welcome.body")}</p>

            <button
              type="button"
              className="button button-big"
              onClick={() => void locate()}
              disabled={locating}
            >
              {locating ? t("location.finding") : t("location.use")}
            </button>
            <p className="welcome-privacy">{t("welcome.privacy")}</p>

            {errorKind && <LocationProblem kind={errorKind} />}

            <h3 className="welcome-or">{t("location.or")}</h3>
            {/* After a "no", the key changes, so the box is re-created and gets the focus. */}
            <PlaceSearch key={errorKind ?? "start"} onFound={onLocation} autoFocus={!!errorKind} />
          </>
        )}
      </div>
    </main>
  );
}
