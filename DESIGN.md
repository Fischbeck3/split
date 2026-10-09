---
name: Split
description: One glass. One sip. A new place every day.
colors:
  pub-background: "#101b17"
  pub-ink: "#eee7d6"
  pub-muted: "#aaa797"
  pub-sheet: "#1d2a23"
  pub-line: "#3c4a40"
  pub-accent: "#d9b874"
  pub-accent-ink: "#17221b"
  rome-background: "#efe8d9"
  rome-ink: "#23483b"
  rome-muted: "#547162"
  rome-sheet: "#fffaf0"
  rome-line: "#bfc8b5"
  rome-accent: "#285c44"
  rome-accent-ink: "#fff8e8"
  tokyo-background: "#14221f"
  tokyo-ink: "#f2ead7"
  tokyo-muted: "#b4bcae"
  tokyo-sheet: "#20332b"
  tokyo-line: "#4a5b4e"
  tokyo-accent: "#dcb66b"
  tokyo-accent-ink: "#18251d"
  hogsmeade-background: "#25201b"
  hogsmeade-ink: "#f6ebd5"
  hogsmeade-muted: "#c5b49d"
  hogsmeade-sheet: "#342c23"
  hogsmeade-line: "#685642"
  hogsmeade-accent: "#e5bb71"
  hogsmeade-accent-ink: "#302218"
  beach-background: "#f6f0e3"
  beach-ink: "#153e4d"
  beach-muted: "#556c73"
  beach-sheet: "#fffaf0"
  beach-line: "#d7e0d8"
  beach-accent: "#18777d"
  fest-background: "#f0f5f7"
  fest-ink: "#233c56"
  fest-muted: "#5a7083"
  fest-sheet: "#ffffff"
  fest-line: "#ccdce6"
  fest-accent: "#c49433"
  fest-accent-ink: "#23344a"
  dark-good: "#91dda8"
  dark-miss: "#ffaaa0"
  light-good: "#267347"
  light-warn: "#936210"
  light-miss: "#b64037"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(34px, 8vw, 43px)"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "-.03em"
  wordmark:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "36px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-.035em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-.025em"
  body:
    fontFamily: "Karla, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  support:
    fontFamily: "Karla, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "Karla, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
  button:
    fontFamily: "Karla, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  score:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-.035em"
rounded:
  card: "6px"
  control: "8px"
  control-tray: "16px"
  preview-frame: "10px"
spacing:
  compact: "8px"
  small: "12px"
  control-top: "16px"
  button-inline: "20px"
  heading-inline: "24px"
  mobile-inline: "26px"
  desktop-hud: "32px"
  desktop-inline: "36px"
components:
  wordmark:
    textColor: "{colors.pub-ink}"
    typography: "{typography.wordmark}"
  button-primary:
    backgroundColor: "{colors.pub-accent}"
    textColor: "{colors.pub-accent-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "54px"
  button-text:
    textColor: "{colors.pub-ink}"
    padding: "6px 8px"
    height: "38px"
  button-outline:
    textColor: "{colors.pub-ink}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
    height: "54px"
  drink-control:
    backgroundColor: "{colors.pub-accent}"
    textColor: "{colors.pub-accent-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "56px"
    width: "100%"
  preview-nav:
    backgroundColor: "{colors.pub-sheet}"
    textColor: "{colors.pub-muted}"
    typography: "{typography.label}"
    height: "32px"
  goal-row:
    textColor: "{colors.pub-ink}"
    typography: "{typography.title}"
  result-score:
    textColor: "{colors.pub-ink}"
    typography: "{typography.score}"
---
# Design System: Split

## Overview

**Creative North Star: "One sip. A place you remember."**

Split pairs a familiar drink with the memory of sharing it with friends. The oversized canvas vessel sits in a painted place. The opening three travel from an old Irish pub to a Roman café table and a Tokyo izakaya. The interface gives each glass a short destination, one clear target, and an easy way to start. A visible lift, tip, and return make the sip legible before its settled line supplies the score. The incumbent Fraunces and Karla pairing, Split wordmark, and illustrated glass remain the common identity across days.

