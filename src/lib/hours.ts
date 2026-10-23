// Works out "is it open right now?" from OpenStreetMap's opening_hours tag.
//
// OSM writes hours in a compact format like "Mo-Fr 09:00-17:00; Sa 10:00-14:00".
// Reading every variation correctly (holidays, "sunrise-sunset", times past
// midnight...) is hard, so we use the opening_hours library, which the OSM
// community maintains for exactly this. This file turns its answers into the
// few things our screens need.

import type OpeningHoursLibrary from "opening_hours";
import type { LatLng } from "./geo";

export type HoursStatus =
  | { kind: "unknown" } // no hours, hours we can't read, or "call for hours"
  | { kind: "always" } // open 24/7
  | { kind: "open"; closesAt?: Date; soon: boolean } // soon = closes within 60 minutes
  | { kind: "closed"; opensAt?: Date };

// The opening_hours library is big (it knows the holidays of many countries),
// about as big as the rest of the app put together. So it isn't part of the
// first download: loadHours() fetches it separately, in the background, right
// after the app starts. Until it arrives, every place's hours count as unknown.
let OpeningHours: typeof OpeningHoursLibrary | null = null;

export async function loadHours(): Promise<void> {
  OpeningHours ??= (await import("opening_hours")).default;
}

const SOON_MS = 60 * 60_000;
const WEEK_MS = 7 * 24 * 60 * 60_000;

/**
 * Read an opening_hours value, or return null if it can't be read.
 *
 * Normally we pass the place's location, so "sunrise-sunset" hours are right.
 * But holiday rules ("PH" = public holiday, "SH" = school holiday) also need
 * the country, which we don't know, and with a location but no country the
 * library fails. With no location at all it just skips the holiday rules,
 * so for hours that mention holidays we leave the location out.
 */
function parse(value: string, where: LatLng, now: Date): OpeningHoursLibrary | null {
  if (!OpeningHours) return null;
  const usesHolidays = /\b(PH|SH)\b/.test(value);
  const location = usesHolidays
    ? null
    : { lat: where.lat, lon: where.lng, address: { country_code: "", state: "" } };
  try {
    const hours = new OpeningHours(value, location);
    hours.getState(now); // some problems only show up when the hours are checked
    return hours;
  } catch {
    return null;
  }
}

/** Is the place open at `now`, and when does that change? */
export function hoursStatus(value: string | undefined, now: Date, where: LatLng): HoursStatus {
  if (!value) return { kind: "unknown" };
  const hours = parse(value, where, now);
  // getUnknown is true for notes like "by appointment" or "call ahead".
  if (!hours || hours.getUnknown(now)) return { kind: "unknown" };

  // Only look a week ahead. "Opens in 3 months" isn't useful, and it's slow to work out.
  const nextChange = hours.getNextChange(now, new Date(now.getTime() + WEEK_MS));

  if (hours.getState(now)) {
    if (!nextChange) return { kind: "always" };
    const soon = nextChange.getTime() - now.getTime() <= SOON_MS;
    return { kind: "open", closesAt: nextChange, soon };
  }
  return { kind: "closed", opensAt: nextChange };
}

export type TimeRange = { from: Date; to: Date };
export type DayHours = { date: Date; isToday: boolean; ranges: TimeRange[] };

/**
 * The next 7 days of hours, starting today, for the place card.
 * Returns null if the hours can't be read.
 */
export function weekHours(value: string | undefined, now: Date, where: LatLng): DayHours[] | null {
  if (!value) return null;
  const hours = parse(value, where, now);
  if (!hours) return null;

  const days: DayHours[] = [];
  for (let i = 0; i < 7; i++) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1);
    const ranges = hours.getOpenIntervals(start, end).map(([from, to]) => ({ from, to }));
    days.push({ date: start, isToday: i === 0, ranges });
  }
  return days;
}

/** True if a range covers a whole day (midnight to midnight). */
export function isAllDay(range: TimeRange): boolean {
  return range.to.getTime() - range.from.getTime() >= 24 * 60 * 60_000 - 60_000;
}

// ---- Words for the screen ----

type T = (key: string, vars?: Record<string, string | number>) => string;

/** "7:00 PM" in English, "7:00 p.m." in U.S. Spanish, and so on. */
export function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

/** Days between two dates on the calendar (today = 0, tomorrow = 1). */
function daysApart(a: Date, b: Date): number {
  const dayA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const dayB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((dayB - dayA) / (24 * 60 * 60_000));
}

/** "Opens 9:00 AM" / "Opens tomorrow 9:00 AM" / "Opens Monday 9:00 AM". */
function whenText(prefix: "opens" | "closes", at: Date, now: Date, t: T, locale: string): string {
  const time = formatTime(at, locale);
  const days = daysApart(now, at);
  if (days === 0) return t(`status.${prefix}Today`, { time });
  if (days === 1) return t(`status.${prefix}Tomorrow`, { time });
  const day = at.toLocaleDateString(locale, { weekday: "long" });
  return t(`status.${prefix}Day`, { day, time });
}

export type StatusTone = "open" | "soon" | "closed" | "unknown";

/**
 * The status line people read, like "Open · Closes 7:00 PM", plus a "tone"
 * that picks its color. The words always say the status too, so color is
 * never the only clue (an accessibility rule).
 */
export function statusText(
  status: HoursStatus,
  now: Date,
  t: T,
  locale: string,
): { text: string; tone: StatusTone } {
  switch (status.kind) {
    case "always":
      return { text: t("status.always"), tone: "open" };
    case "open":
      if (!status.closesAt) return { text: t("status.open"), tone: "open" };
      if (status.soon) {
        const time = formatTime(status.closesAt, locale);
        return { text: `${t("status.soon")} · ${time}`, tone: "soon" };
      }
      return {
        text: `${t("status.open")} · ${whenText("closes", status.closesAt, now, t, locale)}`,
        tone: "open",
      };
    case "closed":
      if (!status.opensAt) return { text: t("status.closed"), tone: "closed" };
      return {
        text: `${t("status.closed")} · ${whenText("opens", status.opensAt, now, t, locale)}`,
        tone: "closed",
      };
    default:
      return { text: t("status.unknown"), tone: "unknown" };
  }
}

/** Open right now (including "closes soon" and 24/7)? Used by the "Open now" filter. */
export function isOpenNow(status: HoursStatus): boolean {
  return status.kind === "open" || status.kind === "always";
}
