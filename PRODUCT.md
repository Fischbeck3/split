# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Friends sharing a short daily beer-sipping challenge and comparing their results. The user has chosen travel, nostalgia, memorable beer brands, and the company of friends as the content direction.

## Product Purpose

Split offers one daily glass, four sips, and an average score that can be shared with a friend. Challenges before November 2, 2026 retain three sips. Each illustrated setting recalls a place and an occasion for sharing a beer.

## Operating Context

The game runs in a browser and saves daily progress locally. The player holds to drink and releases to settle the liquid at the glass's mark. Completed rounds produce shareable text and a matching postcard. Unsaved previews let new themes be reviewed before publication.

## Capabilities and Constraints

Challenges dated November 2, 2026 onward use four stages of the same daily glass: Sober, Tipsy, Drunk, and Blackout. Earlier dates retain the released three-stage rules. The rounded mean of every stage becomes the daily result; the best real sip supplies the postcard's stopping line. Text shares and postcards support both three- and four-sip rounds. The launch calendar, released challenge seeds, historical scores, and date-specific shares must retain their meaning. New theme designs require review before they enter the published lineup.

Blackout combines a deterministic erratic pour with defocus, double vision, and glimpses separated by darkness. Its effects apply only to the game canvas; controls remain sharp, and the settled result returns to a clear view. The separate `/blackout.html` practice preview remains unsaved and sends no analytics. Shared effects keep its Blackout behavior aligned with the daily stage.

The owner authorized deployment and a daily-usage reset with the Blackout release. On a browser's first updated visit on or after November 2, legacy history is copied into an isolated release store, the local today's previous record is backed up and removed from that copy, and the original store remains intact. Other dates are preserved. Old tabs remain isolated on the old key, and subsequent visits do not reset the new store again.

The existing static HTML, CSS, and JavaScript implementation owns the game and its vessel geometry. Scene artwork supplies the environment; the glass, liquid, mark, scoring, and sip motion are rendered live. Play and postcard use the same setting and vessel.

## Brand Commitments

Preserve Split's existing identity and illustrated travel style. The approved expansion contains five Guinness settings with the same recognizable pint and G, plus ten other beer memories. Chicago's Guinness setting is St. Patrick's Day. The other approved pairings are Amsterdam/Heineken, Prague/Pilsner Urquell, Brussels/Stella Artois, Copenhagen/Carlsberg, Barcelona/Estrella Damm, Mexico City/Modelo Especial in a clear bottle, Boston/Samuel Adams at a ballgame in a plastic cup, Milwaukee/Miller High Life in a brown long-neck bottle, Colorado après-ski/Coors Banquet in a frosty nonic pint on a lodge deck, and High Sierras camping/Sierra Nevada Pale Ale in a brown short-neck bottle.

The Halloween extension adds seven places in proposed October 25–31 order: a pumpkin porch, ghost stories, a witching hour, Raven's Rest haunted Irish pub, a vampire's toast, a midnight carnival, and last orders in a crypt beer garden. Five distinct seasonal glasses use pumpkin, ghost, cauldron, bat, and skull marks; two settings retain the recognizable Guinness pint and G. The review gallery extends the incumbent identity with dark plum and pumpkin amber. All seven belong in the unsaved `#admin` catalog. Their proposed dates do not publish them into the daily calendar.

The autumn extension adds fifteen slight variations of existing non-holiday beer memories. Five Guinness scenes use the original Irish pub, Dublin, London, Edinburgh, and New York; the ten other travel beers retain their existing vessels and familiar brand prints. Weather, foliage, lighting, and clothing supply the seasonal change. Colorado becomes a late-autumn lodge deck after the first snow, and High Sierras camping gains golden aspens. Chicago's St. Patrick's Day scene remains separate. The autumn contact sheet and unsaved `#admin` previews bring the review catalog to 43 glasses. The subsequent winter request adds fifteen Christmas and winter variations for review, without creating automatic tasks or calendar dates.

The Christmas/winter extension uses the same fifteen bases as autumn, with five Guinness views and ten other memorable beers. Christmas greenery and lights, rainy winter windows, snowy canals and rooftops, a quiet off-season Boston ballpark, deep winter après-ski, and a snowy Sierra camp make the settings distinct. Barcelona and Mexico City have festive local December scenes without snow. Original foreground beers, glass shapes, brand prints, materials, scoring marks, and sip behavior remain inherited. Seasonal memory captions reflect the new setting. All fifteen belong in the unsaved `#admin` review catalog, bringing it to 58 glasses, and in the matching winter contact sheet. No public daily dates are assigned by this request.

