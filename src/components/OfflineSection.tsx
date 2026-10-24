// Settings → "Offline use": save the state you're in on the phone, so searches
// are instant and work in airplane mode. The files come from the weekly packs
// (see src/lib/packs.ts). Hidden when this copy of the app has no packs.

import { usePack } from "../app/usePack";
import { useT } from "../i18n/useT";
import type { LatLng } from "../lib/geo";

export function OfflineSection({ where }: { where: LatLng }) {
  const { t } = useT();
  const { hasPacks, state, mine, upToDate, progress, failed, save } = usePack(where);

  if (!hasPacks) return null; // no packs here (for example when testing on a computer)

  return (
    <section className="settings-section" aria-labelledby="offline-title">
      <h3 id="offline-title">{t("settings.offline")}</h3>
      {!state ? (
        <p>{t("pack.none")}</p>
      ) : (
        <>
          <p>{t("pack.about", { state: state.name })}</p>
          {mine && (
            <p className="settings-done">
              {t("pack.saved", {
                state: state.name,
                size: Math.max(0.1, mine.bytes / 1_048_576).toFixed(1),
              })}
            </p>
          )}
          {!upToDate && !progress && (
            <button type="button" className="button" onClick={() => void save()}>
              {mine ? t("pack.update") : t("pack.download", { state: state.name })}
            </button>
          )}
          {/* role="status" makes screen readers announce the progress. */}
          <p role="status" className="muted">
            {progress ? t("pack.downloading", progress) : ""}
          </p>
          {failed && (
            <p className="form-error" role="alert">
              {t("pack.failed")}
            </p>
          )}
          <p className="muted">{t("pack.mapNote")}</p>
        </>
      )}
    </section>
  );
}
