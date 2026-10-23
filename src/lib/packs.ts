// Offline packs, the app's side. Once a week a GitHub job saves every free place
// in the U.S. as small files, one per 0.25-degree square (see scripts/build-packs.mjs
// and tiles.ts). Here the app:
//
// - answers a search from those files when it can: the one to four squares around
//   you are a few KB from GitHub's fast servers, instead of 30+ seconds of waiting
//   in line at the busy Overpass server
// - lets you save a whole state on the phone ("Save Maryland for offline use"),
//   so searches work in airplane mode
//
// If anything is missing (no packs yet, a place outside the U.S., a square that
// won't load), we return nothing and the caller falls back to the live server,
// so packs can only make the app faster, never break it.

import { clear, createStore, del, get, set, type UseStore } from "idb-keyval";
import { fetchPlacesCached } from "./cache";
import { distanceMeters, type LatLng } from "./geo";
import { parseOverpass, type OverpassElement, type Place } from "./overpass";
import { neighborIds, tileId, tilesAround } from "./tiles";

export type PackIndex = {
  version: number;
  builtAt: string; // when the weekly job made these files
  tiles: string[]; // every square that has a file
  states: Record<string, { name: string; tiles: string[] }>;
};

// One saved square: the places in it, and which weekly build they came from.
type StoredTile = { builtAt: string; places: PackPlace[] };
// How the builder writes a place: [type letter, id, lat, lon, tags].
type PackPlace = [string, number, number, number, Record<string, string>];

export type SavedState = { builtAt: string; bytes: number };

// Squares (and the index) live in their own database, apart from the search cache,
// so "7 days" cleanups of old searches never touch a state you saved on purpose.
let store: UseStore | undefined;
const db = () => (store ??= createStore("nearaid-packs", "tiles"));

const BASE = `${import.meta.env.BASE_URL}packs/`;
const TYPES: Record<string, OverpassElement["type"]> = { n: "node", w: "way", r: "relation" };

// ---- The index ----

let indexPromise: Promise<PackIndex | null> | undefined;
let indexTiles: Set<string> | undefined;

/**
 * Load the list of what's in the packs. Online we ask for the newest copy and
 * remember it; offline we use the copy remembered last time. Returns null when
 * there are no packs (for example while testing on a computer).
 */
export function loadIndex(): Promise<PackIndex | null> {
  indexPromise ??= (async () => {
    let index: PackIndex | null = null;
    try {
      const response = await fetch(`${BASE}index.json`, { cache: "no-cache" });
      if (response.ok) index = (await response.json()) as PackIndex;
    } catch {
      // offline, or no packs on this server: use what we saved, if anything
    }
    try {
      if (index) await set("index", index, db());
      else index = (await get<PackIndex>("index", db())) ?? null;
    } catch {
      // storage can be unavailable; see cache.ts
    }
    indexTiles = index ? new Set(index.tiles) : undefined;
    return index;
  })();
  return indexPromise;
}

/** Forget what we know about the index (so the next search checks again). */
export function resetPacks(): void {
  indexPromise = undefined;
  indexTiles = undefined;
}

/** Is this spot inside the area the packs cover? We trust a spot if its square, or a neighbor, has places. */
export function isCovered(center: LatLng, index: PackIndex): boolean {
  const have = indexTiles ?? new Set(index.tiles);
  return neighborIds(tileId(center.lat, center.lng)).some((id) => have.has(id));
}

// ---- Squares ----

function toElements(places: PackPlace[]): OverpassElement[] {
  return places.map(([type, id, lat, lon, tags]) => ({ type: TYPES[type], id, lat, lon, tags }));
}

/** One square's places: from the phone if we have this week's copy, otherwise download it. */
async function loadTile(id: string, index: PackIndex): Promise<PackPlace[]> {
  if (!index.tiles.includes(id)) return []; // nothing there: an empty square
  let stored: StoredTile | undefined;
  try {
    stored = await get<StoredTile>(`t:${id}`, db());
  } catch {
    // see above
  }
  if (stored && stored.builtAt === index.builtAt) return stored.places;

  try {
    const response = await fetch(`${BASE}t/${id}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const places = (await response.json()) as PackPlace[];
    try {
      await set(`t:${id}`, { builtAt: index.builtAt, places } satisfies StoredTile, db());
    } catch {
      // not saving is fine
    }
    return places;
  } catch (err) {
    // Can't reach the file (offline?). Last week's copy is better than nothing.
    if (stored) return stored.places;
    throw err;
  }
}

/**
 * Every place within `radiusM` of `center`, from the packs. Returns null when
 * the packs can't answer (not covered, or a square couldn't be loaded), so the
 * caller can ask the live server instead.
 */
export async function placesFromPacks(center: LatLng, radiusM: number): Promise<Place[] | null> {
  const index = await loadIndex();
  if (!index || !isCovered(center, index)) return null;
  try {
    const squares = await Promise.all(
      tilesAround(center.lat, center.lng, radiusM).map((id) => loadTile(id, index)),
    );
    const places = parseOverpass({ elements: squares.flatMap(toElements) });
    return places.filter((place) => distanceMeters(center, place) <= radiusM);
  } catch {
    return null;
  }
}

/** Like fetchPlacesCached, but tries the fast packs first. */
export async function fetchPlacesFast(center: LatLng, radiusM: number): Promise<Place[]> {
  const fromPacks = await placesFromPacks(center, radiusM);
  return fromPacks ?? fetchPlacesCached(center, radiusM);
}

// ---- Saving a whole state ----

/** The state (in the packs) that contains this spot, if any. */
export function stateAt(center: LatLng, index: PackIndex): { code: string; name: string } | null {
  const id = tileId(center.lat, center.lng);
  for (const [code, state] of Object.entries(index.states)) {
    if (state.tiles.includes(id)) return { code, name: state.name };
  }
  return null;
}

export async function savedStates(): Promise<Record<string, SavedState>> {
  try {
    return (await get<Record<string, SavedState>>("saved-states", db())) ?? {};
  } catch {
    return {};
  }
}

/**
 * Download every square of a state onto the phone, a few at a time. This is the
 * "Save for offline use" button: afterwards searches there work with no signal.
 * `onProgress` is told how many squares are done. Throws if any square fails,
 * so we never claim a half-saved state is saved.
 */
export async function saveState(
  code: string,
  onProgress: (done: number, total: number) => void,
): Promise<SavedState> {
  const index = await loadIndex();
  const state = index?.states[code];
  if (!index || !state) throw new Error(`No offline data for ${code}`);
  const pack: PackIndex = index; // (a plain name TypeScript keeps non-null inside worker)
  const squares = state.tiles;

  let done = 0;
  let bytes = 0;
  const queue = [...squares];
  onProgress(0, squares.length);

  // Six downloads at a time: fast, but kind to the server.
  async function worker() {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      const places = await loadTile(id, pack);
      bytes += JSON.stringify(places).length;
      onProgress(++done, squares.length);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  const saved: SavedState = { builtAt: index.builtAt, bytes };
  await set("saved-states", { ...(await savedStates()), [code]: saved }, db());
  return saved;
}

/** Delete every saved square and every saved state ("Clear data on this device"). */
export async function clearPacks(): Promise<void> {
  resetPacks();
  try {
    await clear(db());
    await del("index", db());
  } catch {
    // see above
  }
}