The pub carries aged oak, a fireplace, and amber light; Rome carries warm stone and café tables at sunset; Tokyo carries rain-lit lanterns and a little wooden counter. Later days visit Munich's timber roof ribs and communal tables, snowy Hogsmeade's warm shop windows, and Cabo's palapa shade and turquoise water. Small distant figures suggest company while leaving the central glass clear. The same place travels into a paper postcard with a destination title, the actual stopping line, and an invitation for a friend to take a turn.

The scenery is illustrative travel art, not a photograph or a claim about a specific venue. Self-hosted compressed scene assets provide the atmosphere; the vessel, liquid, marks, and feedback remain live canvas geometry. A table anchor keeps the place consistent across screen sizes and exports, and the original vector backdrop remains available if an asset fails to load.

**Key Characteristics:**

- A large, unobscured vessel is the focal point.
- The place changes the palette, painted backdrop, vessel, and postcard together.
- Heavy serif titles pair with plain, compact instructions.
- A visible lift and tip explain the sip; a single settled stopping position carries the result.
- The postcard carries the destination and a social invitation into the group chat.
- Date-specific shares preserve the same glass; archive and preview states clearly explain whether a sip is saved.

## Colors

The six scheduled themes share semantic roles while changing the atmosphere. The frontmatter records the implemented values from `site/js/themes.js` and the light/dark result colors in `site/js/main.js`; illustration-only gradients and details remain in `site/js/draw.js` and `site/js/share.js`.

### Primary

- **Pub gold** (`pub-accent`): the start/hold/share control. Deep green ink keeps the gold surface readable; the exported pub postcard uses warm cream paper with the same dark ink.
- **Roman green** (`rome-accent`): the café control, paired with cream ink on a light paper surface.
- **Lantern gold** (`tokyo-accent`): the izakaya control, paired with deep green ink.
- **Butterbeer honey** (`hogsmeade-accent`): the snowy-village control, paired with dark brown ink.
- **Sea teal** (`beach-accent`): the beach control, paired with cream ink.
- **Festival gold** (`fest-accent`): the stein control, paired with deep blue ink.

### Neutral

- **Pub green and cream**: dark background and sheet, warm foreground, subdued supporting copy, and restrained green separators.
- **Roman paper and green**: warm paper background, cream sheet, deep green foreground, and muted green support.
- **Tokyo green and gold**: dark green background and sheet, cream foreground, and subdued green support.
- **Hogsmeade walnut and cream**: brown background and sheet, cream foreground, and warm supporting copy.
- **Sand and sea ink**: pale sand background, cream sheet, deep blue foreground, slate supporting copy, and a quiet pale separator.
- **Festival paper and blue**: cool near-white background, white sheet, deep blue foreground, slate supporting copy, and pale blue separators.

### Feedback

Good, warning, and miss colors change with the light or dark theme. The dark warning uses pub gold. These colors communicate verdicts; they do not change the accuracy calculation or turn the positional strip into an attempt grid.

**The Same Place Rule.** The game and its exported postcard use the same daily scene, vessel, mark, and settled liquid level. Keep the destination and palette coherent.

**The Readable State Rule.** Use foreground ink for focus outlines and active preview labels. Accent color may underline a selection; it does not replace readable text.

## Typography

**Display Font:** Fraunces, with Georgia and serif fallbacks. The canvas additionally lists Playfair Display before Georgia as an existing fallback.

**Body Font:** Karla, with Helvetica Neue, Arial, and sans-serif fallbacks.

The heavy serif gives the wordmark and score a familiar pub-sign character; Karla keeps the few instructions and controls direct. The shipped files self-host Fraunces (900) and Karla (400, 600, 700), with OFL license files in `site/fonts/`. No remote font service is required.

