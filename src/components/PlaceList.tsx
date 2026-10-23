// The nearby list, closest first. Tapping a row opens that place's card.

import { useEffect, useRef } from "react";
import { useT } from "../i18n/useT";
import type { HoursStatus } from "../lib/hours";
import type { Place } from "../lib/overpass";
import { PlaceRow } from "./PlaceRow";

export type NearbyPlace = { place: Place; meters: number; status: HoursStatus };

type Props = {
  items: NearbyPlace[];
  now: Date;
  miles: boolean;
  onOpen: (id: string) => void;
  focusId: string | null; // the row to put focus back on after closing a card
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function PlaceList({ items, now, miles, onOpen, focusId }: Props) {
  const { t } = useT();
  const rows = useRef(new Map<string, HTMLButtonElement>());

  // Coming back from a place card: put focus back on that place's row,
  // so keyboard and screen reader users continue where they left off.
  useEffect(() => {
    const row = focusId ? rows.current.get(focusId) : undefined;
    row?.focus({ preventScroll: true });
    // "nearest" scrolls only as much as needed, and not at all if the row already shows.
    row?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }, [focusId]);

  return (
    <ul className="place-list" aria-label={t("list.label")}>
      {items.map(({ place, meters, status }) => (
        <PlaceRow
          key={place.id}
          place={place}
          meters={meters}
          status={status}
          now={now}
          miles={miles}
          onOpen={onOpen}
          ref={(row) => {
            if (row) rows.current.set(place.id, row);
            else rows.current.delete(place.id);
          }}
        />
      ))}
    </ul>
  );
}
