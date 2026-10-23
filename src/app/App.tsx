// The top of the app. On the very first visit it asks for a language. Until we
// know where to search it shows the welcome screens (what do you need, where
// are you); after that, the map and list.

import { useCallback, useEffect, useState } from "react";
import { LanguageScreen } from "../components/LanguageScreen";
import { PermissionScreen } from "../components/PermissionScreen";
import type { Category } from "../lib/categories";
import { pruneCache, saveLastSearch } from "../lib/cache";
import { loadHours } from "../lib/hours";
import type { Origin } from "../lib/location";
import { readSharedPlace } from "../lib/share";
import { loadSetting } from "../lib/storage";
import { FinderScreen } from "./FinderScreen";
import { useNearbySearch } from "./useNearbySearch";
import "./App.css";

export function App() {
  // Was the app opened from a link to one place? Read once, when it starts.
  const [shared] = useState(() => readSharedPlace(window.location.search));
  // Where distances are measured from. The exact spot is kept in memory only;
  // a rounded version (about 1 km) is saved so results can be shown offline.
  // A shared link starts right at that place, skipping the welcome screen.
  const [origin, setOrigin] = useState<Origin | null>(() =>
    shared ? { lat: shared.lat, lng: shared.lng, source: "shared" } : null,
  );
  const { state, search, retry } = useNearbySearch();
  // Has the person picked a language yet? Only the first visit asks.
  const [languageChosen, setLanguageChosen] = useState(() => loadSetting("lang") !== null);
  // What they said they need ("food", "shelter"...): the filters to start with.
  const [startCategories, setStartCategories] = useState<Category[]>([]);
  const [hoursLoaded, setHoursLoaded] = useState(false);

  useEffect(() => {
    // Start downloading the opening-hours library now, while the person is
    // still reading the welcome screen or waiting for results.
    // If it fails (say, no signal), hours just show as unknown.
    loadHours()
      .catch(() => {})
      .finally(() => setHoursLoaded(true));
    // Once per visit, delete saved search results older than a week.
    void pruneCache();
  }, []);

  // Every new location (from the phone, typed, or a shared link) starts a new search there.
  // useCallback keeps this the same function between redraws.
  const goTo = useCallback(
    (next: Origin) => {
      setOrigin(next);
      void search(next);
      void saveLastSearch(next);
    },
    [search],
  );

  // Opened from a shared link: start searching around that place right away.
  useEffect(() => {
    if (shared) void search(shared);
  }, [shared, search]);

  if (!origin && !languageChosen && !shared) {
    return <LanguageScreen onChosen={() => setLanguageChosen(true)} />;
  }
  if (!origin) return <PermissionScreen onLocation={goTo} onNeed={setStartCategories} />;

  return (
    <FinderScreen
      origin={origin}
      onOrigin={goTo}
      search={state}
      onSearch={(center, radii) => void search(center, radii)}
      onRetry={retry}
      hoursLoaded={hoursLoaded}
      initialOpenId={shared?.id ?? null}
      initialCategories={startCategories}
    />
  );
}