### Hierarchy

- **Display:** the day title uses the frontmatter display role and balanced wrapping. Viewports up to 740px tall reduce it to 30px; up to 650px tall use 26px and hide the memory cue.
- **Wordmark:** the tight, heavy `Split.` wordmark anchors the top-left corner; it reduces to 30px on a short viewport.
- **Title:** the goal uses the title role; live goals, result verdicts, and review-page headings have nearby observed sizes (24px, 28px, and 26px).
- **Body and support:** the body role is the base; instructions and day descriptions use the support scale, with muted ink where appropriate.
- **Label:** mode, vessel feel, preview navigation, practice status, and daily note stay compact. Day numbers and scores use tabular numerals where the DOM renders them.
- **Score:** the result score uses the score role. The exported card scales Fraunces up within its fixed canvas rather than changing the font identity.

**The One Identity Rule.** Keep Fraunces for the Split wordmark, day titles, goals, verdicts, and scores. Keep Karla for instructions, controls, and supporting information.

## Layout

The game is one centered viewport, capped at 560px wide and sized to `100dvh`. Its canvas fills that viewport. The HUD and day title sit above a central vessel; a compact target, instruction, and start/hold controls sit below it. The intro sheet is a flat theme-colored tray, capped at 450px wide. Its centered goal and vessel-feel label stack above the instruction and action; the daily note and rules disclosure share a separated footer row. Safe-area insets protect the top and bottom controls. The entry overlay scrolls when the rules expand, with an automatic top margin keeping the tray at the bottom while it fits and top padding keeping overflowing content below the HUD.

At widths of 700px and above, the HUD and sheet receive wider side padding and the centered game gains an ambient shadow. Below a height of 740px, the heading, controls, gaps, and result image tighten together. The vessel's preferred bottom moves from 66.5% to 62.5% of viewport height on short screens; its top is chosen by shape, or 24% of viewport height below 650px. Initial layout and resize measure the closed entry tray, including wrapped notes and the review footer, and fit the full vessel above it with 12px of clearance. The same fitted vessel box persists after Start, so revealing the live controls does not move the glass. This display fit preserves the normalized scoring geometry. Preserve the clear gap around the vessel when extending either scene or interface.

The `site/design.html` review route shows all three opening days and their sample cards in three columns, switching to a single column at 900px. This is a preview composition, not a new in-game navigation structure. Its link to `site/motion.html` opens a separate three-vessel preview with sip playback and frozen Ready, Drinking, Just released, and Settled stages; neither preview saves daily scores.

The bookmark-only `#admin/<themeId>` review keeps the vessel as the focal point on phone and desktop. A compact footer strip uses the current theme's sheet, ink, and separator colors. Entry, live, and result controls reserve space above it; the measured closed entry tray determines the vessel's available space, keeping its full silhouette clear of both tray and footer.

## Elevation & Depth

The interface is mostly flat. Theme-colored sheets meet the painted travel scene without floating-card effects. Depth comes from the place's worn wood, canopy or roof, distant company, and natural light, then the glass rim and wall highlights, condensation or dimples, beer gradient, dense microfoam, and lacing. The desktop game container and transient toast use ambient CSS shadows: respectively `0 10px 60px #0003` and `0 8px 24px #0003`. The hold control uses a shallow inset edge at rest (`inset 0 -3px 0 #0002`) and an inset pressed shadow (`inset 0 2px 5px #0003`) to make the gesture tangible.

Keep illustrated depth attached to the place and vessel. The result image is the dominant artifact, so the surrounding controls and stats need no added elevation.

## Shapes

Controls use softly curved corners from the control token; result images use the smaller card radius. The review route's embedded game frames use the preview-frame radius. Text actions remain bare and underlined. Separators are thin and tonal.