## Evidence on Hand

README.md documents the game and the current local build. DESIGN.md records the incumbent identity and scene/vessel rules. site/js/themes.js contains the existing drinks; site/js/theme-expansion.js, site/js/halloween-themes.js, site/js/autumn-themes.js, site/js/winter-themes.js, site/js/holiday-themes.js, site/js/christmas-themes.js, site/js/nfl-themes.js, and site/js/december-themes.js contain the seasonal, travel, and team review choices. The approved December board, implementation record in docs/content/december-2026.md, and finish evidence in .impeccable/review/december/ establish the all-December extension. site/assets/scenes and site/assets/concepts contain the developed illustration assets. The user approved the fifteen-theme lineup, Chicago's holiday setting, and the two outdoor beer memories, then requested all seven Halloween concepts in `#admin` to review while away from the computer. The user subsequently requested fifteen slight autumn variations, then fifteen Christmas/winter variations of current themes and their publication to `#admin` for review.

## Product Principles

- Keep the vessel and scoring mark legible in Sober, Tipsy, and Drunk. Blackout intentionally obscures the canvas during drinking and settling, then restores a clear result.
- Make each place recognizable through the beer, viewpoint, materials, light, and company.
- Preserve historical results and shared challenges; retain a backup when applying the explicitly authorized Blackout daily reset.
- Review new scenes and their matching postcards before publication.

## Accessibility & Inclusion

Preserve the existing keyboard controls, readable contrast, and responsive phone layout. Reduced Motion removes Blackout's echoes, blur, light pulses, and movement; it uses static darkness during drinking and settling with the same physics and scoring. This describes the implemented effect treatment, not formal flash-standard compliance.


The holiday-week collection contains seven new Thanksgiving themes and three new Hanukkah themes. Thanksgiving spans homecoming, Friendsgiving, harvest porch, football afternoon, candlelit wishbone toast, pie kitchen, and after-dinner fire. Two use Guinness and five use distinct seasonal glass prints. Hanukkah has its own window-light, dreidel-night and bakery settings and traditions.

The earlier Christmas fortnight request covered fourteen entirely new Christmas scenes plus the three finished Hanukkah scenes, for seventeen December reviews. Four Guinness settings and ten familiar beer brands move into new domestic, city, travel and mountain Christmas gatherings. The Christmas fortnight presents two seven-scene weeks, then the separate Hanukkah section. Fourteen sibling assets and new IDs bring the total admin review catalog to 82; the fifteen previously saved winter variations and all other shipped themes stay available. New painted places have empty foregrounds, live branded glasses, exact generation provenance and measured table anchors. That earlier request created no daily dates, scheduling jobs or automatic tasks. Its original gallery entries retain their foregrounds; the later December request below supplies separate festive cup entries and date assignments.


## December Holiday Collection

On November 6, 2026 the user requested Christmas lights, decorated trees, and festive cups throughout December, then approved the six-scene board with “build em!”. The implemented collection contains 31 distinct holiday settings: six new paintings and 25 separate December entries reusing existing Christmas and winter paintings. All 31 use one of six festive live cup designs: holly Guinness, fir market mug, Fair Isle pint, candy-striped party cup, poinsettia tumbler, or gold-confetti chalice. A holiday football gathering remains part of this collection.

Calendar version 7 assigns all 31 December dates and supersedes the prior 15 December NFL assignments. October and November assignments, released pours, historical scores, and the six automatic fallback glasses retain their meaning. The 31 entries append to the prior 115 review positions for 146 total; the calendar offers 87 reviewed choices. Original winter, Christmas, Thanksgiving, Hanukkah, and NFL reviews retain their original foregrounds. The historical NFL date-selection record remains available, while the replacement December entries carry no obsolete matchup claims.

[The December gallery](site/december.html) leads with six new designs, followed by the remaining dates. Every glass opens an unsaved review and a matching sample postcard. Festive printing belongs to the moving transparent vessel, with a clear band around the scoring mark; it cannot alter the pour, target, or score. December follows the existing four-sip round and average, including Blackout, and retains the established controls and reduced-motion treatment.
