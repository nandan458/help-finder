// A card shown after a search: "Save Maryland so this works with no signal?"
// Offline use is the app's biggest strength, but it needs one tap while there's
// still a connection, and most people would never look in Settings for it.
// It shows only when the packs cover where you are, you're online, this state
// isn't saved yet, and you haven't said "Not now" for this state.

import { useState } from "react";
import { usePack } from "../app/usePack";
import { useOnline } from "../app/useOnline";
import { useT } from "../i18n/useT";
import type { LatLng } from "../lib/geo";
import { loadJSON, saveJSON } from "../lib/storage";
import { UiIcon } from "./UiIcon";

const DISMISSED_KEY = "packPromptDismissed";

export function SavePrompt({ where }: { where: LatLng }) {
  const { t } = useT();
  const online = useOnline();
  const { state, mine, progress, failed, save } = usePack(where);
  // States where the person said "Not now", remembered on this phone.
  const [dismissed, setDismissed] = useState<string[]>(
    () => loadJSON<string[]>(DISMISSED_KEY) ?? [],
  );
  // True for the moment after a successful save, so we can say "saved" before hiding.
  const [justSaved, setJustSaved] = useState(false);

  if (!state || !online) return null;
  if ((mine && !justSaved) || (dismissed.includes(state.code) && !justSaved)) return null;

  function dismiss() {
    if (!state) return;
    const next = [...dismissed, state.code];
    setDismissed(next);
    saveJSON(DISMISSED_KEY, next);
    setJustSaved(false);
  }

  return (
    <section className="save-prompt" aria-label={t("settings.offline")}>
      <UiIcon name="save" />
      <div>
        {justSaved && mine ? (
          <p role="status">
            {t("pack.saved", {
              state: state.name,
              size: Math.max(0.1, mine.bytes / 1_048_576).toFixed(1),
            })}
          </p>
        ) : (
          <>
            <p>{t("pack.about", { state: state.name })}</p>
            <div className="save-prompt-actions">
              <button
                type="button"
                className="button"
                disabled={!!progress}
                onClick={() => void save().then((ok) => ok && setJustSaved(true))}
              >
                {progress
                  ? t("pack.downloading", progress)
                  : t("pack.download", { state: state.name })}
              </button>
              {!progress && (
                <button type="button" className="link-button" onClick={dismiss}>
                  {t("pack.notNow")}
                </button>
              )}
            </div>
            {failed && (
              <p className="form-error" role="alert">
                {t("pack.failed")}
              </p>
            )}
          </>
        )}
      </div>
      {justSaved && (
        <button type="button" className="link-button" onClick={dismiss}>
          {t("common.close")}
        </button>
      )}
    </section>
  );
}
