// Builds the offline packs: every free place in the U.S., cut into small files.
//
//   node scripts/build-packs.mjs <output folder> [state codes, like MD DC]
//
// The free Overpass server is slow when it's busy, because it searches the raw
// map from scratch for every request. So instead of every phone asking it for
// the same places again and again, we ask it ONCE A WEEK for each state (about
// 51 polite requests, one at a time) and publish the answers next to the app,
// where GitHub's fast servers hand them out. See .github/workflows/packs.yml.
//
// Output:
//   <out>/t/<y>_<x>.json   one file per 0.25-degree square that has places
//   <out>/index.json       which squares exist, and which squares belong to each state

import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { OSM_FILTERS, PACK_TAG_KEYS } from "../src/lib/osmFilters.ts";
import { TILE_DEGREES, tileId } from "../src/lib/tiles.ts";

const OUT = process.argv[2];
const ONLY = process.argv.slice(3);
if (!OUT) {
  console.error("Usage: node scripts/build-packs.mjs <output folder> [state codes]");
  process.exit(1);
}

// Overpass asks apps to identify themselves (the policy says libraries' default
// names aren't enough).
const HEADERS = {
  "User-Agent":
    "NearAid-pack-builder/1.0 (+https://github.com/nandan458/help-finder; student project)",
  Accept: "application/json",
};
const SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const PAUSE_MS = 20_000; // between requests, so we never hammer the volunteers' server

const STATES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class TooBigError extends Error {}

/**
 * Send one query. Returns the parsed answer.
 * - If the server is busy (429, 502, 503, 504), wait and try again, a few times,
 *   alternating between the two servers.
 * - If Overpass says the query itself was too big for it, throw TooBigError,
 *   so the caller can split the work into smaller pieces.
 */
async function ask(query) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt++) {
    const server = SERVERS[attempt % SERVERS.length];
    try {
      const response = await fetch(server, {
        method: "POST",
        headers: HEADERS,
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(15 * 60_000),
      });
      if (!response.ok) throw new Error();
      const answer = await response.json();
      // When a search runs out of time or memory, Overpass still says "200 OK"
      // but sends a partial list and a "remark". A partial state would silently
      // miss places, so we never accept one.
      if (answer.remark && /runtime error|timed out|out of memory/i.test(answer.remark)) {
        throw new TooBigError(answer.remark);
      }
      return answer;
    } catch (err) {
      if (err instanceof TooBigError) throw err;
      lastError = err;
      const pause = Math.min(300_000, PAUSE_MS * 2 ** attempt); // 20 s, 40 s, 80 s ... up to 5 min
      log();
      await wait(pause);
    }
  }
  throw lastError;
}

/** The rectangle around a state, as [south, west, north, east]. */
async function stateBounds(code) {
  const answer = await ask(
    `[out:json][timeout:60];rel["ISO3166-2"="US-${code}"]["boundary"="administrative"];out bb;`,
  );
  const b = answer.elements[0]?.bounds;
  if (!b) throw new Error(`No boundary found for ${code}`);
  let [south, west, north, east] = [b.minlat, b.minlon, b.maxlat, b.maxlon];
  // Alaska's Aleutian Islands cross the 180th meridian, which would make its
  // rectangle span the whole world. We leave out the far-west islands.
  if (east - west > 180) [west, east] = [-170, -129.9];
  return [south, west, north, east];
}

/** Every matching place inside the state (and inside `box`, when given). */
function placesQuery(code, box) {
  const where = box ? `(area.a)(${box.join(",")})` : "(area.a)";
  return [
    "[out:json][timeout:900][maxsize:2147483648];",
    `area["ISO3166-2"="US-${code}"]["boundary"="administrative"]->.a;`,
    "(",
    ...OSM_FILTERS.map((filter) => `  ${filter}${where};`),
    ");",
    "out center;",
  ].join("\n");
}

/**
 * Fetch a state's places. If the server can't do the whole state in one go
 * (a few big states are too much for it), cut the rectangle in four and try
 * each part separately, and so on.
 */
