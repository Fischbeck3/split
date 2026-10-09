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
  preview-frame: "10px"
spacing:
  compact: "8px"
  small: "12px"
  control-top: "18px"
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
    height: "64px"
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

**Creative North Star: "One sip. Three places."**

Split puts a familiar drink in a recognizable place. The oversized canvas vessel carries the experience; the interface gives it a short title, one clear target, and an easy way to start. A visible lift, tip, and return make the sip legible before its settled line supplies the score. The incumbent Fraunces and Karla pairing, Split wordmark, and illustrated glass remain the common identity across days.

The pub is dark and warm, the beach is pale with sea-colored ink, and Oktoberfest is bright with blue and white detail. Each place also travels into the result card and text share. The visual world stays simple enough to recognize in a group chat, with a distinct vessel silhouette and a truthful stopping position.

**Key Characteristics:**

- A large, unobscured vessel is the focal point.
- The place changes the palette, backdrop, vessel, and share card together.
- Heavy serif titles pair with plain, compact instructions.
- A visible lift and tip explain the sip; a single settled stopping position carries the result.

## Colors

The three opening themes share semantic roles while changing the atmosphere. The frontmatter records the implemented values from `site/js/themes.js` and the light/dark result colors in `site/js/main.js`; illustration-only gradients and details remain in `site/js/draw.js` and `site/js/share.js`.

### Primary

- **Pub gold** (`pub-accent`): the start/hold/share control and the pub card's score band. Deep green ink keeps the gold surface readable.
- **Sea teal** (`beach-accent`): the beach control, paired with cream ink.
- **Festival gold** (`fest-accent`): the stein control, paired with deep blue ink.

### Neutral

- **Pub green and cream**: dark background and sheet, warm foreground, subdued supporting copy, and restrained green separators.
- **Sand and sea ink**: pale sand background, cream sheet, deep blue foreground, slate supporting copy, and a quiet pale separator.
- **Festival paper and blue**: cool near-white background, white sheet, deep blue foreground, slate supporting copy, and pale blue separators.

### Feedback

Good, warning, and miss colors change with the light or dark theme. The dark warning uses pub gold. These colors communicate verdicts; they do not change the accuracy calculation or turn the positional strip into an attempt grid.

**The Same Place Rule.** The game and its exported card use the same daily theme. Keep scene, vessel, mark, and palette coherent.

**The Readable State Rule.** Use foreground ink for focus outlines and active preview labels. Accent color may underline a selection; it does not replace readable text.

## Typography

**Display Font:** Fraunces, with Georgia and serif fallbacks. The canvas additionally lists Playfair Display before Georgia as an existing fallback.

**Body Font:** Karla, with Helvetica Neue, Arial, and sans-serif fallbacks.

The heavy serif gives the wordmark and score a familiar pub-sign character; Karla keeps the few instructions and controls direct. The shipped files self-host Fraunces (900) and Karla (400, 600, 700), with OFL license files in `site/fonts/`. No remote font service is required.

### Hierarchy

- **Display:** the day title uses the frontmatter display role and balanced wrapping. A short viewport reduces it to 33px.
- **Wordmark:** the tight, heavy `Split.` wordmark anchors the top-left corner; it reduces to 30px on a short viewport.
- **Title:** the goal uses the title role; live goals, result verdicts, and review-page headings have nearby observed sizes (27px, 28px, and 26px).
- **Body and support:** the body role is the base; instructions and day descriptions use the support scale, with muted ink where appropriate.
- **Label:** mode, vessel feel, preview navigation, practice status, and daily note stay compact. Day numbers and scores use tabular numerals where the DOM renders them.
- **Score:** the result score uses the score role. The exported card scales Fraunces up within its fixed canvas rather than changing the font identity.

**The One Identity Rule.** Keep Fraunces for the Split wordmark, day titles, goals, verdicts, and scores. Keep Karla for instructions, controls, and supporting information.

## Layout

The game is one centered viewport, capped at 560px wide and sized to `100dvh`. Its canvas fills that viewport. The HUD and day title sit above a central vessel; a compact target, instruction, and start/hold controls sit below it. The intro sheet is flat, with a maximum width of 450px and a small vertical rhythm. Safe-area insets protect the top and bottom controls.

At widths of 700px and above, the HUD and sheet receive wider side padding and the centered game gains an ambient shadow. Below a height of 740px, the heading, controls, gaps, and result image tighten together. The vessel's top is chosen by shape and its bottom moves from 66.5% to 62.5% of viewport height on short screens. Preserve the clear gap around the mark when extending either scene or interface.

The `site/design.html` review route shows all three opening days and their sample cards in three columns, switching to a single column at 900px. This is a preview composition, not a new in-game navigation structure. Its link to `site/motion.html` opens a separate three-vessel preview with sip playback and frozen Ready, Drinking, Just released, and Settled stages; neither preview saves daily scores.

## Elevation & Depth

The interface is mostly flat. Theme-colored sheets meet the illustrated scene without floating-card effects. Depth comes from the glass rim and wall highlights, condensation or dimples, the beer gradient, dense microfoam and lacing, wood or shoreline layers, and restrained scene lighting. Only the desktop game container and transient toast use CSS shadows: respectively `0 10px 60px #0003` and `0 8px 24px #0003`.

