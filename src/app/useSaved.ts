// Saved places, kept on this device only. We store the whole place (name,
// hours, phone...), not just its id, so the Saved list works with no internet.

import { useCallback, useState } from "react";
import type { Place } from "../lib/overpass";
import { loadJSON, removeSetting, saveJSON } from "../lib/storage";

function loadSaved(): Place[] {
  const saved = loadJSON<Place[]>("saved");
  return Array.isArray(saved) ? saved : [];
}

export function useSaved() {
  const [saved, setSaved] = useState<Place[]>(loadSaved);

  const toggle = useCallback(
    (place: Place) => {
      const next = saved.some((p) => p.id === place.id)
        ? saved.filter((p) => p.id !== place.id)
        : [...saved, place];
      setSaved(next);
      saveJSON("saved", next);
    },
    [saved],
  );

  const isSaved = useCallback((id: string) => saved.some((p) => p.id === id), [saved]);

  /** Forget all saved places (part of "Clear data on this device"). */
  const clear = useCallback(() => {
    setSaved([]);
    removeSetting("saved");
  }, []);

  return { saved, toggle, isSaved, clear };
}
