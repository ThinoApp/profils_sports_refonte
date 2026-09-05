# Current State / Next — Profils Sports Refonte

Last updated: 2026-09-05

## Current version

V3 redesign deployed on GitHub Pages.

Live preview:

`https://thinoapp.github.io/profils_sports_refonte/`

Primary branch:

`main`

## Recently completed

- replaced the existing eight-discipline strip with a genuine Three.js openwork logo rotor in the same location: the authentic logo and discipline orbit turn together, with upright icons, pause/resume, drag, keyboard and 45-degree navigation; no separate brand section was added
- coordinated site-wide motion around construction and wayfinding: the Solutions rail now has frame-rate-independent easing, measured photo parallax and eight accessible chapter controls; Catalogue opens from its selected row and returns to it; chapter rows, media masks and the Contact drawing have authored entrance sequences
- corrected ribbon page intersections around the enlarged front page, added previous/next controls to both WebGL and static modes, suspended settled/hidden ribbon rendering, and anchored its controls to the visual viewport on mobile
- prioritized local catalogue texture fetch/decode independently of pending remote media, preserved Contact's signal-yellow typography after FR/EN switches, and allowed French accents above the text-reveal masks

- moved the active redesign workflow to `ThinoApp/profils_sports_refonte`
- configured GitHub Pages deployment through GitHub Actions
- established the V3 repository-backed homepage
- preserved the horizontal sticky solutions carousel
- replaced the generic cursor treatment with a directional dart inspired by the supplied reference video
- fixed a cursor compatibility bug by adding robust pointer detection and a native cursor fallback
- extracted and incorporated verified service, catalogue and client data from the legacy repository
- documented agent handoff context in `AGENTS.md` and `/docs`
- added a localized WebGL particle preview to the catalogue list with cursor inertia, outgoing/incoming overlap and static fallback
- hardened the catalogue particle preview by vendoring Three.js and the four catalogue cover textures locally, removing CDN/CORS activation failures
- added explicit cache-busting version parameters for the catalogue WebGL module, CSS, local Three.js runtime and local cover textures after Safari kept executing the older CORS-dependent bundle
- filled the catalogue left column with a catalogue-reactive animated SVG blueprint path stage while preserving the floating WebGL image preview
- replaced catalogue blueprint SVG swapping with one continuous spring-morphed SVG geometry that redirects from its current intermediate state on rapid hover changes
- connected the Hero and “De la conception à l’exploitation” manifesto through a single reversible scroll-driven clip/shared-media transition on desktop
- replaced the basic preloader with a branded construction-curtain intro: architectural grid, monumental masked type, signal field line and split reveal into the live Hero
- rebuilt the pre-loader as a deterministic four-phase architectural impact sequence with a field blueprint, four-gate reveal, Hero-synchronised opening and non-blocking video readiness
- removed the redundant pre-loader copy of `SPORT TAKES SHAPE.` so the headline performs its first and only entrance inside the Hero
- removed the abrupt final Hero cut by making the pre-loader root transparent during its opening, synchronising both shutter systems and keeping the overlay mounted until every visible Hero/brand motion has settled
- simplified the pre-loader by removing its redundant top metadata, corner phase counter, bottom phase rail, media status, four corner brackets and full-screen centre axes while preserving the main construction sequence and Hero transition
- centred the field construction and connected its six sequential drawing segments to one persistent signal-yellow cursor, including curved pen-up transfers between disconnected markings; that same cursor curves into the emerging logo, accompanies it along a measured path and lands it on the real Header logo without a visual swap
- extended that uninterrupted construction gesture into the Hero headline: after the logo lands, the same cursor measures and reveals `SPORT`, `TAKES` and `SHAPE.` line by line instead of handing the title to an unrelated entrance animation
- decluttered the Hero into a title-led editorial composition with one concise project brief and a genuinely clickable project-start action, while preserving the post-preloader cursor reveal geometry unchanged
- replaced the rejected liquid Method reveal with a precise hover + drag project/engineering split: a signal-yellow divider directly compares the photo with stage-specific technical drawings and keeps the original static fallback
- moved the Method tracer from drag to Method-row hover/focus: each row now redraws its technical geometry from a genuinely blank technical substrate, while drag remains dedicated to the photo ↔ engineering split
- clarified the Method information hierarchy: the five-step list now carries the explanation and expands only the active row, while the technical face is reduced to a quiet grid, split comparison and cursor-drawn figure
- replaced direct catalogue-page links with a full-screen 3D helical ribbon viewer using all 102 authentic catalogue pages; every page is now a subdivided, double-sided surface whose vertices bend around the same vertical helix
- added selective editorial line-mask reveals to the main Solutions, Catalogue, Method, Clients, Performance and Contact copy; the Hero keeps its dedicated pre-loader choreography, while local GSAP/SplitText assets, live FR/EN re-splitting and reduced-motion fallbacks keep the treatment robust

