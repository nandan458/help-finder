// Builds the offline packs: every free place in the U.S., cut into small files.
//
//   node scripts/build-packs.mjs <output folder> [state codes, like MD DC]
//
// How it works, for each state:
//   1. Download the state's OpenStreetMap file from Geofabrik (a free service that
//      publishes ready-made extracts every day, for exactly this kind of use).
//   2. Use osmium (a standard OSM tool) to keep only objects that might be places we show.
//   3. Export them as GeoJSON, and keep the ones the app would show (src/lib/packBuild.ts,
//      which uses the app's own categorize() rules).
// Then all places are cut into 0.25-degree squares, one small file each.
//
// We used to ask the Overpass server for this, but it's shared by thousands of apps
// and took hours. Geofabrik's files are made for bulk downloads, so this takes minutes.
//
// Output:
//   <out>/t/<y>_<x>.json   one file per square that has places
//   <out>/index.json       which squares exist, and which squares belong to each state
//
// Needs osmium-tool installed (the GitHub workflow does this: apt install osmium-tool).

import { spawnSync } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { featureToPlace } from "../src/lib/packBuild.ts";
import { TILE_DEGREES, tileId } from "../src/lib/tiles.ts";

const OUT = process.argv[2];
const ONLY = process.argv.slice(3);
if (!OUT) {
  console.error("Usage: node scripts/build-packs.mjs <output folder> [state codes]");
  process.exit(1);
}

const STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

// Which tags might make something a place we show. This is deliberately wide (any
// healthcare tag, any internet_access tag...): the precise decision is made by
// categorize() afterward. Keep it a superset of the rules in categories.ts.
const OSMIUM_FILTER = [
  "nwr/amenity=food_bank,food_sharing,shower,drinking_water,toilets,clinic,pharmacy,library,community_centre,doctors,dentist",
  "nwr/social_facility",
  "nwr/social_facility:for",
  "nwr/healthcare",
  "nwr/internet_access",
];

const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ["ignore", "inherit", "inherit"] });
  if (result.status !== 0) throw new Error(`${command} ${args[0]} failed (exit ${result.status})`);
}

/** Download a file to disk, retrying a few times. */
async function download(url, path) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "NearAid-pack-builder/1.0 (+https://github.com/nandan458/help-finder; student project)",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(path));
      return;
    } catch (err) {
      log(`  download failed (${err.message})${attempt < 4 ? ", trying again" : ""}`);
      if (attempt === 4) throw err;
      await wait(15_000 * attempt);
    }
  }
}

/** One state: download, filter, export, and return its places. */
async function buildState(code, work) {
  const slug = STATES[code].toLowerCase().replaceAll(" ", "-");
  const pbf = join(work, `${slug}.osm.pbf`);
  const filtered = join(work, `${slug}-filtered.osm.pbf`);
  const lines = join(work, `${slug}.geojsonseq`);

  await download(`https://download.geofabrik.de/north-america/us/${slug}-latest.osm.pbf`, pbf);
  log(`  downloaded ${((await stat(pbf)).size / 1048576).toFixed(0)} MB`);

  run("osmium", ["tags-filter", pbf, ...OSMIUM_FILTER, "-o", filtered, "--overwrite"]);
  await rm(pbf); // big; not needed anymore
  run("osmium", [
    "export", filtered,
    "-f", "geojsonseq",
    "--geometry-types=point,polygon",
    "--add-unique-id=type_id",
    "-o", lines,
    "--overwrite",
  ]);
  await rm(filtered);

  const places = [];
  for await (const line of createInterface({ input: createReadStream(lines), crlfDelay: Infinity })) {
    const place = featureToPlace(line);
    if (place) places.push(place);
  }
  await rm(lines);
  return places;
}

// ---- Main ----

const codes = ONLY.length > 0 ? ONLY : Object.keys(STATES);
for (const code of codes) if (!STATES[code]) throw new Error(`Unknown state code: ${code}`);

const work = await mkdtemp(join(tmpdir(), "nearaid-packs-"));
const places = new Map(); // "n123" -> place, so a place found in two state files is kept once
const stateTilesSeen = {}; // code -> set of squares that hold one of its places

for (const [i, code] of codes.entries()) {
  log(`[${i + 1}/${codes.length}] ${STATES[code]}`);
  const found = await buildState(code, work);
  stateTilesSeen[code] = new Set();
  for (const place of found) {
    places.set(`${place.type}${place.id}`, place);
    stateTilesSeen[code].add(tileId(place.lat, place.lon));
  }
  log(`  ${found.length} places`);
  if (found.length === 0) throw new Error(`${STATES[code]} produced no places: something is wrong`);
}
await rm(work, { recursive: true, force: true });

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
  const json = JSON.stringify(list.map((p) => [p.type, p.id, p.lat, p.lon, p.tags]));
  bytes += json.length;
  await writeFile(join(OUT, "t", `${id}.json`), json);
}

// For the "Save <state> for offline use" button: a state's squares are the ones
// that hold at least one of its places.
const states = {};
for (const code of codes) states[code] = { name: STATES[code], tiles: [...stateTilesSeen[code]] };

await writeFile(
  join(OUT, "index.json"),
  JSON.stringify({
    version: 1,
    builtAt: new Date().toISOString(),
    tileDegrees: TILE_DEGREES,
    tiles: [...tiles.keys()],
    states,
  }),
);
log(
  `Done: ${places.size} places in ${tiles.size} files, ${(bytes / 1024 / 1024).toFixed(1)} MB (before compression).`,
);
