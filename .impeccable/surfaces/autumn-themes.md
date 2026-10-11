# Autumn themes

Mode: Experience

## Direction contract

THESIS: Fifteen familiar beer memories return in autumn, with the same recognizable vessel and mark and a small change in weather, light, foliage, or company.

OWN-WORLD: Preserve Split's painted travel scenes, Fraunces and Karla, the wordmark, live canvas glass, underlined actions, and existing review contact sheet. A local walnut and amber palette frames the autumn paintings.

STORY: Browse five Guinness settings followed by ten other beer memories, then open an unsaved autumn glass in the 43-theme admin catalog. Each scene has a matching sample postcard.

FIRST VIEWPORT: Split and review links precede a short autumn introduction and the first painted glasses. The artwork leads; familiar review controls make a playable glass easy to find.

FORM: Extend the existing fifteen-theme contact sheet directly. Keep its responsive grid and native postcard disclosures. Seasonal artwork is edited from the original backgrounds, preserving each location and view; this narrow variation requires no concept tournament or replacement visual identity.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Surface contract

`/autumn-themes.html` shows fifteen autumn variations without assigning public dates. `/#admin/<autumn-theme-id>` opens each unsaved playable glass, with an Autumn prefix in the native picker. The admin catalog contains six public themes, fifteen travel previews, seven Halloween previews, and fifteen autumn previews. Calendar planning and released daily challenges retain the original six public themes.

The five Guinness bases are the original Irish pub, Dublin, London, Edinburgh, and New York. Chicago's St. Patrick's Day scene remains in its existing holiday setting. The ten other bases are Amsterdam/Heineken, Prague/Pilsner Urquell, Brussels/Stella Artois, Copenhagen/Carlsberg, Barcelona/Estrella Damm, Mexico City/Modelo Especial, Boston/Samuel Adams, Milwaukee/Miller High Life, Colorado/Coors Banquet, and the High Sierras/Sierra Nevada Pale Ale.

Autumn appears through restrained local details: rain and warm pub lamps, cooler evenings, golden canal or harbor trees, light jackets at a ballgame or café, golden aspens in the Sierras, and first-snow late-autumn conditions at the Colorado ski lodge. The seasonal change adds no Halloween or Christmas decorations. Each variant inherits its original beer color, brand print, scoring mark, target geometry, vessel material, and sip behavior. The Guinness G stays exact; High Life and Sierra Nevada retain their distinct brown bottles; Modelo stays clear and the ballgame cup stays plastic.

Each selected painting is a sibling asset. Table framing and a measured rear tabletop edge keep the whole setting visible and anchor the live glass consistently in the gallery, phone game, and postcard. A failed autumn asset retains the original scene fallback. The game renders the glass separately from the painting.

The contact sheet loads nearby scenes lazily without perpetual thumbnail animation. Native disclosures show clearly illustrative, unsaved sample postcards and PNG downloads. Scene links, error recovery, readable focus, browser surfaces, and reduced motion follow the incumbent gallery.

Christmas and winter variants are a possible November follow-up. This request creates no schedule or automatic future work.

## Finish evidence

The root agent validated and opened twenty captures in `.impeccable/review/autumn/`: `desktop.jpg`, `user-675.jpg`, `mobile-gallery.jpg`, all fifteen `autumn-*-phone.jpg` glass entries, `short-phone-live.jpg`, and `phone-postcard.jpg`. The short-phone capture shows High Life ready to drink at 390 × 650; the postcard capture shows the High Sierras sample expanded. The independent finish reviewer opened the same twenty and found no UI, layout, or mark blocker. Its remaining finding was documentation persistence in DESIGN.md and this finish record; this pass records the completed extension without UI edits or new captures. The reviewer then scored that sole fix resolved and returned `ship`; its prior visual assessment stands.

One detector pass is preserved in `detector.json`. Three advisories cover intentional local palette values and the inherited 14px action size. Its flat-type-hierarchy finding missed the imported stylesheet and reported body, h1, and h2 as 16px. `type-evidence.json` instead records computed phone sizes of body 16px, intro 17px, h1 38px, and h2 33px, with no horizontal overflow and a ready postcard. Narrow value exceptions cover the intentional values, and a file-specific exception covers that false positive; no whole file or rule was suppressed.

Root validation passed `node --test`: 308 tests, 308 passed, zero failed. `npm run build -- 72ed3d5` also passed. The independent read-only release audit passed all 43 review routes and confirmed that the 28 prior pours, 734 daily parameter sets against baseline `72ed3d5`, and 29 original artwork files remain unchanged. It verified all fifteen provenance records and 104 resolved, stamped module edges, with no calendar, storage, credential, or unrelated changes. This evidence does not claim a live publication.

The documenter checked `site/js/autumn-themes.js`, `autumn-gallery.js`, `draw.js`, `site/autumn-themes.html`, `site/css/autumn-themes.css`, and the inherited gallery contract. It opened each autumn WebP's metadata and verified all fifteen exact prompt matches against `site/assets/scenes/autumn-generation-a.json`, `autumn-generation-b.json`, or `autumn-generation-c.json`: ten adjacent prompt sidecars and five embedded EXIF tag 270 descriptions. All assets are 1024 × 1536, and all manifest export records specify quality 88 and method 6. DESIGN.md gains factual extension prose; its token frontmatter and `.impeccable/design.json` remain byte-identical. Pre-existing sidecar drift remains untouched.