## Current implementation files

- `index.html`
- `styles.css`
- `script.js`
- `repo-data.json`

## Current priorities

1. Validate the directional cursor visually against the reference video on the live GitHub Pages build.
2. Polish responsive behavior, especially the horizontal carousel and large typography on tablet/mobile.
3. Build a proper Project / Reference page template ready for real verified projects.
4. Continue replacing generic/legacy media with verified Profils Sports project imagery when available.
5. Evolve the current single-page prototype toward the final site information architecture.

## Deferred audit recommendations — 2026-09-04

Keep these items in the roadmap, but do not mix them into focused visual iterations unless requested:

- restore pointer interaction on the desktop Hero CTA inside the shared transition
- make direct section anchors reliable after dynamic Hero / manifesto recomposition
- complete and harden FR / EN translation, including runtime-injected content
- add keyboard focus styles, a skip link and robust mobile-menu focus handling
- make the custom cursor fallback safe even if JavaScript fails to initialise
- optimise and durably host the heavy external media assets
- suspend continuous cursor, SVG and WebGL animation loops when off-screen
- turn solution-panel arrows into real navigation and catalogue links into a full browsing experience
- replace prototype SEO metadata and add favicon, canonical, social metadata, legal pages and a branded 404
- remove the duplication between `repo-data.json` and hardcoded page content

## Proposed future page architecture

- Home
- Projects
- Solutions
- Expertise
- Company
- Contact

Potential solution detail pages can be created for:

- Stades
- Sports collectifs
- Accès libre
- Gymnases
- Aménagement de sol
- Installation & pose
- Maintenance
- Conseil & expertise

## Known issues / watch points

### Cursor

The latest cursor implementation should now:

- activate on devices exposing a fine pointer
- use `any-pointer:fine`
- use pointermove + mousemove compatibility handling
- restore the native cursor if custom cursor cannot run

If the cursor still fails on a specific browser/device, inspect the live build before changing the visual design itself.

### External media

The refonte currently references several assets directly from `www.profilssports.com` rather than copying heavy media into this repository.

This keeps the refonte repository light, but creates an external dependency. If the legacy domain/assets change, media may break.

A future production hardening step should decide whether to:

- copy approved assets into the refonte repository, or
- move them to a durable CDN / asset host.

The 102 pages used by the catalogue ribbon are now optimized WebP derivatives stored locally under `assets/catalogue-ribbon/`; they no longer depend on the legacy domain at runtime.

### Data quality

Do not reuse obvious demo data from legacy pages such as fictional references, partners, awards, budgets or satisfaction metrics.

Wait for verified data from the user or a trusted source before building final project case studies.


### Catalogue particle preview

Desktop fine-pointer users get a floating WebGL preview while hovering Fitness, Padel, CSP Pro and Canopy School. The preview follows the cursor with inertia and transitions between covers through overlapping outgoing/incoming particles.

The current tuning is based on the written reverse-engineering specification only. Exact size, offset, particle density, scatter radius, duration and easing still need frame-by-frame calibration once the specific reference video is available.

The original static catalogue preview is intentionally preserved as the fallback.

### Catalogue detail ribbon

Clicking any of the four catalogue rows opens a full-screen WebGL ribbon built from the authentic page sequence. The trajectory is a vertical helix around an invisible axis: pages travel from the front to profile, rear, opposite profile and front again while progressing vertically. The active page occupies the central front of the helix and grows by up to 24% through a continuous focus influence.

The pages are not rigid planes placed on a path. Each mesh uses a 32 × 4 subdivided surface and every vertex is analytically projected onto the helix, so the image itself curves with the ribbon. One double-sided shader displays the authentic image on both faces and corrects the rear UV orientation to prevent mirrored text.

Wheel, trackpad, vertical/horizontal drag, touch and keyboard all advance one shared inertial progress value. Wheel and drag settle through a soft snap to the nearest central page, while far page meshes recycle above or below the viewport to create an infinite sequence. The pool uses 15 desktop or 17 mobile surfaces; mipmaps and multisample antialiasing remain disabled, device pixel ratio is capped, and adaptive resolution protects motion cadence on slower GPUs. Reduced-motion or unavailable-WebGL environments retain the horizontal static page rail.

### Editorial text reveals

The primary headings and a limited set of editorial summaries reveal line by line through real text masks when they enter the viewport. The Hero and manifesto remain excluded because their motion already belongs to the pre-loader and shared-media sequence.

GSAP 3.15.0, ScrollTrigger and SplitText are vendored locally. Line wrapping is recalculated after responsive layout changes and after every FR / EN switch. If the motion libraries are unavailable, when printing, or when `prefers-reduced-motion` is active, the original semantic text remains immediately visible.

