# Submission draft: NearAid

> **These are drafts.** Rewrite every answer in your own words before you submit. Judges want to hear _you_, and you need to be able to say all of it out loud. Lines marked ✏️ need something only you know.

**Live app:** https://nandan458.github.io/help-finder/
**Code:** https://github.com/nandan458/help-finder
**Demo video:** ✏️ add the link after you upload it

---

## App name

NearAid

## Target audience

Anyone who needs free help, wherever they are: people new to an area, people experiencing homelessness, travelers, families on a tight budget, and people who speak languages other than English. Many of them have older phones and limited data. A second group is the people who help others find resources, like school counselors, librarians, social workers, and volunteers.

✏️ Add a sentence about who needs this in _your_ district (for example, a shelter, food bank, or library you know of).

## What the app does and the problem it solves

When people need free food, a clinic, a shelter, Wi-Fi, a restroom, or clean water, the information is scattered across websites that are often out of date, cover only one city, or need an account. And if you show up somewhere that turns out to be closed, you've lost a trip that might have cost bus fare or a missed shift.

NearAid puts it all on one map. It finds free resources near you, tells you what's open right now and when it closes, and shows the route right in the app for walking, biking, or driving (bus and train times open your phone's maps app, which has the live schedules). It starts with one question, "What do you need?", with big picture buttons for food, health care, a place to stay, Wi-Fi, water, and restrooms, so people get to what matters in one tap. It speaks nine languages, picked on the first screen, and needs no account. It installs to your home screen, and if you save your state once, it works in **airplane mode**, even in places you've never been. If there isn't much nearby, it shows help lines like 211 and 988 so no one leaves empty-handed.

## How the app works

1. You pick a language and what you need, then allow location (or type a city or address).
2. The app finds places from OpenStreetMap, a free map made by volunteers worldwide: food banks, clinics, shelters, libraries, drinking fountains, public restrooms, and showers. Inside the U.S., it reads small pre-made files that a weekly job builds from OpenStreetMap's state downloads, so it's instant. Anywhere else, it asks the live server.
3. It sorts the places into seven categories, works out which are open right now from their hours, and shows them on a map and in a list sorted by walking time. If you picked "food" and the nearest food bank is far, it looks farther until it finds some.
4. You can filter by category, by _Open now_, _Free_, or _Wheelchair accessible_, and open any place to see its hours for the week, phone, address, directions by foot, bike, or car drawn on the map, and more.
5. Results and any state you saved are kept on the phone, so searching works offline.

It's a website built with React and TypeScript, using Leaflet for the map. It has no server of its own and no accounts or tracking, and it's published for free on GitHub Pages.

## The hardest technical challenge, and how I solved it

> Pick **one** to talk about. Option B is the strongest story (a real problem, a real measurement, a real fix); A and C are good backups.

### A. Turning messy volunteer map data into a trustworthy "Open now"

OpenStreetMap is written by volunteers, so the same kind of place gets tagged in different ways. A homeless shelter might be tagged `social_facility=shelter`, but `amenity=shelter` means a bus stop roof, so the obvious tag is the wrong one. A library often appears twice, once as a point and once as its building outline.

The hours are even trickier. They're stored in a compact code like `Mo-Th 09:00-17:00; Fr 09:00-12:00; PH off`, which includes holidays, lunch breaks, "sunrise to sunset", and times past midnight like `05:00-25:00`.

So I did three things:

1. **Rules for categories.** I wrote rules, checked against the OpenStreetMap wiki, that decide which tags count as which category, and I merge duplicates by name and distance.
2. **A proper hours parser.** I used the opening_hours library, which the OpenStreetMap community maintains, to read the hours. When I tested it on every real hours string in my test data, I found it needs the place's location for sunrise times, but fails on holiday rules if you give it a location with no country. My code handles both cases.
3. **Never guessing.** The app only says "Open" or "Free" when the data says so. Otherwise it says "Hours unknown, call ahead", because showing up somewhere closed is exactly the wasted trip this app exists to prevent.

I tested all of this with 173 automated tests, using real map data saved from downtown DC and a small town in Maryland.

### B. The free map server was too slow, so I built my own fast copy of the data

My first version asked the free Overpass server for places on every search. It's shared by thousands of apps, and a single search could take **30 to 60 seconds**, mostly waiting in line. I can't make their server faster, so I took the work off it:

1. **Measure first.** I timed both public servers with real searches. I made the app ask for 5 km once instead of 2 km and then 5 km, and I replaced a backup server that never answered. That helped, but not enough.
2. **Do the work ahead of time, like big map apps do.** Once a week, a GitHub job downloads every state from Geofabrik (a service that publishes OpenStreetMap by state), keeps the free places, and cuts the whole country into 9,400 small files, one per area. The app reads just the one to four files around you. A search went from about 40 seconds to **about 1.5 seconds**, with no request to the slow server.
3. **Prove it's right.** I compared my files with what the live server returned for downtown DC. My first version was **missing 63 of 172 places**: every place mapped as a building, such as the main library, because of how the download tool numbers building shapes. I found it, fixed it, and wrote a test. The second comparison matched **172 of 172, in every category**.
4. **Never trust it blindly.** The same function that decides what counts as a food bank or a shelter runs in the app and in the weekly job, so they can't disagree. If a file is missing, or you're outside the U.S., the app quietly asks the live server instead.

This also made airplane mode possible, because the same files can be saved on the phone.

### C. Making it work with no signal

The app has three offline layers: the app's own code (a service worker), the places (small files saved on the phone, for a whole state if you choose "Save for offline use"), and the map pictures you've already seen. Each one has a size or time limit, so it never fills up a cheap phone. I tested it on the live site in a real browser: I searched Baltimore, saved Maryland, turned the network off, and opened the app in Frederick, a place I never searched. It showed 29 places with hours and walking times.

## What I'd add next

- **The same offline data for other countries:** the weekly job already works state by state; Canada, Mexico, and others use the same download service.
- **Native-speaker review and more languages:** I wrote the nine languages with AI help, and I'd like native speakers to check each one. Each language is one file, and Arabic needs a right-to-left layout.
- **Directions steps in all nine languages:** the free routing service only writes steps in six of them, so Chinese, Tagalog, and Haitian Creole currently get English steps.
- **Bus and train routes inside the app:** that needs live schedule data, which free map data doesn't include, so for now it opens the phone's maps app.
- **"Add a missing place" inside the app:** let people suggest a food pantry or free clinic directly, sent to OpenStreetMap so everyone benefits.
- **Local help-line numbers outside the U.S.:** pick the right emergency and help numbers from the country you're in.
- **Partnering with local organizations:** ✏️ name one in your district (a food bank, library, or shelter) that could check and update its own information.

## Tools and technologies

React, TypeScript, Vite, Leaflet (map), OpenStreetMap data (weekly state downloads from Geofabrik filtered with osmium; live Overpass API and Nominatim), Valhalla routing, opening_hours.js, vite-plugin-pwa (offline and installable), IndexedDB, Vitest (testing), ESLint and Prettier, GitHub Actions and GitHub Pages. Lighthouse on the live site: Performance 97, Accessibility 100, Best Practices 100.

**AI assistance:** I used Claude Code, Anthropic's AI coding assistant, to help write the code, working in phases from my plan and reviewing each one. ✏️ Describe in your own words what _you_ decided, designed, and changed (for example: the name, the nine languages, the "What do you need?" screen, the decision that it must work in airplane mode, the privacy choices, the parts you edited yourself).
