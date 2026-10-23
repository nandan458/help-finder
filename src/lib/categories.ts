// Turns raw OpenStreetMap tags into our simple categories.
//
// OSM describes places with "tags": key=value pairs such as amenity=toilets.
// Different mappers tag the same kind of place in different ways, so this file
// is where we decide which tags count as which category. Each rule here was
// checked against the OpenStreetMap wiki (wiki.openstreetmap.org).

export type Category = "food" | "health" | "shelter" | "internet" | "water" | "restroom" | "shower";

// The order buttons and legends show categories in.
export const CATEGORIES: Category[] = [
  "food",
  "health",
  "shelter",
  "internet",
  "water",
  "restroom",
  "shower",
];

export type Tags = Record<string, string | undefined>;

/**
 * Decide which category a place belongs to, or null if it isn't one we show.
 * Rules are checked from top to bottom and the first match wins. The order matters:
 * a food bank for homeless people should count as Food, not Shelter, so Food comes first.
 */
export function categorize(tags: Tags): Category | null {
  const { amenity, healthcare } = tags;
  const socialFacility = tags["social_facility"];

  // Skip anything the public can't use (for example toilets inside an office).
  if (tags.access === "private" || tags.access === "no") return null;

  // FOOD
  // social_facility=food_bank / soup_kitchen is the documented way to tag these.
  // amenity=food_bank has no wiki page, but older map data still uses it.
  // amenity=food_sharing is a community fridge or shelf where anyone can take food.
  // (amenity=give_box is NOT food: the wiki says those boxes hold non-food items.)
  if (socialFacility === "food_bank" || socialFacility === "soup_kitchen") return "food";
  if (amenity === "food_bank" || amenity === "food_sharing") return "food";

  // SHELTER
  // amenity=shelter means a weather shelter (bus stop roof, picnic shelter),
  // not a place to sleep, so we do not use it. Homeless shelters are tagged
  // social_facility=shelter, and other homeless services social_facility:for=homeless.
  // Real data often lists several groups, like "homeless;women" or "homeless_woman",
  // so we look for "homeless" anywhere in the value.
  if (socialFacility === "shelter" || tags["social_facility:for"]?.includes("homeless")) {
    return "shelter";
  }

  // SHOWERS, WATER, RESTROOMS: one tag each.
  if (amenity === "shower") return "shower";
  if (amenity === "drinking_water") return "water";
  if (amenity === "toilets") return "restroom";

  // HEALTH
  // Clinics and pharmacies always count (pharmacies are marked "may cost money").
  // Other health care (doctors, dentists, counselors...) only counts if tagged fee=no,
  // otherwise a big city would show every private dentist.
  if (amenity === "clinic" || healthcare === "clinic") return "health";
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "health";
  if ((healthcare || amenity === "doctors" || amenity === "dentist") && tags.fee === "no") {
    return "health";
  }

  // INTERNET
  // Libraries and community centers usually have free computers or Wi-Fi.
  // Any other place (like a cafe) counts if it says its internet is free for everyone.
  if (amenity === "library" || amenity === "community_centre") return "internet";
  if (tags["internet_access"] && tags["internet_access"] !== "no") {
    if (tags["internet_access:fee"] === "no") return "internet";
  }

  return null;
}

/**
 * Is this place free? "yes", "no", or "unknown" when the map doesn't say.
 * We only say "yes" when we are fairly sure, because showing up somewhere
 * that charges money is exactly the wasted trip this app tries to prevent.
 */
export function freeStatus(tags: Tags, category: Category): "yes" | "no" | "unknown" {
  // A clear fee tag always wins.
  if (tags.fee === "no" || tags["internet_access:fee"] === "no") return "yes";
  if (tags.fee === "yes") return "no";

  // "Customers only" means you have to buy something first.
  if (tags.access === "customers" || tags["internet_access:fee"] === "customers") return "no";

  // Food banks, soup kitchens, food sharing, and drinking water are free by definition
  // (the OSM wiki describes them that way).
  if (category === "food" || category === "water") return "yes";

  // Pharmacies sell medicine.
  if (tags.amenity === "pharmacy" || tags.healthcare === "pharmacy") return "no";

  return "unknown";
}

/** Wheelchair access, simplified to the three values we show. */
export function wheelchairStatus(tags: Tags): "yes" | "limited" | "no" | undefined {
  const value = tags.wheelchair;
  if (value === "yes" || value === "designated") return "yes";
  if (value === "limited") return "limited";
  if (value === "no") return "no";
  return undefined;
}

/**
 * Build a one-line street address from OSM's addr:* tags, for example
 * "901 G Street Northwest, Washington, DC 20001".
 * Returns undefined when there is no street, because a city name alone
 * doesn't help anyone find the door.
 */
export function buildAddress(tags: Tags): string | undefined {
  const street =
    tags["addr:full"] ??
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ").trim();
  if (!street) return undefined;

  const statePostcode = [tags["addr:state"], tags["addr:postcode"]].filter(Boolean).join(" ");
  return [street, tags["addr:city"], statePostcode].filter(Boolean).join(", ");
}
