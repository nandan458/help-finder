// What the list area shows while it isn't showing places:
// loading, "nothing found", or an error with a Retry button.

import { useEffect, useState } from "react";
import { useT } from "../i18n/useT";
import type { FetchErrorKind } from "../lib/overpass";
import { HelpLinesList } from "./HelpLines";

/** Gray placeholder rows, so the screen doesn't jump when results arrive. */
export function LoadingRows() {
  const { t } = useT();
  // The free map server can be slow. After 8 seconds, say so, so people don't give up.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loading">
      {slow && <p className="muted">{t("search.slow")}</p>}
      <ul className="place-list" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <li key={n} className="skeleton-row">
            <span className="skeleton skeleton-dot" />
            <span className="skeleton-lines">
              <span className="skeleton" />
              <span className="skeleton skeleton-short" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type EmptyProps = {
  fartherLabel?: string; // e.g. "25 mi"; missing when there's nowhere farther to look
  onFarther: () => void;
};

/** Nothing found. Offer to look farther, and show the help lines so no one leaves empty-handed. */
export function EmptyState({ fartherLabel, onFarther }: EmptyProps) {
  const { t } = useT();
  return (
    <div className="state-card">
      {fartherLabel && (
        <button type="button" className="button" onClick={onFarther}>
          {t("empty.farther", { radius: fartherLabel })}
        </button>
      )}
      <HelpLinesList />
    </div>
  );
}

export function ErrorState({ kind, onRetry }: { kind: FetchErrorKind; onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="state-card" role="alert">
      <p>{t(`error.${kind}`)}</p>
      <button type="button" className="button" onClick={onRetry}>
        {t("error.retry")}
      </button>
    </div>
  );
}
