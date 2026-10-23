# Submission draft: NearAid

> **These are drafts.** Rewrite every answer in your own words before you submit. Judges want to hear _you_, and you need to be able to say all of it out loud. Lines marked ✏️ need something only you know.

**Live app:** https://nandan458.github.io/help-finder/
**Code:** https://github.com/nandan458/help-finder
**Demo video:** ✏️ add the link after you upload it

---

## App name

NearAid

## Target audience

Anyone who needs free help, wherever they are: people new to an area, people experiencing homelessness, travelers, families on a tight budget, and Spanish speakers. Many of them have older phones and limited data. A second group is the people who help others find resources, like school counselors, librarians, social workers, and volunteers.

✏️ Add a sentence about who needs this in _your_ district (for example, a shelter, food bank, or library you know of).

## What the app does and the problem it solves

When people need free food, a clinic, a shelter, Wi-Fi, a restroom, or clean water, the information is scattered across websites that are often out of date, cover only one city, or need an account. And if you show up somewhere that turns out to be closed, you've lost a trip that might have cost bus fare or a missed shift.

NearAid puts it all on one map. It finds free resources near you, tells you what's open right now and when it closes, and shows the walking route right in the app. It works anywhere in the world, in English and Spanish, with no account. It installs to your home screen and still works with no signal, using your last results. If there isn't much nearby, it shows help lines like 211 and 988 so no one leaves empty-handed.

## How the app works

1. You allow location, or type a city or address.
2. The app asks OpenStreetMap, a free map made by volunteers worldwide, for places tagged as food banks, clinics, shelters, libraries, drinking fountains, public restrooms, and showers within 5 km. It shows the closest 2 km first and only looks farther if there's very little nearby.
3. It sorts the places into seven categories, works out which are open right now from their hours, and shows them on a map and in a list sorted by walking time.
4. You can filter by category, by _Open now_, _Free_, or _Wheelchair accessible_, and open any place to see its hours for the week, phone, address, walking directions, and more.
5. Results are saved on the phone, so searching the same area again is instant and works offline.

It's a website built with React and TypeScript, using Leaflet for the map. It has no server of its own and no accounts or tracking, and it's published for free on GitHub Pages.

## The hardest technical challenge, and how I solved it

> Pick **one** to talk about. Option A is the best story; B and C are backups.

### A. Turning messy volunteer map data into a trustworthy "Open now"

OpenStreetMap is written by volunteers, so the same kind of place gets tagged in different ways. A homeless shelter might be tagged `social_facility=shelter`, but `amenity=shelter` means a bus stop roof, so the obvious tag is the wrong one. A library often appears twice, once as a point and once as its building outline.

The hours are even trickier. They're stored in a compact code like `Mo-Th 09:00-17:00; Fr 09:00-12:00; PH off`, which includes holidays, lunch breaks, "sunrise to sunset", and times past midnight like `05:00-25:00`.

So I did three things:

1. **Rules for categories.** I wrote rules, checked against the OpenStreetMap wiki, that decide which tags count as which category, and I merge duplicates by name and distance.
2. **A proper hours parser.** I used the opening_hours library, which the OpenStreetMap community maintains, to read the hours. When I tested it on every real hours string in my test data, I found it needs the place's location for sunrise times, but fails on holiday rules if you give it a location with no country. My code handles both cases.
3. **Never guessing.** The app only says "Open" or "Free" when the data says so. Otherwise it says "Hours unknown, call ahead", because showing up somewhere closed is exactly the wasted trip this app exists to prevent.

I tested all of this with 140 automated tests, using real map data saved from downtown DC and a small town in Maryland.

### B. The free map server was slow, so I made the app smarter about waiting

The free Overpass server is shared by thousands of apps, and a single search could take 30 to 60 seconds. I can't make their server faster, so I changed how my app uses it:

- **One request instead of two.** Asking for a bigger area hardly takes longer, so I ask for 5 km once and pick out the closest 2 km on the phone.
- **Saved results.** Results are saved on the phone, so the same area is instant the next time and works offline.
- **A backup server.** When the main server is busy, the app tries a backup once. I tested the backup servers and replaced one that never answered.
- **Honest waiting.** The app tells people the server can be slow instead of looking frozen.

### C. Making it work with no signal

The app has three offline layers: the app's own code (a service worker), the search results (a small database on the phone), and the map pictures you've already seen. Each one has a size or time limit, so it never fills up a cheap phone. I tested it by turning off the network in a real browser and reloading: it still opened, showed the last results, and showed saved places.

## What I'd add next

- **Instant results everywhere in the U.S.:** pre-sort all the free places into small neighborhood files once a week, so searches don't have to wait on the shared server.
- **More languages:** each language is one file, so Chinese, Vietnamese, Arabic, or Haitian Creole would be easy to add with help from native speakers.
- **"Add a missing place" inside the app:** let people suggest a food pantry or free clinic directly, sent to OpenStreetMap so everyone benefits.
- **Local help-line numbers outside the U.S.:** pick the right emergency and help numbers from the country you're in.
- **Partnering with local organizations:** ✏️ name one in your district (a food bank, library, or shelter) that could check and update its own information.

## Tools and technologies

React, TypeScript, Vite, Leaflet (map), OpenStreetMap data through the Overpass API and Nominatim, Valhalla routing, opening_hours.js, vite-plugin-pwa (offline and installable), IndexedDB, Vitest (testing), ESLint and Prettier, GitHub Actions and GitHub Pages.

**AI assistance:** I used Claude Code, Anthropic's AI coding assistant, to help write the code, working in phases from my plan and reviewing each one. ✏️ Describe in your own words what _you_ decided, designed, and changed (for example: the features, the Spanish support, the privacy choices, the parts you edited yourself).