The vessel silhouette is the signature geometry: a curved tulip pint, a narrow-necked bottle with lime, and a broad handled liter stein. Marks are readable at the center of the glass; simplified printed brand names sit below the scored mark. The painted scenery reserves a quiet central foreground, with architecture, bunting, and people providing context around the vessel.

Corona has its own display outline: a slim straight body, long gently tapered neck, rounded shoulders and a rolled lip. Game, motion preview and postcard share that outline, including liquid slosh, target limits and guide endpoints. Display outlines live in `render-vessels.js` and never change the drinking cross-section in `core.js`. The momentum model intentionally changes sip timing; daily seeds, targets, saved scores and exact-day links remain fixed. Other bottle themes retain their existing outline.

**The Aim Rule.** The glass carries compact, recognizable brand artwork without permanent aiming arrows. A thin, contrasting dashed line briefly reveals the exact scored height on each fresh glass/attempt: 1.6 seconds visible, then a 300ms fade. Reduced motion shows a static cue for 1.9 seconds; starting the drink clears it immediately. Opening How to play repeats the intro cue. The line and logo share the vessel coordinate system; exported postcards omit the animated cue and retain their existing MARK/STOP guides. The Guinness glass uses its full serif wordmark and gold harp, adapted from the public Guinness brand SVG and spaced to match the VinePair pint reference. Its filled G crossbar top (source y=64.336) anchors exactly to the scored line; the full print scales to fit the tapered glass. Game, motion review, and postcard await the same self-hosted decoded print. Corona uses a five-tip jeweled crown; Bavaria a lozenge shield; Sapporo a gold star; Peroni a red wordmark with blue ribbons; Butterbeer a quartered Hogwarts-style school crest with four animal silhouettes and a central H. Its HOGWARTS caption uses visible glyph bounds to center the ink inside the enlarged top parchment, typeset at 11.2px before scaling into the crest. The H crossbar remains centered at crest y=0. The same artwork appears in concepts and postcards. Preserve released `markY`, `markH`, scoring tolerance, scores, and links when refining these marks.

## Components

### Buttons

Primary start, hold, and share actions are broad theme-accent surfaces with strong Karla labels. Hold is the single input across devices; phone sensor input, motion permissions, and recalibration have been removed. The vessel tips within the scene while holding and returns upright on release. The general primary action, including share, retains the frontmatter padding and minimum height of 54px, reducing to 48px on short viewports. Start and hold are 56px tall, or 52px at heights up to 650px, with 12px by 16px padding and a shallow inset edge. The start label occupies its own span so “Start today’s glass,” “Start this glass,” and “Start preview” retain the current-color arrow at the right edge. Hover brightens the main button; pressing the hold control adds an inset shadow and depresses it by 2px when motion is allowed. Press feedback preserves the theme's text contrast. All keyboard focus outlines use foreground ink (2px, offset 5px).

Text actions have underlined foreground labels and a minimum height of 38px. The outlined “Save postcard” action uses a thin theme separator border, foreground ink, and a separator-colored hover fill. “Copy text” is a text action inside “See text card.” Disabled controls reduce opacity to one half. Inline arrow and share icons use the current text color.

### Intro and live controls

The entry target and short vessel-feel label form a centered stack. At heights up to 650px, the entry hides the feel label; after Start, the mode line still names the pour feel and sits 116px from the top. Instructions name the hold-to-tip gesture and release-to-settle behavior. A details disclosure keeps the longer rules available alongside the daily note; expanded rules span the footer width and remain scrollable. Entry and live controls share the 16px tray radius, thin theme separator, and 16px padding, keeping the 8px rounded buttons inset from the tray. The live control is centered and capped at the same 450px width as the entry and result sheets. The 24px goal, 14px status, and broad button have distinct spacing. Each theme supplies its existing sheet, text, separator, and accent colors. Short viewports use 12px padding and a lower live-control anchor to preserve space around the vessel and preview navigation. The tray shows the current status, then a settling state while the glass returns upright. Practice starts in hold mode even when restoring an older result that used phone tilt.

