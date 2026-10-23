# Demo video script: NearAid (2 to 3 minutes)

> Say it in your own words; don't read it word for word. Lines marked ✏️ are yours to fill in.

## Before you record

- **Search first, on your phone, with Wi-Fi on.** Use the place you'll demo (your town, or downtown DC). The free map server can take 30 to 60 seconds, so do this _before_ recording. When you record, the results load instantly from the phone's saved copy.
- **Install the app:** open https://nandan458.github.io/help-finder/ in your phone's browser and choose **Add to Home Screen**. Record from the home-screen icon; it looks like a real app.
- **Pick one place to show** that has hours and a phone number (a library or food bank works well). Save it once so _Saved (1)_ shows up.
- **Set up the phone:** language English, appearance Automatic, Do Not Disturb on, and a full battery.
- **Recording:** use the phone's screen recorder and record your voice separately, or film the phone with a second phone. Hold it steady and tap slowly.

---

## 0:00 to 0:20 · The hook: one real story

**On screen:** your face, or a photo of a bus stop, food bank, or library in your area.

**Say:** ✏️ A short, true story. For example:

> "Last winter, someone at my school needed a free meal on a Saturday. We searched online and found a food pantry, took the bus there, and it was closed. Its hours had changed and the website was wrong. That wasted trip is what NearAid is built to prevent."

## 0:20 to 0:40 · Who it's for, and why it works anywhere

**On screen:** the app's home-screen icon, then the welcome screen.

**Say:**

> "NearAid is for anyone who needs free help: people new to an area, people without a home, families on a tight budget, and Spanish speakers. It uses OpenStreetMap, a free world map made by volunteers, so it works anywhere, not just one city. No account, no ads, no tracking."

## 0:40 to 1:50 · Live demo on the phone

Tap slowly and say what you're doing. Each step is about 7 seconds.

1. **Allow location.** Tap **Use my location**, then Allow. _"It explains why it needs my location and that it never saves it."_
2. **Help nearby.** The map fills with colored pins. _"Every free place near me: food, health, shelter, Wi-Fi, water, restrooms. The list is sorted by how long it takes to walk."_
3. **Open now.** Tap the **Open now** pill. _"Now only places that are open right now. It even says when each one closes."_
4. **Open a place.** Tap your chosen place. _"Its hours for the week with today highlighted, the phone number to call, and whether it's free."_
5. **Walking directions.** Tap the blue **walk-time button**. _"The walking route is right on the map, with step-by-step directions, without leaving the app."_ Then tap **Back to place**.
6. **Spanish.** Open **Settings** (the sliders icon), choose **Español**, close it. _"Everything switches to Spanish, even the walking directions."_
7. **Read aloud.** Tap **Escuchar** (Listen). Let it read for a few seconds. _"For people who have trouble reading small text, or are reading in their second language."_ Switch back to English.
8. **Dark mode.** Settings, then **Dark**. _"Easier on the eyes at night, and it saves battery."_
9. **Offline.** Turn on **airplane mode**, close the app, and open it again. _"No signal, but it still works. It shows my last results and my saved places."_ Turn airplane mode off.
10. **Help lines.** Tap the red **Help lines** button. _"911, the 988 crisis line, and 211 for local help are always one tap away. If a search finds very little nearby, they show up on their own."_

## 1:50 to 2:20 · One technical challenge

**On screen:** your laptop, showing the code on GitHub. Good files to show:

- [`src/lib/hours.ts`](src/lib/hours.ts): the `hoursStatus` function
- [`src/lib/categories.ts`](src/lib/categories.ts): the comment about `amenity=shelter`

Zoom in so the text is readable.

**Say** (from _Option A_ in SUBMISSION.md, in your own words):

> "The hardest part was trusting the data. OpenStreetMap is written by volunteers, so the same kind of place is tagged in different ways, and hours are stored in a code like 'Mo to Th, 9 to 5, holidays off'. I used a library made by the OpenStreetMap community to read the hours, tested it on real data, and found two cases where it breaks, so my code handles both. The app only says 'Open' when it's sure; otherwise it says 'call ahead'. There are 140 automated tests checking this with real map data."

## 2:20 to 2:45 · Impact and what's next

**On screen:** the map on your phone, zoomed out over your district.

**Say:**

> "NearAid is free, works in English and Spanish, and works offline on an old phone. ✏️ In my district, it shows [number] free places, including [one you know]. Next, I want to make searches instant everywhere and add more languages. And anyone can make it better: if a place is missing, you can add it to OpenStreetMap, and it shows up in the app. Thanks for watching."

**End card (3 seconds):** the app name, the link https://nandan458.github.io/help-finder/, and your name.

---

## Checklist

- [ ] Under 3 minutes
- [ ] Shows the app running on a real phone
- [ ] You can be heard clearly; no background music over your voice
- [ ] Includes airplane mode (offline) and Spanish
- [ ] Says out loud that you used an AI coding assistant to help write the code, if the challenge rules ask for it
- [ ] Uploaded as **public** or **unlisted** (not private), with the link added to SUBMISSION.md
