// Everything about saving your state for offline use, in one place, so the
// Settings section and the "Save for offline?" prompt behave the same:
// which state you're in, whether it's saved, and the save button's progress.

import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "../lib/geo";
import {
  loadIndex,
  savedStates,
  saveState,
  stateAt,
  type PackIndex,
  type SavedState,
} from "../lib/packs";

export type PackProgress = { done: number; total: number };

export function usePack(where: LatLng) {
  const [index, setIndex] = useState<PackIndex | null>(null);
  const [saved, setSaved] = useState<Record<string, SavedState>>({});
  const [progress, setProgress] = useState<PackProgress | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void loadIndex().then(setIndex);
    void savedStates().then(setSaved);
  }, []);

  // The state around `where`, or null if there are no packs or it's outside the U.S.
  const state = index ? stateAt(where, index) : null;
  const mine = state ? saved[state.code] : undefined;
  const upToDate = !!mine && mine.builtAt === index?.builtAt;

  /** Download the whole state onto the phone. Returns true if it worked. */
  const save = useCallback(async (): Promise<boolean> => {
    if (!state) return false;
    setFailed(false);
    setProgress({ done: 0, total: 1 });
    try {
      await saveState(state.code, (done, total) => setProgress({ done, total }));
      setSaved(await savedStates());
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      setProgress(null);
    }
  }, [state]);

  return { hasPacks: index !== null, state, mine, upToDate, progress, failed, save };
}
