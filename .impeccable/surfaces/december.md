# December holiday collection

Mode: Experience

## Direction contract

THESIS: Make every December daily glass a holiday gathering, with six festive cup designs taken from the approved board.

OWN-WORLD: Inherit Split's painted travel scenes, live transparent glasses, Fraunces/Karla, evergreen and warm paper. Holly, fir trees, Fair Isle, candy cane, poinsettia and gold confetti belong on the vessel, outside its clear scoring band.

STORY: Browse the six new glasses and the month, try an unsaved round, and see its matching postcard. All December dates receive explicit holiday assignments; November and historical scores retain their meaning.

FIRST VIEWPORT: The established holiday gallery introduces the month and shows large playable paintings. Six hero examples lead the remaining December gatherings. The existing game UI, cup movement and scoring controls remain the authority for play.

FORM: Direct extension of the existing gallery and renderer. The approved design board specifies scenes and cup decoration, not a replacement game or page layout. No concept roll is needed for this precise request. Six new background paintings plus existing Christmas paintings support 31 distinct daily settings, each with a festive live cup.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Authorization

On November 6, 2026 the user requested holiday themes throughout December with Christmas lights, trees and festive cups. After seeing the six-example board, they said “build em!”. This authorizes implementation and December calendar assignments, including replacing the previously reserved December NFL themes with this holiday collection. A festive football gathering remains one of the six designs. The approved board is outputs/december-holiday-board/december-holiday-design-board.png in the parent workspace.


## Finish evidence

The reviewed implementation is on `codex/december-holiday` at `1e9fb09`. Calendar v7 contains all 31 December holiday dates, superseding the prior 15 December NFL assignments. The catalog has 146 reviews and 87 calendar choices; the first 115 review positions, October and November assignments, and earlier pours remain intact. Six new paintings and 25 existing Christmas/winter paintings support the 31 separate December entries. Original gallery foregrounds remain unchanged.

- [Independent finish review](../review/december/finish-review.md): **ship**, with no material fixes. The approved board supplied scene and cup art direction; the implementation retained the established game and gallery structure.
- [Browser checks](../review/december/checks.json): 31 gallery entries loaded; all six festive prints contain painted pixels and zero pixels in their mark safety bands; each design completed a sip, and the local completed all four stages. No errors or horizontal overflow were recorded.
- Captures in `../review/december/`: desktop, two mobile gallery views, six glasses, sample postcards, all six phone game views, a complete round result, and the December calendar.
- Two bounded visual inspections corrected the Guinness heading wash and lower chalice confetti, then confirmed the fixes. The implementation passed 359 tests and the static build at `1e9fb09`.
- All six new paintings carry exact prompt sidecars and entries in `site/assets/scenes/december-generation.json`. All 25 reused December paintings have provenance. The scan’s 23 unrelated older travel/autumn assets with missing per-image sidecars remain an out-of-scope baseline gap.

The documenter reconciled README.md, PRODUCT.md, and DESIGN.md prose with the current collection. DESIGN.md frontmatter and `.impeccable/design.json` remain unchanged because this is an extension of the established visual system. Pre-existing documentation drift outside the December catalog/calendar summary was not turned into a new design rule. No December deployment has occurred.
