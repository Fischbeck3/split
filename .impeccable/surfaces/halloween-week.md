# Halloween week review

## Mode

Experience. The visitor sees seven Halloween places and glasses, then opens an unsaved playable review of any one.

## Direction contract

THESIS: Seven Halloween places extend Split's beer memories through the painted setting, distinctive glass, and readable mark.

OWN-WORLD: Fraunces, Karla, Split's wordmark, canvas vessels, and underlined actions continue the incumbent identity. Dark plum `#231d2b`, cream `#f4e7ce`, and pumpkin amber `#e7ad68` frame the work.

STORY: Follow the proposed October 25–31 order, discover five seasonal marks and two familiar Guinness pints, then open an unsaved playable glass.

FIRST VIEWPORT: Split and review links sit above a two-column introduction. The 37–58px title faces brief copy and the pumpkin-porch action; four portraits begin beneath the seven-night heading.

FORM: Directly shape this narrow extension of the existing review contact sheet: four columns become three, two, then one, with native postcard disclosures. The inherited visual world requires no concept seed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Surface contract

`/halloween-week.html` presents the seven concepts in October 25–31, 2026 order. These are proposed review nights, not scheduled daily pours. Dates appear beneath each place title. Each initial thumbnail shows the full pour and target line with the selected theme's authoritative review parameters. Clicking the scene or “Try this glass” opens `/#admin/<themeId>` directly.

The flat contact sheet uses four columns on a wide desktop, then three, two, and one as space narrows. Native disclosures show explicitly illustrative 100/100 sample postcards and PNG downloads. Scene loads are lazy; thumbnails do not run perpetual animation. Failure copy preserves the playable review link and offers a reload. Keyboard focus, image descriptions, themed browser surfaces, and reduced-motion behavior follow Split's established review routes.

The current admin catalog contains 43 glasses: six public themes, fifteen travel previews, seven Halloween previews, and fifteen autumn previews. The public daily calendar and rotation retain the original six. The travel review links to this route so all new glasses are discoverable while the user is away.

## Finish evidence

The finish reviewer inspected ten captures in `.impeccable/review/halloween/`: `desktop.jpg`, `mobile-gallery.jpg`, `mobile-gallery-glass.jpg`, `mobile-pumpkin.jpg`, `halloween-ghost-stories-mobile.jpg`, `halloween-witching-hour-mobile.jpg`, `halloween-ravens-rest-mobile.jpg`, `halloween-vampires-toast-mobile.jpg`, `halloween-midnight-carnival-mobile.jpg`, and `halloween-last-orders-mobile.jpg`. The review found no material visual or interaction defect. Its initial `fix` disposition concerned DESIGN.md persistence only: the old catalog wording and missing Halloween guidance. This documentation pass records the completed extension and corrects that finding.

The root agent separately inspected two captures after the review: `mobile-short-live.jpg` at 390 × 650 shows the settled “Hold to drink” state, and `mobile-postcard.jpg` shows Vampire’s toast with its real sample postcard expanded. These are additional phone interaction captures, outside the reviewer's initial ten.

Root validation passed `node --test`: 302 tests, 302 passed, zero failed. `npm run build -- c2d98205c3fdf7689ae858051a70bf51cac30bf5` also passed. Source checks in `test/halloween-themes.test.js` cover the 28-glass review catalog, isolation from the public six, five distinct vessels/pours/marks, scoring-origin alignment, original Guinness geometry and response, shared print decoding, and table framing at game and postcard sizes. An independent release audit checked code, assets, and the 94-edge module graph, with no unintended calendar, storage, or token changes.

The documenter checked `site/js/halloween-themes.js`, `halloween-marks.js`, `halloween-week.js`, `draw.js`, the inherited `fifteen-themes.css`, and `halloween-week.css` against the direction contract. It verified all seven scene prompt sidecars match their exact prompt in `site/assets/scenes/halloween-generation-a.json` or `halloween-generation-b.json`. DESIGN.md gains factual extension prose; its existing token frontmatter and `.impeccable/design.json` remain intact. Pre-existing sidecar drift is left for a separately requested repair.
