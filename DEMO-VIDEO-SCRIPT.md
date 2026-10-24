# Demo video script: NearAid (2 to 3 minutes)

> Say it in your own words; don't read it word for word. Lines marked ✏️ are yours to fill in.

## Before you record

- **Install the app on Wi-Fi:** open https://nandan458.github.io/help-finder/ in your phone's browser and choose **Add to Home Screen**. Close it completely and open it **twice** so you get the newest version. Record from the home-screen icon; it looks like a real app.
- **Practice the offline demo first, in your own state.** Open the app, go to **Settings → Offline use**, and tap **Save <your state> for offline use** (a few MB). Then turn on airplane mode and search. If you can't see the Offline use section, you're on an old copy: reopen the app again.
- **To show the first-time screens** (language, "What do you need?"), clear the site's data first: browser menu → Site settings → Clear data for this site. Then the language chooser shows again.
- **Pick one place to show** that has hours and a phone number (a library or food bank works well). Save it once so _Saved (1)_ shows up.
- **Set up the phone:** appearance Automatic, Do Not Disturb on, and a full battery.
- **Recording:** use the phone's screen recorder and record your voice separately, or film the phone with a second phone. Hold it steady and tap slowly.

---

## 0:00 to 0:20 · The hook: one real story

**On screen:** your face, or a photo of a bus stop, food bank, or library in your area.

**Say:** ✏️ A short, true story. For example:

> "Last winter, someone at my school needed a free meal on a Saturday. We searched online and found a food pantry, took the bus there, and it was closed. Its hours had changed and the website was wrong. That wasted trip is what NearAid is built to prevent."

## 0:20 to 0:40 · Who it's for, and why it works anywhere

**On screen:** the app's home-screen icon, then the language chooser.

**Say:**

> "NearAid is for anyone who needs free help: people new to an area, people without a home, families on a tight budget, and people who speak many different languages, so the very first screen lets you pick yours. It uses OpenStreetMap, a free world map made by volunteers, so it works anywhere, not just one city. No account, no ads, no tracking."

## 0:40 to 1:50 · Live demo on the phone

Tap slowly and say what you're doing. Each step is about 7 seconds.

1. **Language and need.** Tap **English** (show the other languages for a second), then tap **Free food**. _"Nine languages. And instead of a search box, it just asks what I need, with big buttons, so anyone can use it, even if reading is hard."_
2. **Allow location.** Tap **Use my location**, then Allow. _"It explains why it needs my location and that it never saves it."_ The map opens already showing food. _"Here are the free food places near me, nearest first. If the nearest one is far, it looks farther until it finds some."_ Then clear the **Food** button to see everything: _"Or everything: health, shelter, Wi-Fi, water, restrooms."_
3. **Open now.** Tap the **Open now** pill. _"Now only places that are open right now. It even says when each one closes."_
4. **Open a place.** Tap your chosen place. _"Its hours for the week with today highlighted, the phone number to call, and whether it's free."_
5. **Directions.** Tap the blue **walk-time button**. _"The route is right on the map, with step-by-step directions, without leaving the app."_ Tap **Bike**, then **Drive**: _"Not everyone walks. Bike and car routes too. For buses I send you to your phone's maps app, because bus times change daily and I won't guess."_ Then tap **Back to place**.
6. **Another language.** Open **Settings** (the sliders icon), choose **Español** (or Tiếng Việt, or 한국어), close it. _"Everything switches, even the walking directions."_
7. **Read aloud.** Tap **Escuchar** (Listen). Let it read for a few seconds. _"For people who have trouble reading small text, or are reading in their second language."_ Switch back to English.
8. **Dark mode.** Settings, then **Dark**. _"Easier on the eyes at night, and it saves battery."_
9. **Airplane mode.** Open **Settings → Offline use** and show it saved your state. Turn on **airplane mode**, close the app, and open it again. Tap **Use my location** (GPS still works with no signal) and search somewhere you did _not_ search before. _"No signal at all, and it still finds places, because I saved my state on the phone. This place I've never searched. The map picture only shows areas I've viewed, but all the places and the list work."_ Turn airplane mode off.
10. **Help lines.** Tap the red **Help lines** button. _"911, the 988 crisis line, and 211 for local help are always one tap away. If a search finds very little nearby, they show up on their own."_

## 1:50 to 2:20 · One technical challenge

**On screen:** your laptop, showing GitHub. Good things to show:

- [`scripts/build-packs.mjs`](scripts/build-packs.mjs): the top comment that explains the weekly job
- The **Actions** tab, with a green "Build offline packs" run
- [`src/lib/categories.ts`](src/lib/categories.ts): the comment about `amenity=shelter` (if you'd rather tell the "messy data" story instead, see Option A in SUBMISSION.md)

Zoom in so the text is readable.

**Say** (from _Option B_ in SUBMISSION.md, in your own words):

> "The hardest part was speed. The free map server everyone shares took thirty to sixty seconds for one search. I can't speed up their server, so I did the work ahead of time, like big map apps do. Every week, a GitHub job downloads every state, keeps the free places, and cuts the country into nine thousand small files. Now a search reads a few small files and takes about a second and a half. To make sure I didn't lose anything, I compared my files with the live server for downtown DC. My first version was missing sixty-three of a hundred seventy-two places, every one a building like a library. I found why, fixed it, and the second check matched a hundred seventy-two out of a hundred seventy-two."

## 2:20 to 2:45 · Impact and what's next

**On screen:** the map on your phone, zoomed out over your district.

**Say:**

> "NearAid is free, works in nine languages, and works in airplane mode on an old phone. ✏️ In my district, it shows [number] free places, including [one you know]. Next, I want native speakers to check each language, and to bring the same offline data to other countries. And anyone can make it better: if a place is missing, you can add it to OpenStreetMap, and it shows up in the app. Thanks for watching."

**End card (3 seconds):** the app name, the link https://nandan458.github.io/help-finder/, and your name.

---

## Checklist

- [ ] Under 3 minutes
- [ ] Shows the app running on a real phone
- [ ] You can be heard clearly; no background music over your voice
- [ ] Includes airplane mode (offline), the language chooser, and "What do you need?"
- [ ] Says out loud that you used an AI coding assistant to help write the code, if the challenge rules ask for it
- [ ] Uploaded as **public** or **unlisted** (not private), with the link added to SUBMISSION.md