Keep illustrated depth attached to the place and vessel. The result image is the dominant artifact, so the surrounding controls and stats need no added elevation.

## Shapes

Controls use softly curved corners from the control token; result images use the smaller card radius. The review route's embedded game frames use the preview-frame radius. Text actions remain bare and underlined. Separators are thin and tonal.

The vessel silhouette is the signature geometry: a curved tulip pint, a narrow-necked bottle with lime, and a broad handled liter stein. Marks are readable at the center of the glass; simplified printed brand names sit below the scored mark. Oktoberfest bunting stays above the glass and below the heading.

## Components

### Buttons

Primary start, hold, and share actions are broad theme-accent surfaces with strong Karla labels. Hold is the primary input across devices; optional phone tilt uses a secondary text action. The main action has the frontmatter padding and a minimum height of 54px; the drinking control is 64px tall. Short viewports reduce the main action to 48px. Hover brightens the main button; pressing the hold control darkens it. All keyboard focus outlines use foreground ink (2px, offset 5px).

Text actions have underlined foreground labels and a minimum height of 38px. The outlined copy action uses a thin theme separator border, foreground ink, and a separator-colored hover fill. Disabled controls reduce opacity to one half. Inline arrow and share icons use the current text color.

### Intro and live controls

The target and short vessel-feel label form a compact row. Instructions name the hold-to-tip gesture and release-to-settle behavior. A details disclosure keeps the longer rules available without competing with the vessel. The live control shows the target and current status, then a settling state while the glass returns upright. Optional tilt mode offers upright recalibration before the sip.

### Preview navigation

The bottom preview strip is shown only for hash-based day previews. Pub, Beach, and Fest links use foreground ink. The active link adds bold weight and a stronger accent underline, with `aria-current` preserving its meaning. Preview layouts reserve room for this strip.

### Vessel and physics

The whole vessel lifts and tips during a held sip, carrying its printed mark with it. The base tip targets are 20 degrees for the pint, 24 degrees for the bottle, and 18 degrees for the stein. The stein accelerates more heavily; the bottle's movement pulses on the same deterministic 0.58-second cadence as its body glugs. Releasing the input returns the vessel to exact rest within one second.

The liquid stays near world-horizontal with a small damped response to acceleration. `site/js/liquid.js` adjusts the surface's center to preserve the rendered filled area as the glass rotates, including through the bottle shoulder. Motion and liquid geometry present the amount calculated by the existing drinking model; they do not alter the amount drained or supply a separate scoring line.

The pub's intake stops immediately, the bottle drops quickly through its neck and glugs through its body, and the heavy stein retains its bounded 0.24-second drinking follow-through. Scoring waits until both the drink and vessel movement have settled. The result and share card then show the same upright beer/foam boundary through the target mark.

Material follows the vessel: dense cream microfoam and lacing on the pint; a clear long-necked bottle with a distinct lip and shoulder, condensation, lime, fine fizz, and a larger rising air pocket synchronized to each glug; thick glass, a broad clear handle, recessed dimples, and an irregular foam crest on the stein. Foam responds to the surface and leaves evidence of the sip while the scored boundary remains readable.

Reduced motion zeroes spatial tipping, lifting, and slosh while preserving liquid progress and static foam and material detail. Optional CSS transitions use 160ms ease-out; the result image arrives over 400ms only when reduced motion is not requested.

### Results and sharing

The result surface leads with a verdict, practice/preview status when needed, the themed card, and the score. Sharing offers the image or text; practice is an explicit secondary action. The first daily score is retained separately from later practice.

The image card is 1080 × 1350, with the daily scene and vessel above a strong score band. It uses the actual settled liquid level, a dashed mark guide, a solid stop guide, the score out of 100, the offset measured in mark height, and the canonical game URL. Its five cells show one stopping position: high to low, with the middle cell green. An arrow indicates a stop outside the strip. The same one-row position appears in plain text. Preview and practice labels travel with both formats; sample review cards are explicitly previews.

## Do's and Don'ts

### Do:

- **Do** preserve the existing wordmark, Fraunces/Karla pairing, and canvas vessel language when adding a day.
- **Do** give each new place a coherent palette, recognizable vessel, short target, and matching share treatment.
- **Do** keep the vessel and mark visible between the heading and controls at both normal and short phone heights.
- **Do** preserve the drained amount while tilting the rendered liquid, and wait for both drink and motion to settle before scoring.
- **Do** show the real settled beer line, mark guide, score out of 100, and one-row position strip in shares.
- **Do** label preview and practice results on both image and text shares.
- **Do** use foreground ink for focus and active preview text, and retain the reduced-motion treatment.

### Don't:

- **Don't** let scenery, printed brand names, bunting, headings, or controls obscure the scoring mark.
- **Don't** represent the five-cell position strip as attempts or a multi-row guessing history.
- **Don't** express a score as an accuracy percentage; offset percentages measure mark height.
- **Don't** replace a player's first daily score with a later practice sip.
- **Don't** introduce external font requests when the shipped font files already provide the required weights.
