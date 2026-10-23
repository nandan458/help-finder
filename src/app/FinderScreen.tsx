// The main screen: a full-screen map, plus a panel with the search box,
// filters, and the nearby list (or one place's card). On wide screens the
// panel floats on the left; on phones it's a bottom sheet you can drag.

import { useMemo, useState } from "react";
import { APP_NAME, ENOUGH_PLACES, FARTHER_RADIUS_M, SEARCH_RADII_M } from "../config";
import { FilterBar } from "../components/FilterBar";
import { HelpLinesButton, HelpLinesList } from "../components/HelpLines";
import { MapView } from "../components/MapView";
import { PlaceCard } from "../components/PlaceCard";
import { RouteView } from "../components/RouteView";
import { PlaceList, type NearbyPlace } from "../components/PlaceList";
import { PlaceSearch } from "../components/PlaceSearch";
import { EmptyState, ErrorState, LoadingRows } from "../components/SearchStates";
import { SettingsDialog } from "../components/SettingsDialog";
import { Sheet } from "../components/Sheet";
import { sheetHeight, type SheetSize } from "../components/sheetSize";
import { useT } from "../i18n/useT";
import { clearCache } from "../lib/cache";
import { hasFilters, matchesFilters, NO_FILTERS, type Filters } from "../lib/filters";
import { forgetGeocodes } from "../lib/geocode";
import { distanceMeters, formatDistance, usesMiles, type LatLng } from "../lib/geo";
import { hoursStatus, isOpenNow } from "../lib/hours";
import type { Origin } from "../lib/location";
import type { Place } from "../lib/overpass";
import { pageWithoutPlace, placeLink } from "../lib/share";
import { useLocate } from "./useLocate";
import type { SearchState } from "./useNearbySearch";
import { useNow } from "./useNow";
import { useOnline } from "./useOnline";
import { useSaved } from "./useSaved";
import { useViewport } from "./useViewport";
import { useWalkingRoute } from "./useWalkingRoute";

type Props = {
  origin: Origin;
  onOrigin: (origin: Origin) => void;
  search: SearchState;
  onSearch: (center: LatLng, radii?: number[]) => void;
  onRetry: () => void;
  hoursLoaded: boolean; // false until the opening-hours library has arrived
  initialOpenId: string | null; // a place to open right away (from a shared link)
};

const miles = usesMiles(navigator.language);
const NOTHING: Place[] = [];
// On wide screens the panel covers the left 412 px of the map (380 px wide plus gaps).
const PANEL_COVER_PX = 412;

/** Distance from you and open status for one place. */
function describe(place: Place, origin: LatLng, now: Date): NearbyPlace {
  return {
    place,
    meters: distanceMeters(origin, place),
    status: hoursStatus(place.openingHours, now, place),
  };
}

