// Small icons for buttons (settings, zoom, save, listen...), drawn on a 24×24 grid.
// Icons are decoration: every button that uses one also has words, either
// visible or as an aria-label, so screen readers never just say "button".

const stroke = (d: string) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;

const ICONS = {
  // A life ring
  help:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    stroke("M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"),
  // Three sliders
  settings:
    stroke("M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1") +
    '<circle cx="15" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '<circle cx="9" cy="12" r="2.2" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '<circle cx="17" cy="18" r="2.2" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  // A navigation arrow
  locate: '<path d="M20.5 3.5 3.5 10.6l7.2 2.7 2.7 7.2z" fill="currentColor"/>',
  plus: stroke("M12 5v14M5 12h14"),
  minus: stroke("M5 12h14"),
  // A turn arrow, for directions
  directions: stroke("M5 20v-6a4 4 0 0 1 4-4h10M15 6l4 4-4 4"),
  // A bookmark ribbon, outlined or filled
  save: stroke("M6 3.5h12v17l-6-4.2-6 4.2z"),
  saved: '<path d="M6 3.5h12v17l-6-4.2-6 4.2z" fill="currentColor"/>',
  // A speaker with sound waves
  listen:
    '<path d="M3.5 9h4l5-4v14l-5-4h-4z" fill="currentColor"/>' +
    stroke("M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"),
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  // A phone handset
  call: '<path d="M7 3.5 9.5 3l2 4.5-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4.5 2-.5 2.5c-.3 1.2-1.4 2-2.6 1.9C10.6 18.4 5.6 13.4 5.1 6.1 5 4.9 5.8 3.8 7 3.5z" fill="currentColor"/>',
  // A box with an arrow coming out, for sharing
  share: stroke("M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"),
  // A magnifying glass
  search:
    '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    stroke("M15 15l5 5"),
} as const;

export type UiIconName = keyof typeof ICONS;

export function UiIcon({ name }: { name: UiIconName }) {
  return (
    <svg
      className="ui-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      // Safe: the HTML comes from the ICONS list above, never from map data or users.
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
