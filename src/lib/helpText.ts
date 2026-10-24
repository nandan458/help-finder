// The plain-text version of a "help list": the nearest places for the need you
// picked, with addresses, hours, and phone numbers, ready to text to someone,
// paste into a message, or print. Counselors, librarians, and volunteers can hand
// it to a person who may not have a smartphone or data.

export type HelpEntry = {
  name: string;
  kind: string; // "Food", "Health"...
  status: string; // "Open · Closes 5:00 PM"
  distance: string; // "0.4 mi"
  address?: string;
  phone?: string;
};

/**
 * Number the places and put each one's details under it:
 *
 *   NearAid: free help near you
 *   1. Bread for the City (Food) · Open · Closes 5:00 PM · 0.4 mi
 *      1525 7th Street Northwest, Washington, DC
 *      +1-202-265-2400
 */
export function helpText(title: string, entries: HelpEntry[], footer: string[]): string {
  const places = entries.flatMap((entry, i) => [
    `${i + 1}. ${entry.name} (${entry.kind}) · ${entry.status} · ${entry.distance}`,
    ...(entry.address ? [`   ${entry.address}`] : []),
    ...(entry.phone ? [`   ${entry.phone}`] : []),
  ]);
  return [title, "", ...places, "", ...footer].join("\n");
}
