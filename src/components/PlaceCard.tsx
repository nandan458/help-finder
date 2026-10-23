// Everything about one place: status, distance, how to get there, how to
// contact it, and its hours for the week.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { APP_NAME } from "../config";
import { useT } from "../i18n/useT";
import { directionsUrl, isApplePhone } from "../lib/directions";
import { placeLink } from "../lib/share";
import { formatDistance, walkMinutes } from "../lib/geo";
import { speechSupported, useSpeech } from "../app/useSpeech";
import { formatTime, isAllDay, statusText, weekHours, type HoursStatus } from "../lib/hours";
import type { Place } from "../lib/overpass";
import { CategoryIcon } from "./CategoryIcon";
import { StatusLine } from "./StatusLine";
import { UiIcon } from "./UiIcon";

type Props = {
  place: Place;
  meters: number;
  miles: boolean;
  status: HoursStatus;
  now: Date;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
};

const apple = isApplePhone(navigator.userAgent, navigator.maxTouchPoints);

export function PlaceCard(props: Props) {
  const { place, meters, miles, status, now, saved, onToggleSave, onClose } = props;
  const { t, locale } = useT();
  const title = useRef<HTMLHeadingElement>(null);
  const name = place.name ?? t(`unnamed.${place.category}`);
  const minutes = walkMinutes(meters);
  const week = weekHours(place.openingHours, now, place);
  const { speaking, speak, stop } = useSpeech();

  // What "Listen" reads: the most important facts, in order.
  // " · " is swapped for a comma so the voice pauses instead of saying "dot".
  const spokenText = [
    name,
    t(`category.${place.category}`),
    statusText(status, now, t, locale).text.replace(" · ", ", "),
    minutes <= 90 ? t("distance.walk", { minutes }) : formatDistance(meters, miles),
    place.address,
  ]
    .filter(Boolean)
    .join(". ");

  // A different place was opened: stop reading the old one.
  useEffect(() => stop, [place.id, stop]);

  // Which place's link was just copied, so "Link copied" only shows for that place.
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Share uses the phone's own share menu (text message, email, chat...).
  // Where that doesn't exist, we copy the link instead; and if even that's
  // blocked, we show the link so it can be copied by hand.
  async function share() {
    const url = placeLink(place, window.location.href);
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: t("card.shareText", { name, app: APP_NAME }),
          url,
        });
      } catch {
        // The person closed the share menu. Nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(place.id);
    } catch {
      window.prompt(t("card.copyThis"), url);
    }
  }

  // Move keyboard and screen reader focus to the title when the card opens,
  // so they start reading here instead of somewhere in the old list.
  useEffect(() => {
    title.current?.focus();
  }, [place.id]);

  // Escape closes the card, unless a pop-up (like Help lines) is open on top.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <article className="place-card" aria-labelledby="place-title">
      <button type="button" className="link-button" onClick={onClose}>
        ‹ {t("card.back")}
      </button>

      <header className="card-header">
        <CategoryIcon category={place.category} />
        <div>
          <h2 id="place-title" className="card-title" ref={title} tabIndex={-1}>
            {name}
          </h2>
          <p className="muted">{t(`category.${place.category}`)}</p>
          <StatusLine status={status} now={now} />
        </div>
      </header>

      <div className="card-actions">
        <a
          className="action action-primary"
          href={directionsUrl(place, apple)}
          target="_blank"
          rel="noreferrer"
        >
          <UiIcon name="directions" />
          <span>{minutes <= 90 ? t("card.walkMinutes", { minutes }) : t("card.directions")}</span>
        </a>
        <button type="button" className="action" aria-pressed={saved} onClick={onToggleSave}>
          <UiIcon name={saved ? "saved" : "save"} />
          <span>{saved ? t("card.saved") : t("card.save")}</span>
        </button>
        {speechSupported && (
          <button
            type="button"
            className="action"
            onClick={() => (speaking ? stop() : speak(spokenText, locale))}
          >
            <UiIcon name={speaking ? "stop" : "listen"} />
            <span>{speaking ? t("card.stop") : t("card.listen")}</span>
          </button>
        )}
        {place.phone && (
          <a className="action" href={`tel:${place.phone}`}>
            <UiIcon name="call" />
            <span>{t("card.call")}</span>
          </a>
        )}
        <button type="button" className="action" onClick={() => void share()}>
          <UiIcon name="share" />
          <span>{t("card.share")}</span>
        </button>
      </div>
      {/* role="status" makes screen readers announce it. */}
      <p role="status" className="card-copied">
        {copiedId === place.id ? t("card.copied") : ""}
      </p>

      <dl className="card-strip">
        <div>
          <dt>{t("card.hours")}</dt>
          <dd>{t(shortStatusKey(status))}</dd>
        </div>
        <div>
          <dt>{t("card.distance")}</dt>
          <dd>{formatDistance(meters, miles)}</dd>
        </div>
        <div>
          <dt>{t("card.phone")}</dt>
          <dd>{place.phone ? <a href={`tel:${place.phone}`}>{place.phone}</a> : "—"}</dd>
        </div>
      </dl>

      <section className="card-section" aria-labelledby="details-title">
        <h3 id="details-title">{t("card.details")}</h3>
        <dl className="details">
          {place.address && <Detail label={t("card.address")}>{place.address}</Detail>}
          {place.website && (
            <Detail label={t("card.website")}>
              <a href={place.website} target="_blank" rel="noreferrer">
                {place.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            </Detail>
          )}
          <Detail label={t("card.cost")}>{t(`free.${place.free}`)}</Detail>
          <Detail label={t("card.access")}>
            {place.wheelchair ? t(`wheelchair.${place.wheelchair}`) : t("card.accessUnknown")}
          </Detail>
          {place.description && <Detail label={t("card.about")}>{place.description}</Detail>}
        </dl>
      </section>

      <section className="card-section" aria-labelledby="hours-title">
        <h3 id="hours-title">{t("card.hours")}</h3>
        {week ? (
          <table className="hours-table">
            <tbody>
              {week.map((day) => (
                <tr
                  key={day.date.toISOString()}
                  className={day.isToday ? "today" : undefined}
                  aria-current={day.isToday ? "date" : undefined}
                >
                  <th scope="row">
                    {day.isToday
                      ? t("card.today")
                      : day.date.toLocaleDateString(locale, { weekday: "long" })}
                  </th>
                  <td>
                    {day.ranges.length === 0
                      ? t("status.closed")
                      : day.ranges
                          .map((range) =>
                            isAllDay(range)
                              ? t("card.allDay")
                              : `${formatTime(range.from, locale)} – ${formatTime(range.to, locale)}`,
                          )
                          .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{t("status.unknown")}</p>
        )}
        {/* Also show the hours as written in OSM when they have notes like "by appointment". */}
        {place.openingHours && (!week || status.kind === "unknown") && (
          <p className="muted">{place.openingHours}</p>
        )}
      </section>

      <p className="muted card-note">
        {t("card.note")}{" "}
        <a href={place.osmUrl} target="_blank" rel="noreferrer">
          {t("place.openMap")}
        </a>
      </p>
    </article>
  );
}

/** One word or two for the strip at the top: "Open", "Closed"... */
function shortStatusKey(status: HoursStatus): string {
  if (status.kind === "open") return status.soon ? "status.soon" : "status.open";
  if (status.kind === "always") return "status.always";
  if (status.kind === "closed") return "status.closed";
  return "status.unknownShort";
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
