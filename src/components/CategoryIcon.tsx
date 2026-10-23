// A colored circle with the category's white icon, used in the list.

import type { Category } from "../lib/categories";
import { CATEGORY_ICONS } from "./icons";

export function CategoryIcon({ category }: { category: Category }) {
  return (
    <span
      className="cat-icon"
      style={{ background: `var(--cat-${category})` }}
      aria-hidden="true"
      // Safe: the HTML comes from our own icons.ts file, never from map data or users.
      dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[category] }}
    />
  );
}
