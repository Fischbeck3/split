# October 2026 content release

On October 11, the owner requested the newly minted autumn scenes for the rest of October, all seven Halloween scenes for the calendar week containing Halloween, Guinness roughly every three days, and no Chicago St. Patrick's Day scene. This request authorizes the selected built themes and the two runs below. It does not approve every glass in the review gallery.

The October 9–14 opening assignments stay fixed. New assignments begin October 15, after the globally live date. November remains unplanned. `CALENDAR_THEME_IDS` adds the selected choices to planning; `ROTATION_IDS` retains the existing automatic fallback choices.

## Autumn rounds

October 15–24 uses fall foliage, rain, warm pub interiors, and café evenings. The Sierra camp belongs on Saturday; Edinburgh's fireside pint closes the following Saturday. These are seasonal settings rather than claims that a local festival or sporting event occurs on that date. Fenway, après-ski, and Chicago St. Patrick's Day are not included.

| Date | Theme | Scene ID |
|---|---|---|
| October 15 | Guinness · Dublin afternoon | autumn-guinness-dublin |
| October 16 | Pilsner Urquell · Prague beer cellar | autumn-pilsner-prague |
| October 17 | Sierra Nevada Pale Ale · High Sierras camp | autumn-sierra-high-sierras |
| October 18 | Guinness · Old Irish pub | autumn-pub |
| October 19 | Heineken · Amsterdam canals | autumn-heineken-amsterdam |
| October 20 | Stella Artois · Brussels café | autumn-stella-brussels |
| October 21 | Guinness · London rain | autumn-guinness-london |
| October 22 | Carlsberg · Copenhagen harbor | autumn-carlsberg-copenhagen |
| October 23 | Estrella Damm · Barcelona tapas | autumn-estrella-barcelona |
| October 24 | Guinness · Edinburgh fireside | autumn-guinness-edinburgh |

## Halloween week

October 25–31 is the Sunday–Saturday calendar week containing Halloween. The gallery's seven-night sequence progresses from a pumpkin porch through stories and fantasy settings to the final Guinness by the crypt on Halloween itself.

| Date | Theme | Scene ID |
|---|---|---|
| October 25 | Pumpkin ale · Pumpkin porch | halloween-pumpkin-porch |
| October 26 | Wheat beer · Ghost stories | halloween-ghost-stories |
| October 27 | Witch's brew · Witching hour | halloween-witching-hour |
| October 28 | Guinness · Raven's Rest | halloween-ravens-rest |
| October 29 | Red ale · Vampire's toast | halloween-vampires-toast |
| October 30 | Midnight brew · Midnight carnival | halloween-midnight-carnival |
| October 31 | Guinness · Last orders | halloween-last-orders |

Guinness falls on October 15, 18, 21, 24, 28, and 31. The four-day gap entering Halloween keeps all seven distinct Halloween scenes in the established order; every other new interval is three days.

## Built-content evidence

The scenes and vessels were already shipped in the autumn and Halloween galleries at base revision `650596b4045ad364ec7f00e1e83872d9766102cd`. The actual paintings and live-rendered glasses were checked against those galleries. Each selected scene has a separate SHA-256 approval in `site/js/content-readiness.js`, using the renderer's real WebP asset. The campaigns have separate approvals listing only their selected themes.

The autumn and Halloween rendering tests cover vessel geometry, reachable marks, original Guinness foreground and physics, table placement at phone and postcard sizes, and decoded scene/brand assets. Calendar release checks verify the selected scene, its artwork hash, each exact date's playable pour and share metadata, confirmed subscription entries through October 31, and unplanned fallbacks after the run. The game, calendar, and subscription feeds all resolve the same explicit date pins. Review links remain unsaved even when their theme has a scheduled date.
