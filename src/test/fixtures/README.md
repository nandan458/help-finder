# Test fixtures

These are real answers from the Overpass API, saved on 2026-10-17, so tests can
check our code against real OpenStreetMap data without using the internet.

| File                    | Where                                              | Radius |
| ----------------------- | -------------------------------------------------- | ------ |
| `dc-downtown-2km.json`  | Downtown Washington, DC (38.899, -77.025)          | 2 km   |
| `thurmont-md-15km.json` | Thurmont, Maryland, a small town (39.624, -77.411) | 15 km  |

They were made with the query from `buildQuery()` in `src/lib/overpass.ts`
(at that time the homeless line matched `="homeless"` exactly; it now matches
any value containing "homeless").

To capture a new one, paste the output of `buildQuery(lat, lng, radius)` into
https://overpass-turbo.eu, run it, then use Export → "raw OSM data" and save the
JSON here. Please only do this occasionally: Overpass is run by volunteers.
