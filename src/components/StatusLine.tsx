// "Open · Closes 7:00 PM" with a colored dot. The words carry the meaning;
// the color is only a quick extra hint.

import { useT } from "../i18n/useT";
import { statusText, type HoursStatus } from "../lib/hours";

export function StatusLine({ status, now }: { status: HoursStatus; now: Date }) {
  const { t, locale } = useT();
  const { text, tone } = statusText(status, now, t, locale);
  return (
    <span className={`status status-${tone}`}>
      <span className="status-dot" aria-hidden="true" />
      {text}
    </span>
  );
}