### Site-wide motion — September 5

`site-motion.js` / `site-motion.css` enhance the existing composition. The Solutions track has one motion owner selected through `data-motion-track`; `script.js` keeps the baseline when that enhancement is absent. Its travel comes from untransformed panel geometry and real viewport width, including trailing padding. Eight numbered controls navigate the actual scroll positions and retain a vertical reading flow on mobile/reduced motion.

Catalogue/Client/Performance rows reveal with drawn separators, Method media enters through a measured mask, discipline icons arrive in sequence, and a yellow pen draws Contact's circle and axis with a curved pen-up transfer. The approved pre-loader, Hero title and Hero/manifesto choreography retain their existing ownership.

The ribbon keeps its analytic helix. Extra spacing around the enlarged front page prevents intersecting surfaces. Drag uses a faster response than wheel input, with stale drag momentum discarded. Rendering sleeps when settled and wakes on navigation, pointer motion, viewport changes or texture arrival; hidden tabs do not render. Local textures use priority fetch and bitmap decoding with a TextureLoader compatibility path. Desktop/touch, FR/EN, keyboard navigation, reverse rail navigation, idle rendering, focus restoration and reduced-motion static controls were exercised in Chromium. Physical Safari/iOS smoothness still merits user validation; external legacy media remains a separate dependency.

## Do not change without discussion

- V3 overall art direction
- signal yellow `#EFE158`
- monumental editorial typography system
- horizontal sticky solutions carousel
- directional dart cursor concept
- technical blueprint / engineering language
- repository-backed content integrity rule

### Three.js discipline rotor — September 5

The requested placement is the existing `.discipline-rail` at the bottom of Catalogues, not a new section before Contact and not a redesign of the catalogue page ribbon. `brand-emblem.js`, `brand-emblem-worker.js` and `brand-emblem.css` enhance that rail only. The initial standalone medallion experiment was discarded before publication.

The logo is real geometry: 138 contours with 71 holes traced from the user's original `image jaune.png`, extruded into four indexed relief meshes (73,910 vertices), with a smooth perimeter and no backing disk, logo texture or generated image. Original lettering, orientations and sports pictograms come from the authentic raster artwork; raster contours are simplified for web use. The original is preserved at `assets/brand/profils-sports-emblem-source.png`. `scripts/build-logo-geometry.mjs` regenerates the 97 KB contour asset with the original PNG and a tooling-only Playwright module path as arguments. The visitor only receives the contour JSON and the existing local Three.js runtime; triangulation runs in a short-lived worker.

The rotation/navigation reproduces the legacy `src/pages/Accueil/NosCatalogues/NosCatalogues.tsx` mechanism: eight positions, 45-degree steps, a common rotor and upright icons. Here the icons are projected from actual world coordinates while the ajouré logo has physically lit bevels, thickness and subtle perspective. Desktop crops the large lower half as requested; mobile fits the logo and keeps controls outside its lettering. The eight authentic icon assets are now local.

Catalogue mappings follow the legacy code: Fitness → Fitness, Padel → Padel, Soccer → Canopy School, Street Workout → CSP Pro. The action explicitly names the real catalogue. Other disciplines offer a contact email rather than invented “soon” availability. The original catalogue rows, particle preview, blueprint and page ribbon remain; the new action opens that same ribbon with its own transition origin and focus restoration.

Slow autoplay can be paused; selecting, dragging or using the keyboard pauses it. Reduced-motion has no autoplay or eased rotation. Rendering suspends off-screen, in background tabs and behind the catalogue modal. Missing geometry, failed worker or lost WebGL restores the original eight-discipline strip. Existing site-wide figure reveals exclude the rotor to avoid competing transform owners.

Chromium checks passed for true indexed geometry without a face texture/disk, real rotation, pause/idle sleep, stepping, drag, keyboard, FR/EN, catalogue opening/focus restoration, off-screen suspension, mobile touch controls, reduced motion and missing-geometry fallback. The broader Solutions/ribbon regression also passed without JavaScript exceptions. Validate the visual feel on physical Safari/iPhone; the pre-existing mobile page-width/anchor issues outside the rotor remain separate.

## Handoff instructions for a new conversation

The recommended opening prompt is:

> Work on `ThinoApp/profils_sports_refonte`. Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/DECISIONS.md` and `docs/NEXT.md` first. The repository is the source of truth. Then fetch the latest implementation files before making changes.

If this file conflicts with the actual current repository implementation, treat the repository code and the most recent commits as authoritative and update this file accordingly.

- stabilized the directional cursor heading by sampling direction once per animation frame, filtering the movement vector and removing simultaneous pointermove/mousemove input
