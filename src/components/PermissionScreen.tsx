// The first screen: explains why we want the location before the browser asks,
// so people know what they're agreeing to. If they say no (or it doesn't work),
// they can type a city or address instead.

import { useEffect, useState } from "react";
import { APP_NAME } from "../config";
import { useLocate } from "../app/useLocate";
import { useOnline } from "../app/useOnline";
import { loadLastSearch, type LastSearch } from "../lib/cache";
import { useT } from "../i18n/useT";
import { locationPermission, type Origin } from "../lib/location";
import { HelpLinesButton } from "./HelpLines";
import { LanguagePicker } from "./LanguagePicker";
import { PlaceSearch } from "./PlaceSearch";
import "./PermissionScreen.css";

type Props = { onLocation: (origin: Origin) => void };

export function PermissionScreen({ onLocation }: Props) {
  const { t } = useT();
  const { locate, locating, errorKind } = useLocate(onLocation);
  const online = useOnline();
  const [lastSearch, setLastSearch] = useState<LastSearch>();

  // Look up where the last search was, in case there's no signal.
  useEffect(() => {
    void loadLastSearch().then(setLastSearch);
  }, []);

  // Returning visitor who already said yes? Skip the question and go straight to the map.
  useEffect(() => {
    void locationPermission().then((state) => {
      if (state === "granted") void locate();
    });
  }, [locate]);

  return (
    <main className="welcome">
      <div className="welcome-top">
        <HelpLinesButton />
        <LanguagePicker />
      </div>

      <div className="welcome-card">
        <h1>{APP_NAME}</h1>
        <p className="welcome-lead">{t("welcome.body")}</p>

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

        <button
          type="button"
          className="button button-big"
          onClick={() => void locate()}
          disabled={locating}
        >
          {locating ? t("location.finding") : t("location.use")}
        </button>
        <p className="welcome-privacy">{t("welcome.privacy")}</p>

        {errorKind && (
          <p className="form-error" role="alert">
            {t(`location.${errorKind}`)}
          </p>
        )}

        <h2 className="welcome-or">{t("location.or")}</h2>
        {/* After a "no", the key changes, so the box is re-created and gets the focus. */}
        <PlaceSearch key={errorKind ?? "start"} onFound={onLocation} autoFocus={!!errorKind} />
      </div>
    </main>
  );
}
