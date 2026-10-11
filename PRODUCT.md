# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Friends sharing a short daily beer-sipping challenge and comparing their results. The user has chosen travel, nostalgia, memorable beer brands, and the company of friends as the content direction.

## Product Purpose

Split offers one daily glass, three sips, and an average score that can be shared with a friend. Each illustrated setting recalls a place and an occasion for sharing a beer.

## Operating Context

The game runs in a browser and saves daily progress locally. The player holds to drink and releases to settle the liquid at the glass's mark. Completed rounds produce shareable text and a matching postcard. Unsaved previews let new themes be reviewed before publication.

## Capabilities and Constraints

Three stages use the same daily glass: Sober, Tipsy, and Drunk. The rounded mean becomes the daily result; the best real sip supplies the postcard's stopping line. The launch calendar, released challenge seeds, existing saved scores, and date-specific shares must retain their meaning. New theme designs require review before they enter the published lineup.

The existing static HTML, CSS, and JavaScript implementation owns the game and its vessel geometry. Scene artwork supplies the environment; the glass, liquid, mark, scoring, and sip motion are rendered live. Play and postcard use the same setting and vessel.

## Brand Commitments

Preserve Split's existing identity and illustrated travel style. The approved expansion contains five Guinness settings with the same recognizable pint and G, plus ten other beer memories. Chicago's Guinness setting is St. Patrick's Day. The other approved pairings are Amsterdam/Heineken, Prague/Pilsner Urquell, Brussels/Stella Artois, Copenhagen/Carlsberg, Barcelona/Estrella Damm, Mexico City/Modelo Especial in a clear bottle, Boston/Samuel Adams at a ballgame in a plastic cup, Milwaukee/Miller High Life in a brown long-neck bottle, Colorado après-ski/Coors Banquet in a frosty nonic pint on a lodge deck, and High Sierras camping/Sierra Nevada Pale Ale in a brown short-neck bottle.

The Halloween extension adds seven places in proposed October 25–31 order: a pumpkin porch, ghost stories, a witching hour, Raven's Rest haunted Irish pub, a vampire's toast, a midnight carnival, and last orders in a crypt beer garden. Five distinct seasonal glasses use pumpkin, ghost, cauldron, bat, and skull marks; two settings retain the recognizable Guinness pint and G. The review gallery extends the incumbent identity with dark plum and pumpkin amber. All seven belong in the unsaved `#admin` catalog, bringing it to 28 glasses. Their proposed dates do not publish them into the daily calendar.

## Evidence on Hand

README.md documents the shipped game. DESIGN.md records the incumbent identity and scene/vessel rules. site/js/themes.js contains the existing drinks; site/js/theme-expansion.js and site/js/halloween-themes.js contain the isolated previews. site/assets/scenes and site/assets/concepts contain the developed illustration assets. The user approved the fifteen-theme lineup, Chicago's holiday setting, and the two outdoor beer memories, then requested all seven Halloween concepts in `#admin` to review while away from the computer.

## Product Principles

- Keep the vessel and scoring mark legible throughout the sip.
- Make each place recognizable through the beer, viewpoint, materials, light, and company.
- Preserve an existing player's results and shared challenge.
- Review new scenes and their matching postcards before publication.

## Accessibility & Inclusion

Preserve the existing keyboard controls, readable contrast, responsive phone layout, and reduced-motion behavior.