The fixed launch date is October 9, 2026 for the old Irish pub. The opening lineup continues with Peroni at Trastevere sunset on October 10 and Sapporo at the Tokyo izakaya on October 11. HTTPS is valid and enforced, and `LAUNCH_READY` is true. Public date links preserve the same seeded glass with `?day=YYYY-MM-DD`. Root visits open today's official glass; today's local date offers one scored sip. An earlier date is explicitly Archive, with its date and “not saved” guidance. Archive starts say “Start this glass,” while a separate “Play today’s glass” action returns to the current challenge and clears the date link. A friend one calendar day ahead opens the same pour as an unsaved preview, with a note explaining its arrival tomorrow. Hash-based `#dayN` previews remain unsaved. If midnight passes during official play, the older glass becomes an archive before any record is written.

### Preview navigation

The bottom preview strip is shown only for hash-based day previews. Pub, Beach, and Fest links use foreground ink. The active link adds bold weight and a stronger accent underline, with `aria-current` preserving its meaning. Preview layouts reserve room for this strip.

### Theme review

The catalog footer pairs familiar Karla controls with a persistent “Theme review · not saved” label. Previous and next use current-color SVG arrows in 44px targets, flanking a 44px native picker populated from `THEMES`; both directions wrap. Refill and Exit are compact underlined text actions. Intro, live status, results, and postcards keep the unsaved state explicit, while shared links preserve the selected theme. Review uses the existing visual system and hold gesture across the full catalog.

### Vessel and physics

The whole vessel lifts and tips during a held sip, carrying its printed mark with it. The base tip targets are 20 degrees for the pint, 24 degrees for the bottle, and 18 degrees for the stein; each increases with the amount drunk, by up to 28, 24, and 26 degrees respectively. The stein accelerates more heavily; the bottle's movement pulses on the same deterministic 0.58-second cadence as its body glugs. Releasing the input returns the vessel to exact rest within one second.

The liquid stays near world-horizontal with a small damped response to acceleration. `site/js/liquid.js` adjusts the surface's center to preserve actual liquid volume in round cross sections as the glass rotates, including through the bottle shoulder. Motion and liquid geometry present the amount calculated by the existing drinking model; they do not alter the amount drained or supply a separate scoring line.

Line speed follows the reciprocal of round cross-sectional area, so the taper accelerates the pint’s falling line and the bottle’s shoulder slows it. Volume flow ramps up smoothly and carries briefly after release: the tulip pint has a bounded 0.42-second tail, the bottle 0.21 seconds, and the heavy stein 0.24 seconds. Release before the target and let the line settle; these learnable response times approximate sip momentum. The bottle retains its deterministic body glugs. Scoring waits until both the drink and vessel movement have settled. The result and share card then show the same upright beer/foam boundary through the target mark.

Material follows the vessel: dense cream microfoam and lacing on the pint; a clear long-necked bottle with a distinct lip and shoulder, condensation, lime, fine fizz, and a larger rising air pocket synchronized to each glug; thick glass, a broad clear handle, recessed dimples, and an irregular foam crest on the stein. Foam responds to the surface and leaves evidence of the sip while the scored boundary remains readable.

The place enters through a 650ms opacity reveal once its asset is ready. Starting a sip ends that introductory animation immediately. After the drink and vessel settle, the game paints the true upright stopping line before showing the result: a 220ms result fade and 420ms postcard focus reveal. These transitions support the gesture and the shareable result without adding delay to the score.

Reduced motion keeps zero spatial tipping, lifting, and slosh while preserving liquid progress and static foam and material detail. The confusing glass control beside the day number has been removed; the HUD retains the day and sound button. Its old saved full/still choice is ignored, so it cannot silently suppress a held sip. Motion now follows the device setting, with a short still-glass note explaining that setting. A recipient’s shared link cannot override it. Reduced motion also omits the scene, result, postcard, and sending reveals without changing the drink or score. Controls retain brief 100ms color transitions; the regular action and hold transitions use 140ms and 110ms respectively.

