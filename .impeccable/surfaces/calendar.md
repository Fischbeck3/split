# The daily calendar

Mode: Operate

## Direction contract

THESIS: Make a scheduled NFL cup legible as an intentional game-day choice, with its matchup visible in the calendar and its selection reason one click away.

OWN-WORLD: Preserve the incumbent cream and evergreen planner, Fraunces headings, Karla support, open calendar grid, understated separators and existing status labels. No new artwork, typography, colors or system tokens.

STORY: Glance at the featured cup and opponent, select a date to see the reason, check its official source and verification date, or open an unsaved glass preview. Unassigned dates still say Theme needed / Unplanned. NFL flex changes are acknowledged; historic stadium paintings remain fan memories.

FIRST VIEWPORT: Keep today's glass, private analytics links and next seven days in their established positions. On NFL dates the matchup joins today's details and replaces the place subtitle in upcoming rows and month/week cells. The inspector keeps the painted place separate from the game context.

FORM: Ordinary extension of the current planner. Reuse its grid, week rows, inspector, inline link and body-note styles. No replacement composition or comp is needed.

FINISH: Verify November and December on desktop and mobile, the user's in-app size, keyboard day selection and inspector links. Complete independent finish review and documentation comparison before release.

## Authorization

The owner requested November and December assignments for relevant NFL matchups on October 24, 2026. The 31 reviewed standalone dates and all source evidence are recorded in `docs/content/nfl-calendar-2026.md` and its JSON companion. All October dates, scene/print hashes, original catalog order and fallback selection stay fixed. The remaining 30 dates are unplanned for later seasonal scheduling.

## Finish evidence

Calendar version 6 contains 31 explicit standalone NFL dates using 22 already approved cups. The remaining 30 November–December dates retain Theme needed / Unplanned. The October 9–31 assignments, existing campaigns, six automatic fallbacks, original catalog order, released challenge seeds, scenes and marks retain their prior meaning. `docs/content/nfl-calendar-2026.md` and its JSON companion record the owner-authorized selection review, official sources and October 24 fixture checks. Each selected date is standalone (`campaignId: none`); this release assigns no holiday campaign.

The source-to-system comparison checked `site/calendar.html`, `site/css/calendar.css`, `site/js/calendar.js`, `site/js/nfl-calendar.js`, `site/js/content-calendar.js` and `site/js/calendar-data.js` against PRODUCT.md and DESIGN.md. The extension retains the incumbent cream and evergreen palette, self-hosted Fraunces/Karla hierarchy, open calendar grid, ruled week rows, selected-day treatment, inspector and underlined actions. The added occasion block uses existing spacing values and body-note styles. Matchup text appears in month/week cells, upcoming rows and the daily glance; the inspector keeps the painted place separate from the game, then exposes its reason, official source, check date and flex/historic-venue note. Both subscription feeds carry the reviewed occasion as an all-day content date; gaps remain tentative.

Release validation reported 343 passing tests and a passing Pages build. The independent finish review inspected all six captures: [November desktop](../review/nfl-calendar/november-desktop.png), [November phone](../review/nfl-calendar/november-mobile.png), [November inspector](../review/nfl-calendar/november-desktop-detail.png), [December desktop](../review/nfl-calendar/december-desktop.png), [December phone](../review/nfl-calendar/december-mobile.png) and [December inspector](../review/nfl-calendar/december-mobile-detail.png). The desktop captures cover the user's in-app size. Its [review report](../review/nfl-calendar/finish-review.md) found no material visual defects and records readable phone weeks, keyboard focus and day selection, inspector links, the unchanged first viewport and honest unplanned gaps. Its persistence fix identified three outdated DESIGN.md scheduling statements. Those statements and directly related NFL prose now reflect the 31 assignments; the final verdict scored all three corrections resolved.

This documentation pass changes only DESIGN.md prose, this calendar evidence and the related NFL surface prose. DESIGN.md's YAML frontmatter retains SHA-256 `f97b23ab831c7ba34e10cda167ba6c2056d83bddbaa44eb9f40044e5ac8ee35d`; `.impeccable/design.json` retains SHA-256 `0e0b654d99436b95154aabe438ae26862b83535d8abf40917b3baf36526369ca`, matching [the before record](../review/nfl-calendar/design-before.json). No artwork, token, UI, data or detector-ignore change is introduced by this pass. The [detector findings](../review/nfl-calendar/detect.json) concern incumbent palette, type and radius declarations; prior sidecar drift remains unmodified and is not adopted as a rule for new surfaces.

The final reviewer verdict pass scored all three requested DESIGN.md corrections resolved and returned `disposition: ship`. The original rendered review found no material visual defects; the verdict pass covers only those persistence fixes.
