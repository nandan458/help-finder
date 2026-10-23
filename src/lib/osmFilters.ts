// What we ask OpenStreetMap for: every kind of place the app can show.
//
// This file has no imports on purpose, so both the app (overpass.ts) and the
// weekly offline-pack builder (scripts/build-packs.mjs, run by Node) read the
// very same list. Every line here must match a rule in categorize() in categories.ts.
//
// `nwr` means nodes, ways, and relations (points, buildings, and bigger areas).

export const OSM_FILTERS: string[] = [
  `nwr["social_facility"~"^(food_bank|soup_kitchen|shelter)$"]`,
  `nwr["social_facility:for"~"homeless"]`,
  `nwr["amenity"~"^(food_bank|food_sharing|shower|drinking_water|toilets|clinic|pharmacy|library|community_centre)$"]`,
  `nwr["healthcare"~"^(clinic|pharmacy)$"]`,
  `nwr["healthcare"]["fee"="no"]`,
  `nwr["amenity"~"^(doctors|dentist)$"]["fee"="no"]`,
  `nwr["internet_access"]["internet_access:fee"="no"]`,
];

// The only tags we keep when saving places in an offline pack. Everything else
// on a place (building colors, roof shapes...) is dropped to keep packs small.
// These are exactly the tags that categories.ts and overpass.ts read.
export const PACK_TAG_KEYS: string[] = [
  "name",
  "amenity",
  "healthcare",
  "social_facility",
  "social_facility:for",
  "internet_access",
  "internet_access:fee",
  "access",
  "fee",
  "wheelchair",
  "opening_hours",
  "phone",
  "contact:phone",
  "website",
  "contact:website",
  "url",
  "description",
  "addr:full",
  "addr:housenumber",
  "addr:street",
  "addr:city",
  "addr:state",
  "addr:postcode",
];