### Results and sharing

The primary invitation is “Beat my sip.” The link carries the current player's self-reported score, exact stopping offset, glass ID, and sip status. The invitation names the friend's shared score before play; the result compares both scores and adds a dashed SHARED line to the same postcard vessel alongside the player's actual solid STOP. A shared line is a supplied benchmark, not a verified identity or leaderboard entry. Date and theme validation must reject malformed or mismatched benchmarks without moving them onto a fallback glass. Practice, preview, archive, and saved-archive status remain visible. Sharing a reply always challenges the next friend with the current player's result.

Each scheduled place has a single short memory cue beneath its destination on entry; it recedes during the sip to keep the live status clear. Environmental motion belongs to the existing illustration: the pub hearth, Cabo surf, and Munich canopy cloth. The pub animates the actual painted flame texture with independent rising curls, using a soft heat matte derived from its luminous pixels. The grate and surrounding illumination stay fixed; no pulsing glow is added. The cached place stays intact; localized layers move around the vessel. Static exports and reduced motion omit those layers. Resting scenes repaint at no more than 30 fps, and hidden pages stop updating. The result crops the postcard to its scene and vessel so both lines can be compared; Save postcard retains the complete paper design and score.

The sound control lives beside the day number in the HUD and defaults off on every visit. An explicit click initializes and resumes audio; unsupported audio leaves the gesture working. Bottle glugs follow the same 0.58-second flow cadence. Pint and stein land with distinct subdued material cues, and a perfect split adds one quiet rim click. The result's stopping line briefly shines at its actual position as the verdict comes into focus, with a stronger bounded flash for perfect splits. This does not defer recording, controls, or the score. Returning to an existing score does not replay the fresh-sip celebration. Reduced motion keeps the static line and verdict without the flourish.

The result surface leads with a verdict, practice/archive/preview status when needed, the destination postcard, and the score. “Beat my sip” immediately opens the native text share sheet with the score and position strip as text and the exact-day or preview link as a separate native URL item, without waiting for image encoding. If native text sharing is unavailable or fails, the result is copied; if copying is denied, “See text card” opens, focuses and selects the result, and scrolls it into view for manual copying. “Copy text” sits inside that disclosure; the next result closes it again. “Save postcard” separately downloads the PNG on an explicit action.

The website link preview is a static 1200 × 630 photo-style card showing Guinness in the Irish pub, Peroni in Rome, and Sapporo in Tokyo, with friends behind the glasses. The cream band carries the Split wordmark, “One sip. Your turn.”, and “New glass. New challenge. Every day.” It gives Messages a recognizable link card while the message text carries the player’s result. Its fresh Open Graph image filename is versioned independently of the game modules and preserved by launch preparation. Actual Messages rendering depends on the receiving app and remains a device check.

Another sip is an explicit secondary action. The first daily score is retained separately from later practice. A previously saved result that crosses midnight says “Archive · saved sip”; an unfinished sip that crosses midnight finishes as an unsaved archive. Sharing exposes a busy state and briefly confirms shared or copied text, while “Save postcard” confirms the download separately. Real-phone hold/release and native text sharing remain open playtest checks.

The October 9 friends soft launch uses the fixed `friends-2026-10-09` record run. On refresh, earlier test attempts no longer restore or count in stats, so returning testers can take a fresh official sip. Their old data stays in its original local storage key, and preferences stay intact. Day 1 remains Guinness on October 9; calendar dates, pours, and shared links are unchanged. Keep the record run fixed through wider launch so friends retain their first sips and streaks.

The personal reset support route `/reset.html` follows the existing dark green surface, display face, and cream controls. It explains the scope, shows today's local date and saved score, and changes records only on an explicit “Reset my daily” click. A verified backup supports “Undo reset” while today's entry is empty; undo never overwrites a new sip. The primary next action opens a fresh daily tab state. Page visits are read-only, other dates and preferences stay intact, and the public calendar never changes. Errors keep the reset disabled and name the storage problem.

