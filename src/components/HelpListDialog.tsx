// A "help list" for the places currently on screen (so it respects the need and
// filters the person picked): the nearest few, with address, hours, and phone.
// It can be printed, shared (text message, email...), or copied. This is for the
// people who help others: counselors, librarians, volunteers.

import { useState } from "react";
import { APP_NAME } from "../config";
import { useT } from "../i18n/useT";
import { formatDistance } from "../lib/geo";
import { statusText } from "../lib/hours";
import { helpText, type HelpEntry } from "../lib/helpText";
import { Dialog } from "./Dialog";
import type { NearbyPlace } from "./PlaceList";
import { UiIcon } from "./UiIcon";

const MAX_PLACES = 8; // what fits on one printed page

type Props = {
  open: boolean;
  onClose: () => void;
  items: NearbyPlace[]; // closest first
  now: Date;
  miles: boolean;
  where: string; // "Near you" / "Near Baltimore"
};

export function HelpListDialog({ open, onClose, items, now, miles, where }: Props) {
  const { t, locale } = useT();
  const [copied, setCopied] = useState(false);

  const entries: HelpEntry[] = items.slice(0, MAX_PLACES).map(({ place, meters, status }) => ({
    name: place.name ?? t(`unnamed.${place.category}`),
    kind: t(`category.${place.category}`),
    status: statusText(status, now, t, locale).text,
    distance: formatDistance(meters, miles),
    address: place.address,
    phone: place.phone,
  }));

  const title = `${APP_NAME} · ${where}`;
  const pageUrl = window.location.origin + window.location.pathname;
  const footer = [t("helpcard.lines"), t("helpcard.footer"), pageUrl];
  const text = helpText(title, entries, footer);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {
        // The person closed the share menu. Nothing to do.
      }
      return;
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt(t("card.copyThis"), text);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        setCopied(false);
        onClose();
      }}
      title={t("helpcard.heading")}
    >
      {entries.length === 0 ? (
        <p>{t("helpcard.empty")}</p>
      ) : (
        <>
          <div className="helpcard-actions">
            <button type="button" className="button" onClick={() => window.print()}>
              {t("helpcard.print")}
            </button>
            <button type="button" className="button button-secondary" onClick={() => void share()}>
              <UiIcon name="share" />
              {t("helpcard.share")}
            </button>
            <button type="button" className="button button-secondary" onClick={() => void copy()}>
              {t("helpcard.copy")}
            </button>
          </div>
          {/* role="status" makes screen readers announce it. */}
          <p role="status" className="settings-done">
            {copied ? t("helpcard.copied") : ""}
          </p>
          {/* This block is what gets printed (see the print rules in App.css). */}
          <article className="helpcard">
            <h3 className="helpcard-title">{title}</h3>
            <ol className="helpcard-list">
              {entries.map((entry, i) => (
                <li key={i}>
                  <strong>{entry.name}</strong> <span className="muted">({entry.kind})</span>
                  <br />
                  {entry.status} · {entry.distance}
                  {entry.address && (
                    <>
                      <br />
                      {entry.address}
                    </>
                  )}
                  {entry.phone && (
                    <>
                      <br />
                      <a href={`tel:${entry.phone}`}>{entry.phone}</a>
                    </>
                  )}
                </li>
              ))}
            </ol>
            <p className="helpcard-lines">{t("helpcard.lines")}</p>
            <p className="muted helpcard-footer">{t("helpcard.footer")}</p>
            <p className="muted helpcard-footer">{pageUrl}</p>
          </article>
        </>
      )}
    </Dialog>
  );
}
