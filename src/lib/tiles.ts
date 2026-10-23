// Offline packs cut the country into a grid of squares ("tiles"), each 0.25
// degrees on a side (about 28 km tall and 20 km wide in the U.S.). Each square
// is one small file holding every free place inside it. To search near you, the
// app downloads just the one to four squares around you, instead of asking a
// busy server to search the whole map.
//
// This file has no imports on purpose: the pack builder (scripts/build-packs.mjs)
// runs in Node and uses it too, so the app and the builder always agree on the grid.

export const TILE_DEGREES = 0.25;

/** The grid position of the square containing a point, like "155_-308". */
export function tileId(lat: number, lng: number): string {
  return `${Math.floor(lat / TILE_DEGREES)}_${Math.floor(lng / TILE_DEGREES)}`;
}

/** Every square that touches the box around a point, `radiusM` meters each way. */
export function tilesAround(lat: number, lng: number, radiusM: number): string[] {
  const dLat = radiusM / 111_320; // meters per degree of latitude
  const dLng = radiusM / (111_320 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
  const ids: string[] = [];
  const y1 = Math.floor((lat + dLat) / TILE_DEGREES);
  const x1 = Math.floor((lng + dLng) / TILE_DEGREES);
  for (let y = Math.floor((lat - dLat) / TILE_DEGREES); y <= y1; y++) {
    for (let x = Math.floor((lng - dLng) / TILE_DEGREES); x <= x1; x++) ids.push(`${y}_${x}`);
  }
  return ids;
}

/** The squares next to a square (and itself): used to decide if an area is covered. */
export function neighborIds(id: string, distance = 1): string[] {
  const [y, x] = id.split("_").map(Number);
  const ids: string[] = [];
  for (let dy = -distance; dy <= distance; dy++) {
    for (let dx = -distance; dx <= distance; dx++) ids.push(`${y + dy}_${x + dx}`);
  }
  return ids;
}
