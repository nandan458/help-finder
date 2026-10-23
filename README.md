# NearAid

**Free help near you, in English and Spanish, anywhere.**

NearAid is a free map app that shows free food, health care, shelter, internet, drinking water, restrooms, and showers near you, tells you what's **open right now**, and shows you **how to walk there**. It works on any phone with a web browser, installs to the home screen, and keeps working with no signal.

**Try it:** https://nandan458.github.io/help-finder/

|                          Phone, light, English                          |                               Phone, dark, Spanish                                |                                 Walking directions                                 |
| :---------------------------------------------------------------------: | :-------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------: |
| ![Nearby list in light mode](docs/screenshots/phone-list-light-en.webp) | ![Nearby list in dark mode, in Spanish](docs/screenshots/phone-list-dark-es.webp) | ![Walking route drawn on the map](docs/screenshots/phone-directions-light-en.webp) |

|                                  Place card, English                                   |                              Place card, dark, Spanish                               |
| :------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: |
| ![A library's card with hours and actions](docs/screenshots/phone-place-light-en.webp) | ![The same card in dark mode and Spanish](docs/screenshots/phone-place-dark-es.webp) |

![Desktop: frosted panel with the list, full-screen map with clustered pins](docs/screenshots/desktop-light-en.webp)

---

## The problem

People who need help often don't know what's nearby or when it's open. The information is scattered and out of date, most directories cover just one city or need an account, and showing up somewhere closed wastes a trip that may have cost bus fare or a missed shift.

## Who it helps

- **Anyone who needs free resources, wherever they are:** people new to an area, people experiencing homelessness, travelers, families on a tight budget, and Spanish speakers. Many of them use older phones with limited data, so the app is small, fast, and works offline.
- **People who help others:** counselors, librarians, social workers, and volunteers can look up nearby resources and share a link to one place.

## Features

- **Find help near you.** Uses your location (or a city or address you type) and searches within 2 km, widening to 5 km and 15 km if there's little nearby. It always says how far it looked.
- **Map and list together.** Color-coded pins that group into numbered bubbles when zoomed out, and a list sorted by walking time. Tap either one to open the place.
- **Open now.** Every place with hours shows _Open · Closes 7:00 PM_, _Closes soon_, _Closed · Opens tomorrow 9:00 AM_, or _Hours unknown, call ahead_, updated every minute.
- **Filters.** Category buttons, plus _Open now_, _Free_, _Wheelchair_, and _Saved_.
- **Place card.** Status, distance and walk time, address, tap-to-call phone, website, the week's hours with today highlighted, cost, and wheelchair access.
- **Walking directions in the app.** The route is drawn on the map with numbered steps in English or Spanish. The phone's own maps app is one tap away for turn-by-turn navigation.
- **English and Spanish** for everything, remembered on the device. Adding a language means adding one file.
- **Read aloud.** Hear a place's name, status, walk time, and address, in the current language.
- **Help lines, always one tap away:** 911, the 988 Suicide & Crisis Lifeline, and 211. They also appear on their own when a search finds very few places.
- **Saved places** that work offline.
- **Share a place.** Every place has its own link that opens straight to it.
- **Works offline.** The app, your last search results, your saved places, and map areas you've viewed all work with no signal.
- **Installable** to the home screen like a regular app.
- **Settings:** light, dark, or automatic appearance; larger text; a plain-language privacy page; and _Clear data on this device_.
- **Accessible:** works with a keyboard and screen readers, color is never the only clue, and buttons are large enough to tap.

## How it works

1. **Where are you?** The app asks for the phone's location. If you say no, you can type a city or address instead; [Nominatim](https://nominatim.org/), OpenStreetMap's search service, turns it into a point on the map.
2. **What's nearby?** The app asks the [Overpass API](https://overpass-api.de/) for every place within 5 km that's tagged as a food bank, soup kitchen, clinic, shelter, library, drinking fountain, public restroom, and so on. It picks out the closest 2 km on the phone, and only asks again for 15 km if there are too few places.
3. **Cleaning up the data.** [OpenStreetMap](https://www.openstreetmap.org/) is made by volunteers, so the same kind of place is tagged in different ways. [`categories.ts`](src/lib/categories.ts) decides which tags count as which category, removes duplicates (a library mapped both as a point and as its building), and only calls a place _Free_ when the data says so.
4. **Open now.** The [opening_hours](https://github.com/opening-hours/opening_hours.js) library reads OSM's compact hours format (`Mo-Fr 09:00-17:00; Sa 10:00-14:00`, holidays, sunrise-sunset...). [`hours.ts`](src/lib/hours.ts) turns that into "open, closed, or unknown, and when that changes".
5. **Walking directions.** [Valhalla](https://github.com/valhalla/valhalla), a free routing service run by the [FOSSGIS](https://fossgis.de/) volunteers, returns the route and the steps in the app's language.
6. **Saving for later.** Search results are saved on the phone (IndexedDB) for up to a week, so repeat searches are instant and work offline. A service worker keeps a copy of the app itself.

## Tech stack

| Part    | What we use                                                                                                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App     | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)                                                                                                                                               |
| Map     | [Leaflet](https://leafletjs.com/) with [react-leaflet](https://react-leaflet.js.org/) and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) (via react-leaflet-cluster), [OpenStreetMap tiles](https://www.openstreetmap.org/) |
| Data    | [Overpass API](https://overpass-api.de/), [Nominatim](https://nominatim.org/), [Valhalla](https://valhalla1.openstreetmap.de/) routing (FOSSGIS)                                                                                                       |
| Hours   | [opening_hours.js](https://github.com/opening-hours/opening_hours.js)                                                                                                                                                                                  |
| Offline | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox service worker), [idb-keyval](https://github.com/jakearchibald/idb-keyval) (IndexedDB)                                                                                                   |
| Styling | Plain CSS with design tokens (CSS variables) for light and dark mode                                                                                                                                                                                   |
| Testing | [Vitest](https://vitest.dev/): 140 tests, using saved real Overpass and Valhalla answers                                                                                                                                                               |
| Quality | ESLint, Prettier; Lighthouse mobile: Performance 95, Accessibility 100, Best Practices 100                                                                                                                                                             |
| Hosting | GitHub Pages, deployed by GitHub Actions on every push to `main`                                                                                                                                                                                       |

No backend, no accounts, no API keys, no tracking, no ads. Everything runs in the browser.

## Run it yourself

You need [Node.js](https://nodejs.org/) 22 or newer.

```bash
npm install
npm run dev        # start the app at http://localhost:5173
npm test           # run the tests
npm run lint       # check the code
npm run build      # make the production version in dist/
npm run preview    # try the production version (with offline support)
```

Other commands: `npm run format` (tidy the code with Prettier) and `npm run icons` (make the app icons from [`public/logo.svg`](public/logo.svg)).

To rename the app, change `APP_NAME` in [`src/config.ts`](src/config.ts). The search radii live there too.

### Project layout

```
src/
  app/         the screens and their logic (App, FinderScreen, hooks like useNearbySearch)
  components/  pieces of the screen (MapView, Sheet, PlaceCard, RouteView, HelpLines...)
  i18n/        en.json, es.json, and the translation helper
  lib/         plain logic with no React: overpass, categories, hours, cache, route...
  styles/      tokens.css (all colors and sizes), base.css
  test/        tests and saved real server answers (fixtures/)
.github/workflows/deploy.yml   checks, builds, and publishes the site
```

### Deploying

Every push to `main` runs [the deploy workflow](.github/workflows/deploy.yml): install, lint, test, build, publish to GitHub Pages. If the lint or tests fail, nothing is published. On a new copy of the repo, turn it on under **Settings → Pages → Source: GitHub Actions**.

## Privacy

- **Your location** is used only to find places near you. Before it leaves the phone, it's rounded to about 100 meters. Your exact location is never saved.
- **Who receives what:** OpenStreetMap's servers get the rounded location (to find places) and send the map pictures. A typed place goes to Nominatim. Walking directions send the rounded starting point and the place to the routing server.
- **On the phone:** saved places, recent search results, and roughly where you last searched (about 1 km) are kept so the app works offline. They're deleted after 7 days, or right away with _Settings → Clear data on this device_.
- **No accounts, cookies, analytics, ads, or trackers.**

## Using the free map services fairly

These services are run by volunteers, so the app follows their usage rules:

- **Overpass:** one search at a time, a timeout, a backup server tried once, and results saved on the phone so the same area isn't asked for again.
- **Nominatim:** at most one request per second, and only when the person presses Search (never while typing).
- **Valhalla:** at most one request per second, and only when someone asks for directions.
- **OpenStreetMap tiles:** credited on the map, and only the tiles you've looked at are saved for offline use (at most 300, for a week).
- **Credit and corrections:** every screen credits OpenStreetMap and links to [openstreetmap.org/fixthemap](https://www.openstreetmap.org/fixthemap), so anyone can fix wrong data.

## Credits

- **Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)**, under the [Open Database License](https://opendatacommons.org/licenses/odbl/). Every place in this app was added by a volunteer.
- [Overpass API](https://overpass-api.de/) and [Valhalla routing](https://valhalla1.openstreetmap.de/), run by [FOSSGIS e.V.](https://fossgis.de/), and the [maps.mail.ru](https://maps.mail.ru/osm/tools/overpass/) Overpass mirror.
- [Nominatim](https://nominatim.org/) and the map tiles, run by the [OpenStreetMap Foundation](https://osmfoundation.org/).
- Open-source libraries: React, Leaflet, react-leaflet, Leaflet.markercluster, react-leaflet-cluster, opening_hours.js, idb-keyval, vite-plugin-pwa and Workbox, Vite, Vitest, TypeScript, ESLint, Prettier.

## How this app was built

I planned the app: the problem, who it's for, its features, and its design. I built it with help from **Claude Code**, Anthropic's AI coding assistant, which wrote much of the code from my plan in step-by-step phases. Each phase stopped so I could run it, review it, and decide what came next. The code is written to be read: comments explain _why_, so I can explain every part of it.

Other tools: Chrome and Lighthouse (testing and performance checks), GitHub and GitHub Actions (code and publishing).

---

Made for the **2026 Congressional App Challenge**.
