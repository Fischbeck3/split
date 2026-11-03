# Blackout daily stage and practice preview

Mode: Experience

## Purpose

Add Blackout as the fourth daily stage for challenge dates from `2026-11-02`, following the owner's explicit deployment and daily-reset request. Earlier challenges keep their released three stages. The direction combines stronger defocus, erratic pouring, alternating darkness/light glimpses, and double vision, informed by the user's multi-exposure image reference. Preserve Split's existing vessels, painted places, Fraunces/Karla hierarchy, palettes, and hold interaction. No new design-system tokens are introduced.

## Behavior

- Daily rounds use Sober, Tipsy, Drunk, then Blackout with the same glass, target, and fresh starting level. All four scores contribute equally to the rounded average. The first three stages are unchanged; dates before the cutoff retain three-sip results.
- Blackout's deterministic surges and hesitations vary flow from 0.30 to 1.70 times the base rate, integrated at 1/240-second sip-time boundaries.
- The main image gains three ready-state or four active offset echoes, including cool-tinted copies, with bounded shifting blur and drift. Ready stays visible with lighter echoes. Drinking and settling alternate darkness with eased glimpses lasting about 0.9–1.15 seconds, separated by black intervals of at least 0.65 seconds. The unequal pattern repeats over 5.25 seconds and introduces no white flashes. The result restores a clear, single view.
- Pointer hold, space bar, and Enter on the focused drink button remain available. Controls and status stay sharp outside the canvas. Reduced Motion removes echoes, blur, light pulses, and movement, using static darkness through drinking and settling with the same Blackout physics.
- Text shares and postcards include all three or four actual stage scores and the rounded average. The best real sip supplies the stopping line; older single-sip shares retain their meaning.

## Release and storage

`ROUND_STAGES` includes Blackout; `roundCount` gates it by challenge date. `site/js/blackout-effects.js` supplies shared physics and view timing, and `site/js/blackout-view.js` composites the images for daily play and practice.

`site/js/record-store.js` copies legacy history into the release key ending in `:blackout-2026-11-02`. On the first updated visit on or after the cutoff, it backs up that browser's local today's previous entry in `blackoutRelease.previous` and removes only that entry from the copy. The original store and other dates remain intact. Old tabs write only the old key; once the new store exists, future visits do not reset it again. The fixed launch date, `RECORD_RUN`, calendar, challenge seeds, and preferences are preserved.

## Practice preview

`/blackout.html` remains an isolated, unsaved surface with six existing glass choices, independent stage selection, and “Try all four in order.” It shares the production Blackout effects but does not write records or initialize analytics. At heights up to 650px, its layout extends 100px beyond the viewport so the resting glass and Hold remain visible together while secondary controls scroll below the fold. This preview layout is not a new global rule.

## Evidence and design comparison

Production captures: [desktop](../review/release-desktop.png), [mobile](../review/release-mobile.png), [Blackout stage](../review/release-blackout.png), and [four-sip result](../review/release-result.png). Browser QA completed all four sips and confirmed the correct four-sip result and visible postcard. Implementation validation passed 355 tests and `npm run build -- 5c21883`; this documentation pass did not rerun them.

Earlier practice evidence remains in [desktop](../review/desktop.png), [mobile](../review/mobile.png), [short phone](../review/phone-320.png), [trails](../review/blackout-trails.png), [dark interval](../review/blackout-dark.png), [glimpse](../review/blackout-glimpse.png), and [clear result](../review/blackout-result.png). The old `blackout-settling.png` and `four-sip-result.png` belong to the superseded first concept.

The extension retains the incumbent wordmark, serif headings, plain labels, rounded control trays, theme accents, and foreground focus outlines. Obscured vision is specific to the authorized Blackout stage; the timing above is not a formal flash-standard compliance claim. PRODUCT.md now records the release behavior. DESIGN.md and `.impeccable/design.json` remain unchanged, with no token or component-system expansion.

Drift reported without repair: DESIGN.md still describes a three-stage daily round and a consistently unobscured vessel; its Overview also says the highest score supplies the result, while its later guidance describes an average. The date-gated fourth stage, its canvas effects, and four-score sharing are documented here rather than silently rewriting that incumbent system.
