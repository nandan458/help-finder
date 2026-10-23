// Round category buttons, then pill toggles: Open now, Free, Wheelchair, Saved.
// Each button says whether it's on with aria-pressed, so screen readers
// announce "pressed" or "not pressed".

import { useT } from "../i18n/useT";
import { CATEGORIES } from "../lib/categories";
import { toggleCategory, type Filters } from "../lib/filters";
import { CategoryIcon } from "./CategoryIcon";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  showSaved: boolean;
  savedCount: number;
  onShowSaved: (show: boolean) => void;
};

export function FilterBar({ filters, onChange, showSaved, savedCount, onShowSaved }: Props) {
  const { t } = useT();

  const pill = (label: string, on: boolean, toggle: () => void) => (
    <button type="button" className="pill" aria-pressed={on} onClick={toggle}>
      {label}
    </button>
  );

  return (
    <div className="filter-bar">
      <div className="category-bar" role="group" aria-label={t("filters.categories")}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className="category-button"
            aria-pressed={filters.categories.includes(category)}
            onClick={() => onChange(toggleCategory(filters, category))}
          >
            <CategoryIcon category={category} />
            <span>{t(`category.${category}`)}</span>
          </button>
        ))}
      </div>

      <div className="pills" role="group" aria-label={t("filters.label")}>
        {pill(t("filters.openNow"), filters.openNow, () =>
          onChange({ ...filters, openNow: !filters.openNow }),
        )}
        {pill(t("filters.free"), filters.freeOnly, () =>
          onChange({ ...filters, freeOnly: !filters.freeOnly }),
        )}
        {pill(t("filters.wheelchair"), filters.wheelchair, () =>
          onChange({ ...filters, wheelchair: !filters.wheelchair }),
        )}
        {pill(t("filters.saved", { count: savedCount }), showSaved, () => onShowSaved(!showSaved))}
      </div>
    </div>
  );
}