export function FinderScreen(props: Props) {
  const { origin, onOrigin, search, onSearch, onRetry, hoursLoaded, initialOpenId } = props;
  const { t, lang } = useT();
  const now = useNow();
  const online = useOnline();
  const { isPhone, height: screenHeight } = useViewport();
  const { saved, toggle: toggleSaved, isSaved, clear: clearSaved } = useSaved();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showSaved, setShowSaved] = useState(false);
  // The place whose card is open. Its card shows as soon as the place is in the results.
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [returnFocusId, setReturnFocusId] = useState<string | null>(null);
  const [sheetSize, setSheetSize] = useState<SheetSize>("half");
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Showing walking directions for the open place, instead of its card.
  const [directionsOpen, setDirectionsOpen] = useState(false);

  // Any new search closes the card and starts the list fresh.
  function startOver() {
    setOpenId(null);
    setDirectionsOpen(false);
    setReturnFocusId(null);
    window.history.replaceState(null, "", pageWithoutPlace(window.location.href));
  }
  const goTo = (next: Origin) => {
    startOver();
    onOrigin(next);
  };
  const { locate, locating, errorKind: locateError } = useLocate(goTo);

  // Every place we have (search results, or saved places), closest first.
  // Until the hours library arrives we can't say what's open, so there's
  // nothing to list yet (the screen shows loading rows instead).
  // useMemo skips this work when nothing it depends on has changed.
  const source = !hoursLoaded ? NOTHING : showSaved ? saved : search.places;
  const all = useMemo(
    () => source.map((place) => describe(place, origin, now)).sort((a, b) => a.meters - b.meters),
    [source, origin, now],
  );
  const shown = useMemo(
    () => all.filter((i) => matchesFilters(i.place, i.status, filters)),
    [all, filters],
  );
  const openCount = all.filter((i) => isOpenNow(i.status)).length;

  // A place can come from the results or from Saved.
  const findPlace = (id: string | null) =>
    id ? (search.places.find((p) => p.id === id) ?? saved.find((p) => p.id === id)) : undefined;
  const openPlace = findPlace(openId);
  const openItem = openPlace ? describe(openPlace, origin, now) : undefined;
  const walking = useWalkingRoute(origin, directionsOpen && openPlace ? openPlace : null, lang);

  // The page address follows the open card (…?place=node/123&at=…), so the
  // address can be shared or bookmarked, and reloading keeps the card open.
  // replaceState changes the address without adding a step to the Back button.
  function openCard(id: string) {
    setOpenId(id);
    const place = findPlace(id);
    if (place) window.history.replaceState(null, "", placeLink(place, window.location.href));
    // On a phone, make sure there's room to read the card.
    if (sheetSize === "peek") setSheetSize("half");
  }
  function closeCard() {
    setReturnFocusId(openId);
    setOpenId(null);
    setDirectionsOpen(false);
    window.history.replaceState(null, "", pageWithoutPlace(window.location.href));
  }

  async function clearDeviceData() {
    await clearCache();
    forgetGeocodes();
    clearSaved();
    setShowSaved(false);
  }

  const radius = formatDistance(search.radiusM, miles);
  const loading = search.status === "loading";
  const widening = loading && search.radiusM > SEARCH_RADII_M[0];
  const done = search.status === "done";

  // One sentence that screen readers announce whenever it changes,
  // like "12 places within 1.2 mi, 7 open now."
  let summary = "";
  if (showSaved) {
    summary = saved.length ? t("saved.count", { count: saved.length }) : t("saved.none");
  } else if (loading) {
    summary = widening ? t("search.farther", { radius }) : t("search.loading");
  } else if (done && all.length === 0) {
    summary = t("results.none", { radius });
  } else if (done) {
    summary = t("results.count", { count: all.length, radius });
    if (openCount > 0) summary += `, ${t("results.openNow", { count: openCount })}`;
    summary += ".";
  }
  if (!loading && all.length > 0 && hasFilters(filters)) {
    summary += ` ${t("filters.shown", { count: shown.length })}`;
  }

  const header = (
    <header className="panel-header">
      <div>
        <h1 id="panel-title" className="panel-title">
          {APP_NAME}
        </h1>
        <p className="muted">
          {origin.source === "gps"
            ? t("search.nearYou")
            : origin.source === "shared"
              ? t("search.nearShared")
              : t("search.near", { place: origin.label ?? "" })}
        </p>
      </div>
      {/* Help lines stay in the panel, so they're one tap away even when the sheet covers the map. */}
      <HelpLinesButton />
    </header>
  );

  return (
    // <main> marks this as the page's main content, so screen readers can jump to it.
    <main className="finder">
      <Sheet
        isPhone={isPhone}
        screenHeight={screenHeight}
        size={sheetSize}
        onSize={setSheetSize}
        labelledBy="panel-title"
        header={header}
      >
        {!online && (
          <p className="offline-banner" role="status">
            {t("offline.banner")}
          </p>
        )}
        {openItem && directionsOpen ? (
          <RouteView
            place={openItem.place}
            origin={origin}
            miles={miles}
            route={walking.state}
            onRetry={walking.retry}
            onBack={() => setDirectionsOpen(false)}
          />
        ) : openItem ? (
          <PlaceCard
            place={openItem.place}
            meters={openItem.meters}
            miles={miles}
            status={openItem.status}
            now={now}
            saved={isSaved(openItem.place.id)}
            onToggleSave={() => toggleSaved(openItem.place)}
            onDirections={() => setDirectionsOpen(true)}
            onClose={closeCard}
          />
        ) : (
          <>
            <PlaceSearch onFound={goTo} />
            {locateError && (
              <p className="form-error" role="alert">
                {t(`location.${locateError}`)}
              </p>
            )}

            <FilterBar
              filters={filters}
              onChange={setFilters}
              showSaved={showSaved}
              savedCount={saved.length}
              onShowSaved={setShowSaved}
            />

            {/* Screen readers read this sentence out loud whenever it changes. */}
            <p className="summary" aria-live="polite">
              {summary}
            </p>

            {!showSaved && search.status === "error" && search.errorKind && (
              <ErrorState kind={search.errorKind} onRetry={onRetry} />
            )}
            {((!showSaved && loading) || !hoursLoaded) && <LoadingRows />}
            {!showSaved && done && all.length === 0 && search.center && (
              <EmptyState
                fartherLabel={
                  search.radiusM < FARTHER_RADIUS_M
                    ? formatDistance(FARTHER_RADIUS_M, miles)
                    : undefined
                }
                onFarther={() => {
                  startOver();
                  if (search.center) onSearch(search.center, [FARTHER_RADIUS_M]);
                }}
              />
            )}

            {all.length > 0 && shown.length === 0 && (
              <div className="state-card">
                <p>{t("filters.none")}</p>
                <button type="button" className="button" onClick={() => setFilters(NO_FILTERS)}>
                  {t("filters.clear")}
                </button>
              </div>
            )}
            {hoursLoaded && (showSaved || !loading) && shown.length > 0 && (
              <PlaceList
                items={shown}
                now={now}
                miles={miles}
                onOpen={openCard}
                focusId={returnFocusId}
              />
            )}

            {/* Very few places nearby: show the help lines right away. */}
            {!showSaved && done && all.length > 0 && all.length < ENOUGH_PLACES && (
              <section className="state-card" aria-labelledby="few-title">
                <h2 id="few-title" className="state-title">
                  {t("results.few")}
                </h2>
                <HelpLinesList />
              </section>
            )}

            <p className="muted credit">
              {t("data.credit")}{" "}
              {/* The map servers' rules ask apps to link here, so anyone can fix wrong data. */}
              <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">
                {t("map.reportError")}
              </a>
            </p>
          </>
        )}
      </Sheet>

      <div className="finder-map">
        <MapView
          origin={origin}
          places={shown.map((i) => i.place)}
          searchCenter={showSaved ? undefined : search.center}
          radiusM={search.radiusM}
          loading={loading}
          selectedId={openId}
          onSelect={openCard}
          onSearchArea={(center) => {
            startOver();
            setShowSaved(false);
            onSearch(center);
          }}
          coverLeft={isPhone ? 0 : PANEL_COVER_PX}
          coverBottom={isPhone ? sheetHeight(sheetSize, screenHeight) : 0}
          isPhone={isPhone}
          onSettings={() => setSettingsOpen(true)}
          onLocate={() => void locate()}
          locating={locating}
          route={walking.state.status === "done" ? walking.state.route.line : undefined}
        />
      </div>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearData={clearDeviceData}
      />
    </main>
  );
}
