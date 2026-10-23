# Local data guide: add or fix places in your area

NearAid shows places from **OpenStreetMap (OSM)**, the free world map that volunteers write, like Wikipedia for maps. If a food pantry, clinic, or water fountain near you is missing or wrong, **you can fix it yourself**, and it will show up in NearAid after the next weekly update (or right away, for people whose phones ask the live server).

This guide is for improving the data in **your district** before the deadline, and it's also a good thing to mention in your video: *anyone can make the app better.*

---

## 1. Make a free account (5 minutes)

1. Go to https://www.openstreetmap.org and click **Sign Up**.
2. Confirm your email. Use your real name or a username; either is fine.

## 2. Check what's already there

1. Open NearAid and search your town. Look through the list for places you know.
2. Open https://www.openstreetmap.org and find your neighborhood. Click any place on the map to see its details on the left. Click **Edit** to change it.

**Make a list first.** Write down 5 to 10 real places you know (a food pantry, the library, a free clinic, a shelter, the community center). Check each one on the map: is it there, is the name right, are the hours right?

## 3. Fix or add a place (with the right tags)

OSM describes places with **tags**, like `amenity=library`. NearAid only shows places with the tags below, so use exactly these.

| NearAid category | Tags to use | Notes |
| --- | --- | --- |
| **Food** | `social_facility=food_bank` or `social_facility=soup_kitchen` | A pantry or a place serving free meals. |
| | `amenity=food_sharing` | A community fridge or free shelf. |
| **Health** | `amenity=clinic` or `healthcare=clinic` | Add `fee=no` if it's free. |
| | `amenity=pharmacy` | Shown as "may cost money". |
| | `healthcare=*` or `amenity=doctors` / `amenity=dentist` **plus `fee=no`** | Only shown if marked free. |
| **Shelter** | `social_facility=shelter` | Add `social_facility:for=homeless` (or `homeless;women`, `homeless;youth`...) for who it's for. |
| | `social_facility:for=homeless` | Other services for people without a home. |
| **Internet** | `amenity=library` | Libraries are included automatically. |
| | `amenity=community_centre` | Community centers, too. |
| | `internet_access=wlan` **plus** `internet_access:fee=no` | Any place with free Wi-Fi for everyone. |
| **Water** | `amenity=drinking_water` | A fountain or bottle filler. |
| **Restrooms** | `amenity=toilets` | Add `fee=no` and `wheelchair=yes` if true. |
| **Showers** | `amenity=shower` | Public showers. |

> **Don't use `amenity=shelter`.** In OSM that means a bus-stop roof or picnic shelter, not a place to sleep. NearAid ignores it on purpose.

### Details that make a place much more useful

Add these tags whenever you know them. NearAid shows every one:

| Tag | Example | What NearAid does with it |
| --- | --- | --- |
| `name` | `Bread for the City` | The place's name. |
| `opening_hours` | `Mo-Th 09:00-17:00; Fr 09:00-12:00` | **"Open now" and "Closes 5:00 PM"**, plus the week's hours. |
| `phone` | `+1 202 555 0100` | The **Call** button. |
| `website` | `https://example.org` | A link on the place card. |
| `fee` | `no` | Marks it **Free** (use `fee=yes` if it costs money). |
| `wheelchair` | `yes`, `limited`, `no` | Wheelchair info and the Wheelchair filter. |
| `addr:housenumber`, `addr:street`, `addr:city`, `addr:state`, `addr:postcode` | `1525`, `7th Street NW`... | The address. |
| `description` | `Free groceries, bring ID` | An "About" line. |

### Writing `opening_hours` correctly

The format is exact. Examples:

- Monday to Friday, 9 to 5: `Mo-Fr 09:00-17:00`
- Different hours on some days: `Mo-Th 09:00-17:00; Fr 09:00-12:00`
- Closed Sunday: `Mo-Sa 10:00-18:00; Su off`
- Lunch break: `Mo-Fr 09:00-12:00,13:00-17:00`
- Open all the time: `24/7`
- By appointment: `Mo-Fr 09:00-17:00 "by appointment"` (NearAid then says "call ahead")

Use 24-hour time (`17:00`, not `5pm`). Test it at https://openingh.ypid.de/evaluation_tool/, which shows if it's valid.

## 4. How to edit

**On a computer (easiest):** open openstreetmap.org, zoom to the place, and click **Edit**, then **iD editor**. Click the place (or click **+ Point** to add a new one), choose the type from the list (for example "Library" or "Food Bank"), and fill in the fields. Click **Save**, and write a short note like "Added hours and phone for the food pantry".

**On a phone:** [StreetComplete](https://streetcomplete.app) (Android) asks simple quiz questions about places near you, like "What are the opening hours?". [Every Door](https://every-door.app) (Android and iPhone) lets you add and edit places quickly while you walk around.

**Important rules**

- **Only add what you can see or confirm yourself** (visit, or call the place). Don't copy from Google Maps or other maps; their data isn't allowed in OSM.
- **Public places only.** Never add private homes or personal information.
- **Don't map anything you're not sure about.** A wrong "free" or "open" label sends someone on a wasted trip.

## 5. See your changes in NearAid

- Changes to OpenStreetMap show up on the live server within minutes to a day.
- NearAid's saved offline packs are rebuilt **every Sunday**, so packs can be up to a week old.
- Phones also keep search results for a while. To see changes sooner, search from a new spot or use **Settings → Clear data on this device**.

## 6. A plan for the weekend

1. **Friday evening:** make your account and list 5 to 10 real places in your district.
2. **Saturday:** check each one on openstreetmap.org and fix names, hours, phone numbers, and `fee=no`. Add any that are missing. Aim for **10 good edits**.
3. **Sunday:** open NearAid and check your area again. Take a screenshot or two for your video of a place you improved.

**Tip for your video and write-up:** count how many places you added or fixed (OSM shows your edit history on your profile). "I added 12 places in my district" is a strong, true statement.

## Helpful links

- OSM beginner's guide: https://learnosm.org/en/beginner/
- Tag reference for each place type: https://wiki.openstreetmap.org/wiki/Map_features
- Report a mistake without making an account: https://www.openstreetmap.org/fixthemap
- StreetComplete: https://streetcomplete.app
