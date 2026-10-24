// What we show when the phone's location can't be used: a plain message, and,
// for "blocked" and "couldn't find it", step-by-step help for this kind of phone
// (see src/lib/locationHelp.ts). Typing a city instead is always offered nearby.

import { useT } from "../i18n/useT";
import type { LocationErrorKind } from "../lib/location";
import { locationHelpKind } from "../lib/locationHelp";

// Read once: the kind of phone and browser doesn't change while the app is open.
const helpKind = locationHelpKind(
  navigator.userAgent,
  (navigator as Navigator & { standalone?: boolean }).standalone === true,
);

export function LocationProblem({ kind, detail }: { kind: LocationErrorKind; detail?: string }) {
  const { t } = useT();
  return (
    <div className="location-problem" role="alert">
      <p className="form-error">{t(`location.${kind}`)}</p>
      {kind !== "unsupported" && (
        <details className="location-help" open>
          <summary>{t("location.helpTitle")}</summary>
          <p>{t(`location.help.${helpKind}`)}</p>
        </details>
      )}
      {/* The browser's own error, in small print, so a problem can be reported exactly. */}
      {detail && <p className="location-detail">{detail}</p>}
    </div>
  );
}