The image postcard is 1080 × 1350, with a paper border framing the same painted scene and vessel used in play. A large destination title and drink cue sit above it; the actual score and verdict sit below it. It uses the actual settled liquid level, a dashed mark guide, a solid stop guide, the score out of 100, the offset measured in mark height, and the public challenge address. Its five cells show one stopping position: high to low, with the middle cell green. An arrow indicates a stop outside the strip. “One sip. Your turn.” makes the social action clear without promising a result. The same destination, invitation, and one-row position appear in plain text. Preview, archive, and practice labels travel with both formats; saved archive cards distinguish a retained daily result from an unsaved archive sip. Sample review postcards are explicitly previews.

**The Same Challenge Rule.** Postcards and text shares retain the challenge date, so opening a result later preserves its glass and pour. Preview shares retain `#dayN` and never count toward the daily record. Use the centralized public address from `site/js/config.js`. The launch date is fixed at `2026-10-09`; changing it later would renumber existing challenges.

## Selected six-day lineup

The six-day lineup is pinned without changing the fixed launch date or released Day 1 seed. Day 2 (October 10, 2026) is Peroni at Trastevere sunset: a tall lager glass, red-and-blue Peroni label, warm stone, and a light paper palette. Day 3 (October 11) is Sapporo at the Tokyo izakaya: a tall golden lager glass, single gold star, rain-lit lanterns, and the dark green palette. Day 4 (October 12) is Festbier at Oktoberfest in Munich, with a heavy dimpled stein and a Bavarian crest. Day 5 (October 13) is Butterbeer in snowy Hogsmeade: caramel drink, generous cream head, tulip glass, and a quartered Hogwarts-style crest with a central H. Score the liquid boundary beneath the foam. Day 6 (October 14) is Corona at Cabo beach, with a clear long-neck bottle, lime, and crown.

Use the approved panels from the nine-option studio with the same table anchors in play and export. These three static paintings frame the vessel motion. The exported postcard retains light paper, destination, drink, actual stopping line, score, and date-specific invitation. `/next-three.html` is a review of the chosen upcoming days; hash previews and sample cards stay explicitly unsaved. The broader concept studio remains available for future choices.

## Do's and Don'ts

### Do:

- **Do** preserve the existing wordmark, Fraunces/Karla pairing, and canvas vessel language when adding a day.
- **Do** give each new place a coherent palette, recognizable vessel, short target, and matching destination postcard.
- **Do** keep the vessel and mark visible between the heading and controls at both normal and short phone heights.
- **Do** preserve the drained amount while tilting the rendered liquid, and wait for both drink and motion to settle before scoring.
- **Do** show the real settled beer line, mark guide, score out of 100, and one-row position strip in shares.
- **Do** label preview, archive, and practice results on both image and text shares, preserving whether an archived result was previously saved.
- **Do** preserve the challenge date in shares and offer a clear route back to today's glass from an archive.
- **Do** keep travel scenery illustrative, with a clear central vessel and the same table anchor in play and export.
- **Do** use foreground ink for focus and active preview text, retain the reduced-motion treatment, and expose the selected share text for manual copying when automatic copying fails.
- **Do** make the primary share action send the compact text result immediately, keeping postcard download an explicit secondary action.

### Don't:

- **Don't** let scenery, printed brand names, bunting, headings, or controls obscure the scoring mark.
- **Don't** represent the five-cell position strip as attempts or a multi-row guessing history.
- **Don't** express a score as an accuracy percentage; offset percentages measure mark height.
- **Don't** replace a player's first daily score with a later practice sip.
- **Don't** save archive or preview sips, or renumber shared challenges by moving the launch date after release.
- **Don't** introduce external font requests when the shipped font files already provide the required weights.
