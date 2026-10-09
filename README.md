# Split

Hold your phone like a pint. Tilt it back to drink. Come back upright to stop, with the line through the middle of the mark. One sip a day, the same glass for everyone, and a card for the group chat.

**Play:** https://fischbeck3.github.io/split/

![Three glasses: a stout in a pub, a lager bottle on a beach, a stein in Munich](site/og.png)

## How it plays

- **Tilt.** On a phone, tap "Start · tilt to drink". Tip the phone either way from upright and the drink goes down. The further you tip, the faster it goes. Come back within 15 degrees of upright to stop. iPhones ask for motion access once.
- **Hold.** Anywhere else, press and hold the glass to drink and let go to stop. The space bar works on a keyboard.
- **The line.** What counts is the bottom of the head, where the foam meets the drink. Within 6% of the mark's height is a perfect split and within 16% is a split. The score is 100 at dead center and falls off quickly from there.
- **One a day.** The first sip each day goes in the book. After that you can practice. A new glass arrives at local midnight.

## The first three days

| Day | Title | Glass | Place | Mark | Feel |
|---|---|---|---|---|---|
| 1 | Pub night | Stout in a tulip pint | Dark wood pub | G | Calm pour, normal speed |
| 2 | Beach day | Lager bottle with lime | Beach | Crown on the label | Neck drains fast, body slow, breeze wobble |
| 3 | Oktoberfest | Liter stein | Munich | Blue and white crest | Thick foam, drinks slower |

After day 3 the game picks from eleven glasses by date and never pours the same glass two days running.

## Add a day

Every glass lives in `site/js/themes.js`, and the fields are described at the top of that file. Add an entry to `THEMES`, and put its `id` in `SCHEDULE` to pin it to a day. Run `npm test` to check that its mark can be reached. Then preview any day by adding `#day4`, or any day number, to the address. Previews never save a score.

`LAUNCH` in the same file is day No. 1. Move it to restart the planned run on a new date.

## Run it locally

```
npm start
```

This serves the game on http://localhost:8000. Hold mode works there. Phones only allow tilt over HTTPS, so try tilt on the live site.

```
npm test
```

This checks the schedule, the scoring, and that every day's mark sits where a real sip can reach it. There is nothing to install: the project has no dependencies.

## Deploy

Every push to `main` runs the tests on GitHub Actions. When they pass, `site/` is published to GitHub Pages.

## Layout

- `site/index.html` and `site/css/style.css`: the page
- `site/js/themes.js`: the glasses and the calendar
- `site/js/core.js`: the daily seed, vessel shapes, drink speed and scoring, with no page code so the tests run in Node
- `site/js/draw.js`: the places, vessels and marks, drawn on a canvas
- `site/js/main.js`: input, the tilt sensor, results and sharing
- `test/`: the tests
- `scripts/serve.js`: the local server

Split is not affiliated with any brewer or brand. The glasses use generic shapes, colors and marks.
