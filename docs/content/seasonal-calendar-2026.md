# November–December seasonal gap release

On November 6, 2026, the owner requested that the calendar gaps be filled. This release selects 26 already built seasonal glasses around the 31 previously reviewed NFL assignments. It adds the exact scene-artwork approvals for 19 selected gallery previews and separately reviews four campaigns. It creates no new artwork or implicit automatic rotation.

## Date boundary and existing challenges

The review time is 2026-11-06T21:05:35.000Z. The publishing guard's UTC+14 boundary is November 7: those challenges can already have been served in the earliest player time zones. November 3, 4, 6 and 7 retain their unplanned fallback dates. They are not retrospectively labeled scheduled. All 54 dates from November 8 through December 31 now have explicit assignments; November 8–9 already have NFL cups, so the first new pin is November 10.

All original October pins, 31 NFL entries and their occasion metadata, three prior campaign records, six fallback choices, original 115 review positions, and served daily parameters through November 7 are preserved. No Chicago St. Patrick's Day scene is selected. The pre-release plan and served-pour snapshots are retained in test/fixtures/calendar-before-seasonal-fill.json.

## Content and campaign review

Each selected scene and actual foreground glass was inspected in a local contact sheet using the shipping seasonal gallery renderer. All 26 selected sample postcards rendered and exported to PNG without scene warnings. The seven autumn choices reuse their existing content approvals. The 19 newly selected winter, Thanksgiving, Hanukkah and Christmas settings receive exact SHA-256 scene approvals in site/js/content-readiness.js. Unselected gallery previews remain unapproved for scheduling.

Four disjoint campaign spans each approve only their listed selected themes: November autumn evenings (November 10–20), Thanksgiving gatherings (November 21–28), December lights (December 1–11), and Christmas gatherings (December 12–30). Their exact membership lives in CAMPAIGN_READINESS, independently of the theme approvals. Standalone NFL assignments within these spans retain campaignId none, including in the day inspector and analytics attribution.

These are selected dates around the games, not uninterrupted holiday lineups. December lights combines winter scenes, a market and two specific Hanukkah gatherings; it does not claim to supply eight Hanukkah nights. Christmas gatherings also includes the existing London and New York winter variations. Christmas Eve, Christmas Day and New Year's Eve keep their NFL cups.

## Intentional occasions

- Thanksgiving is Thursday, November 26, per the [OPM 2026 calendar](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/). Friendsgiving falls on Saturday November 21, the homecoming pint on November 24, and the after-dinner fire on November 28. The November 25–27 NFL selections remain fixed.
- [Hebcal's 2026 Hanukkah calendar](https://www.hebcal.com/holidays/chanukah-2026) starts the holiday on December 4 and ends it December 12. The one-light window painting is assigned December 4 and the eight-light bakery painting December 11, matching the first and final candle-lighting dates. These are all-day content dates, not lighting times. The fourth-night dreidel painting stays unscheduled because December 7 has an existing NFL cup.
- The [Mexican Secretariat of Culture's Posadas entry](https://sic.cultura.gob.mx/ficha.php?table=festividad&table_id=115) places the season December 16–24. The Modelo courtyard opens that season on December 16.
- The Scottish Christmas train falls on December 26 as an illustrated journey home. Other pub, café and market dates are seasonal settings, not claims of a particular ticketed event or local opening schedule.

Guinness dates, including the existing November 7 fallback, are 2026-11-07, 2026-11-10, 2026-11-14, 2026-11-17, 2026-11-20, 2026-11-24, 2026-11-28, 2026-12-01, 2026-12-04, 2026-12-08, 2026-12-12, 2026-12-15, 2026-12-18, 2026-12-22, 2026-12-26, 2026-12-29. Every interval is three or four days; the fixed NFL dates account for the four-day gaps.

## New published selections

| Date | Drink and setting | Theme ID | Reviewed run |
| --- | --- | --- | --- |
| 2026-11-10 | Guinness · Dublin afternoon | autumn-guinness-dublin | November autumn evenings |
| 2026-11-11 | Stella Artois · Brussels café | autumn-stella-brussels | November autumn evenings |
| 2026-11-13 | Pilsner Urquell · Prague beer cellar | autumn-pilsner-prague | November autumn evenings |
| 2026-11-14 | Guinness · Edinburgh fireside | autumn-guinness-edinburgh | November autumn evenings |
| 2026-11-17 | Guinness · London rain | autumn-guinness-london | November autumn evenings |
| 2026-11-18 | Carlsberg · Copenhagen harbor | autumn-carlsberg-copenhagen | November autumn evenings |
| 2026-11-20 | Guinness · Old Irish pub | autumn-pub | November autumn evenings |
| 2026-11-21 | Harvest amber ale · Friendsgiving | thanksgiving-friendsgiving | Thanksgiving gatherings |
| 2026-11-24 | Guinness · Homecoming pub | thanksgiving-homecoming | Thanksgiving gatherings |
| 2026-11-28 | Guinness · After-dinner fire | thanksgiving-fireside | Thanksgiving gatherings |
| 2026-12-01 | Guinness · Dublin Christmas gathering | winter-guinness-dublin | December lights |
| 2026-12-02 | Heineken · Amsterdam snowy canals | winter-heineken-amsterdam | December lights |
| 2026-12-04 | Guinness · Window lights | hanukkah-window-lights | December lights |
| 2026-12-05 | Pilsner Urquell · Prague Christmas cellar | winter-pilsner-prague | December lights |
| 2026-12-08 | Guinness · Edinburgh winter hearth | winter-guinness-edinburgh | December lights |
| 2026-12-09 | Pilsner Urquell · Vienna market | christmas-pilsner-vienna-market | December lights |
| 2026-12-11 | Bakery amber ale · Bakery gathering | hanukkah-bakery | December lights |
| 2026-12-12 | Guinness · Christmas at home | christmas-guinness-home-tree | Christmas gatherings |
| 2026-12-15 | Guinness · Dublin snug | christmas-guinness-dublin-snug | Christmas gatherings |
| 2026-12-16 | Modelo Especial · Posada courtyard | christmas-modelo-posada | Christmas gatherings |
| 2026-12-18 | Guinness · London supper | christmas-guinness-london-supper | Christmas gatherings |
| 2026-12-22 | Guinness · London winter lights | winter-guinness-london | Christmas gatherings |
| 2026-12-23 | Stella Artois · Paris Christmas café | christmas-stella-paris-cafe | Christmas gatherings |
| 2026-12-26 | Guinness · Christmas train | christmas-guinness-edinburgh-train | Christmas gatherings |
| 2026-12-29 | Guinness · New York Christmas evening | winter-guinness-new-york | Christmas gatherings |
| 2026-12-30 | Miller High Life · Record night | christmas-high-life-record-night | Christmas gatherings |

## Release checks

Promote all 26 proposals through prepareCalendarChange against the v6 baseline, with new campaign records arriving as drafts. Validate v7 against the old plan, verify every content hash and matching NFL logo, official date playability, reachable targets and selected campaign attribution, preserve served pours and NFL entries, and confirm new dates in both subscription feeds. Review the month grid and representative holiday day details before releasing through the existing GitHub Pages workflow.
