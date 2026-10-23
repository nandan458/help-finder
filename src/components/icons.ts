// Simple white icons for each category, drawn on a 24×24 grid.
// They are plain SVG text (not React components) because map pins are made
// with Leaflet, which needs HTML as a string. The list uses the same strings,
// so a category looks the same on the map and in the list.

import type { Category } from "../lib/categories";

const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`;

export const CATEGORY_ICONS: Record<Category, string> = {
  // Fork and knife
  food: svg(
    '<path d="M5 2h1.5v6h1V2H9v6h1V2h1.5v7A2.5 2.5 0 0 1 9.5 11.4V22h-2V11.4A2.5 2.5 0 0 1 5 9z"/>' +
      '<path d="M18.5 2v20h-2v-8H14V8c0-3.5 2-6 4.5-6z"/>',
  ),
  // Medical cross
  health: svg('<path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z"/>'),
  // House
  shelter: svg('<path d="M12 2.5 1.5 11.5H5V21h5v-6h4v6h5v-9.5h3.5z"/>'),
  // Wi-Fi signal
  internet: svg(
    '<path d="M2 9a14.5 14.5 0 0 1 20 0M5.2 12.4a10 10 0 0 1 13.6 0M8.5 15.8a5.2 5.2 0 0 1 7 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle cx="12" cy="19.5" r="2"/>',
  ),
  // Water drop
  water: svg('<path d="M12 2.5C8 7.5 5.5 11 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 11 16 7.5 12 2.5z"/>'),
  // Two people
  restroom: svg(
    '<circle cx="7" cy="4" r="2.2"/><path d="M4.5 7.5h5V15H8.5v6.5h-3V15H4.5z"/>' +
      '<circle cx="17" cy="4" r="2.2"/><path d="M14.8 7.5h4.4l2.3 8H19v6h-4v-6h-2.5z"/>',
  ),
  // Shower head with drops
  shower: svg(
    '<path d="M11 2h2v3.2A7 7 0 0 1 19 12H5a7 7 0 0 1 6-6.8z"/>' +
      '<circle cx="7.5" cy="15.5" r="1.3"/><circle cx="12" cy="15.5" r="1.3"/><circle cx="16.5" cy="15.5" r="1.3"/>' +
      '<circle cx="9.5" cy="19.5" r="1.3"/><circle cx="14.5" cy="19.5" r="1.3"/>',
  ),
};
