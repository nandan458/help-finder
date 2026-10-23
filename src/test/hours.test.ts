// Every hours string below is a real opening_hours value from our OSM fixtures.
// Times are written in local time, like the app uses.

import { beforeAll, describe, expect, it } from "vitest";
import { translate } from "../i18n/translate";
import {
  hoursStatus,
  isOpenNow,
  loadHours,
  statusText,
  weekHours,
  type HoursStatus,
} from "../lib/hours";

beforeAll(loadHours);

const dc = { lat: 38.9, lng: -77.03 };
// Wednesday, October 21, 2026 at the given hour and minute.
const wed = (hour: number, minute = 0) => new Date(2026, 9, 21, hour, minute);

const BREAD_FOR_THE_CITY = "Mo-Th 09:00-17:00; Fr 09:00-12:00";

describe("hoursStatus", () => {
  it("is open during hours, with the closing time", () => {
    const status = hoursStatus(BREAD_FOR_THE_CITY, wed(10), dc);
    expect(status).toEqual({ kind: "open", closesAt: wed(17), soon: false });
  });

  it("says 'closes soon' within an hour of closing", () => {
    const status = hoursStatus(BREAD_FOR_THE_CITY, wed(16, 15), dc);
    expect(status).toMatchObject({ kind: "open", soon: true });
  });

  it("is closed after hours and knows when it opens next", () => {
    expect(hoursStatus(BREAD_FOR_THE_CITY, wed(18), dc)).toEqual({
      kind: "closed",
      opensAt: new Date(2026, 9, 22, 9, 0), // Thursday 9 AM
    });
  });

  it("skips closed days to find the next opening", () => {
    // Friday 1 PM: closed (Friday ends at noon), next open Monday 9 AM.
    const friday = new Date(2026, 9, 23, 13, 0);
    expect(hoursStatus(BREAD_FOR_THE_CITY, friday, dc)).toEqual({
      kind: "closed",
      opensAt: new Date(2026, 9, 26, 9, 0),
    });
  });

  it("handles a lunch break", () => {
    const value = "Mo-Fr 09:00-13:30,14:00-19:00; Sa 10:00-13:30,14:00-18:00";
    expect(hoursStatus(value, wed(13, 45), dc)).toEqual({ kind: "closed", opensAt: wed(14) });
  });

  it("handles hours past midnight", () => {
    // Open until 1 AM on Friday night ("25:00" means 1 AM the next day).
    // (Saturday night is different: the later "Su" rule replaces all of Sunday,
    // including the hour after midnight. That's how the OSM format works.)
    const value = "Mo-Th 05:00-24:00; Fr-Sa 05:00-25:00; Su 05:00-23:00";
    const fridayLate = new Date(2026, 9, 24, 0, 30); // 12:30 AM, early Saturday
    expect(hoursStatus(value, fridayLate, dc)).toEqual({
      kind: "open",
      closesAt: new Date(2026, 9, 24, 1, 0),
      soon: true,
    });
  });

  it("knows 24/7 places are always open", () => {
    expect(hoursStatus("24/7", wed(3), dc)).toEqual({ kind: "always" });
  });

  it("uses the place's location for sunrise and sunset", () => {
    const status = hoursStatus("sunrise-sunset", wed(12), dc);
    expect(status.kind).toBe("open");
    // Sunset in DC in late October is around 6 PM.
    const closes = status.kind === "open" ? status.closesAt : undefined;
    expect(closes?.getHours()).toBeGreaterThanOrEqual(17);
    expect(closes?.getHours()).toBeLessThanOrEqual(18);
  });

  it("handles holiday rules even though we don't know the country", () => {
    const value = 'Tu,Th 10:00-12:00,13:00-15:00 "by appointment"; PH off';
    expect(hoursStatus(value, wed(10), dc).kind).toBe("closed"); // Wednesday
  });

  it("says unknown for notes like 'by appointment'", () => {
    const value = 'Tu,Th 10:00-12:00,13:00-15:00 "by appointment"; PH off';
    const thursday = new Date(2026, 9, 22, 10, 30);
    expect(hoursStatus(value, thursday, dc)).toEqual({ kind: "unknown" });
  });

  it("says unknown for missing or unreadable hours", () => {
    expect(hoursStatus(undefined, wed(10), dc)).toEqual({ kind: "unknown" });
    expect(hoursStatus("seasonal", wed(10), dc)).toEqual({ kind: "unknown" });
    expect(hoursStatus("yes", wed(10), dc)).toEqual({ kind: "unknown" });
  });
});

describe("statusText", () => {
  const en = (key: string, vars?: Record<string, string | number>) => translate("en", key, vars);
  const es = (key: string, vars?: Record<string, string | number>) => translate("es", key, vars);
  // Some systems put a special narrow space before "PM"; make tests ignore that.
  const text = (status: HoursStatus, now: Date, t = en, locale = "en-US") =>
    statusText(status, now, t, locale).text.replace(/\s/g, " ");

  it("writes each status in words, with a tone for its color", () => {
    expect(text(hoursStatus(BREAD_FOR_THE_CITY, wed(10), dc), wed(10))).toBe(
      "Open · Closes 5:00 PM",
    );
    expect(text(hoursStatus(BREAD_FOR_THE_CITY, wed(16, 30), dc), wed(16, 30))).toBe(
      "Closes soon · 5:00 PM",
    );
    expect(text(hoursStatus(BREAD_FOR_THE_CITY, wed(18), dc), wed(18))).toBe(
      "Closed · Opens tomorrow 9:00 AM",
    );
    expect(text({ kind: "unknown" }, wed(10))).toBe("Hours unknown, call ahead");
    expect(statusText({ kind: "always" }, wed(10), en, "en-US").tone).toBe("open");
  });

  it("names the day when it opens later in the week", () => {
    const friday = new Date(2026, 9, 23, 13, 0);
    expect(text(hoursStatus(BREAD_FOR_THE_CITY, friday, dc), friday)).toBe(
      "Closed · Opens Monday 9:00 AM",
    );
  });

  it("works in Spanish", () => {
    const friday = new Date(2026, 9, 23, 13, 0);
    expect(text(hoursStatus(BREAD_FOR_THE_CITY, friday, dc), friday, es, "es-US")).toMatch(
      /^Cerrado · Abre el lunes 9:00/,
    );
  });
});

describe("weekHours", () => {
  it("lists 7 days starting today, with today marked", () => {
    const week = weekHours(BREAD_FOR_THE_CITY, wed(10), dc)!;
    expect(week).toHaveLength(7);
    expect(week[0].isToday).toBe(true);
    expect(week[0].ranges).toEqual([{ from: wed(9), to: wed(17) }]);
    expect(week[3].ranges).toEqual([]); // Saturday: closed
  });

  it("returns null for hours it can't read", () => {
    expect(weekHours("seasonal", wed(10), dc)).toBeNull();
  });
});

describe("isOpenNow", () => {
  it("counts 'closes soon' and 24/7 as open", () => {
    expect(isOpenNow({ kind: "open", soon: true })).toBe(true);
    expect(isOpenNow({ kind: "always" })).toBe(true);
    expect(isOpenNow({ kind: "closed" })).toBe(false);
    expect(isOpenNow({ kind: "unknown" })).toBe(false);
  });
});