async function fetchState(code, box, depth = 0) {
  try {
    const answer = await ask(placesQuery(code, depth === 0 ? null : box));
    return answer.elements;
  } catch (err) {
    // Only a query that was too big is split; a busy server was already retried in ask().
    if (!(err instanceof TooBigError) || depth >= 3) throw err;
    log(`  ${code}: too big for one request, splitting into four parts`);
    const [s, w, n, e] = box;
    const midLat = (s + n) / 2;
    const midLng = (w + e) / 2;
    const parts = [
      [s, w, midLat, midLng],
      [s, midLng, midLat, e],
      [midLat, w, n, midLng],
      [midLat, midLng, n, e],
    ];
    const all = [];
    for (const part of parts) {
      await wait(PAUSE_MS);
      all.push(...(await fetchState(code, part, depth + 1)));
    }
    return all;
  }
}

/** Keep only what the app uses from one place: its type, id, position, and a few tags. */
function slim(element) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat === undefined || lon === undefined) return null;
  const tags = {};
  for (const key of PACK_TAG_KEYS)
    if (element.tags?.[key] !== undefined) tags[key] = element.tags[key];
  return {
    type: element.type,
    id: element.id,
    lat: Math.round(lat * 1e5) / 1e5, // about 1 meter; shorter numbers, smaller files
    lon: Math.round(lon * 1e5) / 1e5,
    tags,
  };
}

// ---- Main ----

const codes = ONLY.length > 0 ? ONLY : Object.keys(STATES);
const places = new Map(); // "node/123" -> place, so a place found by two states is kept once
const stateBoxes = {};

for (const [i, code] of codes.entries()) {
  if (!STATES[code]) throw new Error(`Unknown state code: ${code}`);
  log(`[${i + 1}/${codes.length}] ${STATES[code]}`);
  const box = await stateBounds(code);
  await wait(PAUSE_MS);
  const elements = await fetchState(code, box);
  let added = 0;
  for (const element of elements) {
    const place = slim(element);
    if (place && !places.has(`${place.type}/${place.id}`)) {
      places.set(`${place.type}/${place.id}`, place);
      added++;
    }
  }
  stateBoxes[code] = box;
  log(`  ${added} places`);
  if (i < codes.length - 1) await wait(PAUSE_MS);
}

// Cut into squares.
const tiles = new Map(); // "y_x" -> places
for (const place of places.values()) {
  const id = tileId(place.lat, place.lon);
  if (!tiles.has(id)) tiles.set(id, []);
  tiles.get(id).push(place);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, "t"), { recursive: true });
let bytes = 0;
for (const [id, list] of tiles) {
  // A compact form: one array per place, [type letter, id, lat, lon, tags].
  const json = JSON.stringify(list.map((p) => [p.type[0], p.id, p.lat, p.lon, p.tags]));
  bytes += json.length;
  await writeFile(join(OUT, "t", `${id}.json`), json);
}

// Which squares belong to which state: the squares whose middle falls inside the
// state's rectangle. Used for the "Download for offline" button.
const stateTiles = {};
for (const code of codes) {
  const [s, w, n, e] = stateBoxes[code];
  stateTiles[code] = {
    name: STATES[code],
    tiles: [...tiles.keys()].filter((id) => {
      const [y, x] = id.split("_").map(Number);
      const lat = (y + 0.5) * TILE_DEGREES;
      const lng = (x + 0.5) * TILE_DEGREES;
      return lat >= s && lat <= n && lng >= w && lng <= e;
    }),
  };
}

await writeFile(
  join(OUT, "index.json"),
  JSON.stringify({
    version: 1,
    builtAt: new Date().toISOString(),
    tileDegrees: TILE_DEGREES,
    tiles: [...tiles.keys()],
    states: stateTiles,
  }),
);
log(
  `Done: ${places.size} places in ${tiles.size} files, ${(bytes / 1024 / 1024).toFixed(1)} MB (before compression).`,
);
