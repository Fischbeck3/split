# Split

Hold your phone like a pint. Tilt it back to drink. Come back upright to stop, with the beer line through the middle of the mark. One scored sip a day, the same pour for everyone, and a card for the group chat.

**Play:** https://fischbeck3.github.io/split/

![Three glasses: a stout in a pub, a lager bottle on a beach, a stein at Oktoberfest](site/og.png)

## How it plays

- **Tilt.** On a phone, tap “Take today's sip” while holding it upright. Tip the phone either way to drink; tip farther to drink faster. Come back within 15 degrees of upright to stop. iPhones request motion access. If no sensor is available, the game uses hold mode.
- **Hold.** On touch or desktop, press and hold the glass or the “Hold to drink” button, then release to stop. The space bar works on a keyboard; a focused hold button also supports Enter.
- **The line.** What counts is the bottom of the head, where the foam meets the drink. Within 6% of the mark's height is a perfect split and within 16% is a split. The score is 100 at dead center and falls off quickly from there.
- **One a day.** The first completed sip each day is saved locally. Later sips are practice and cannot replace it. You can return to the saved score. A new glass arrives at local midnight.

## The first three days

| Day | Drink and place | Vessel and mark | Feel |
|---|---|---|---|
| 1 · Pub night | Guinness in a dark wood pub | Tulip pint · the G | Smooth pour, immediate stop |
| 2 · Beach day | Corona on a white sand beach | Clear bottle with lime · the crown | Fast through the neck, slower deterministic glugs through the body |
| 3 · Oktoberfest | Festbier at Oktoberfest | Liter stein · Bavarian crest | Slower, heavy pour with a short 0.24-second follow-through after release |

The vessel changes the flow, not just the artwork. The bottle's glug cadence is determined by elapsed sip time, and the stein settles before its final line is scored. After day 3, the game picks from eleven glasses by date and never pours the same glass two days running.

## Share your sip

“Share your sip” uses the native share sheet when it supports image files, or downloads a PNG. “Copy text” provides a compact group-chat result.

The 1080 × 1350 image keeps the day's palette, place, vessel, and mark. It shows your actual settled beer line, MARK and STOP guides, score out of 100, verdict, and a five-cell position strip. The strip is one stopping position from high to low, with a green center; an arrow shows a stop beyond its range. It is not a history of attempts. Text shares use the same one-row strip, the daily drink and title, and the game link. Both formats label practice and preview sips.

## Preview and add a day

Open `/design.html` to try the first three days together and see their sample image and text shares. The sample cards are illustrative preview results; no daily scores are saved there. Open `/#day1`, `/#day2`, or `/#day3` for an individual preview. The same `#dayN` format works for other day numbers. Preview scores never save to the daily record.

Every glass lives in `site/js/themes.js`, and the fields are described at the top of that file. Add an entry to `THEMES`, and put its `id` in `SCHEDULE` to pin it to a day. Run `npm test` to check that its mark can be reached, then preview that day. `LAUNCH` is the local date for day No. 1; move it to restart the planned run on a new date.

The extracted visual system is in [DESIGN.md](DESIGN.md), with component previews and extensions in `.impeccable/design.json`.

## Run it locally

```
npm start
```

This serves the game on http://localhost:8000 and the three-day review on http://localhost:8000/design.html. Hold mode works there. Phones require HTTPS for tilt, so try tilt on the live site.

```
npm test
```

The tests cover the schedule, score boundaries, reachable marks, vessel flow and settling across frame rates, and text-share semantics. There is nothing to install: the project has no dependencies. Fraunces and Karla are self-hosted in `site/fonts/`, with their OFL licenses alongside the font files.

## Deploy

Every push to `main` runs the tests on GitHub Actions. When they pass, `site/` is published to GitHub Pages.

## Layout

- `site/index.html` and `site/css/style.css`: the game page and shared styles
- `site/design.html`: the first-three-day review and sample shares
- `site/js/themes.js`: the glasses, palettes, and calendar
- `site/js/core.js`: the daily seed, vessel shapes, drink physics, and scoring, with no page code so tests run in Node
- `site/js/draw.js`: the places, vessels, printed names, and marks, drawn on a canvas
- `site/js/share.js`: the themed image card and plain-text result
- `site/js/main.js`: input, the tilt sensor, results, local daily records, and sharing
- `site/fonts/`: local fonts and license files
- `test/`: the tests
- `scripts/serve.js`: the local server

Split is not affiliated with any brewer or brand. The illustrations use simplified vessel shapes, brand names, and marks drawn on canvas.
