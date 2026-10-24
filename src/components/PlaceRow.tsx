// One place in the list: category icon, name, open status, and walk time.
// The whole row is one button, so it's easy to tap and works with the keyboard.

import type { CSSProperties, Ref } from "react";
import { useT } from "../i18n/useT";
import { formatDistance, walkMinutes } from "../lib/geo";
import type { HoursStatus } from "../lib/hours";
import type { Place } from "../lib/overpass";
import { CategoryIcon } from "./CategoryIcon";
import { StatusLine } from "./StatusLine";

type Props = {
  place: Place;
  meters: number;
  status: HoursStatus;
  now: Date;
  miles: boolean;
  onOpen: (id: string) => void;
  ref?: Ref<HTMLButtonElement>;
};

export function PlaceRow({ place, meters, status, now, miles, onOpen, ref }: Props) {
  const { t } = useT();
  // Unnamed places (most water fountains and restrooms) get a friendly label instead.
  const name = place.name ?? t(`unnamed.${place.category}`);
  const minutes = walkMinutes(meters);
  // A walk of more than an hour and a half isn't realistic, so we show only the distance.
  const walkable = minutes <= 90;

  return (
    // A colored edge on the left, in the category's map color, gives the list a clear rhythm.
    <li style={{ "--tint": `var(--cat-${place.category})` } as CSSProperties}>
      <button type="button" className="place-row" ref={ref} onClick={() => onOpen(place.id)}>
        <CategoryIcon category={place.category} />
        <span className="place-main">
          <span className="place-name">{name}</span>
          <span className="muted">
            {t(`category.${place.category}`)} · {t(`free.${place.free}`)}
          </span>
          <StatusLine status={status} now={now} />
        </span>
        <span className="place-distance">
          {walkable ? (
            <>
              <strong>{t("distance.walk", { minutes })}</strong>
              <span className="muted">{formatDistance(meters, miles)}</span>
            </>
          ) : (
            <strong>{formatDistance(meters, miles)}</strong>
          )}
        </span>
      </button>
    </li>
  );
}
