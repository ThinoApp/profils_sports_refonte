# Current State / Next — Profils Sports Refonte

Last updated: 2026-09-04

## Current version

V3 redesign deployed on GitHub Pages.

Live preview:

`https://thinoapp.github.io/profils_sports_refonte/`

Primary branch:

`main`

## Recently completed

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
- rebuilt the pre-loader as a deterministic four-phase architectural impact sequence with a field blueprint, monumental `SPORT TAKES SHAPE.` crescendo, four-gate reveal, Hero-synchronised opening and non-blocking video readiness
- replaced the pre-loader/Hero title handoff with a runtime-measured FLIP bridge: all three glyph boxes land exactly on the Hero title, while a signal-yellow SVG flight path leaves `SHAPE.` and lands on the real header logo

## Current implementation files

- `index.html`
- `styles.css`
- `script.js`
- `repo-data.json`

## Current priorities

1. Validate the directional cursor visually against the reference video on the live GitHub Pages build.
2. Polish responsive behavior, especially the horizontal carousel and large typography on tablet/mobile.
3. Build a proper Project / Reference page template ready for real verified projects.
4. Build a richer Catalogue detail / browsing experience using the real catalogue page sequences.
5. Continue replacing generic/legacy media with verified Profils Sports project imagery when available.
6. Evolve the current single-page prototype toward the final site information architecture.

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

### Data quality

Do not reuse obvious demo data from legacy pages such as fictional references, partners, awards, budgets or satisfaction metrics.

Wait for verified data from the user or a trusted source before building final project case studies.


### Catalogue particle preview

Desktop fine-pointer users get a floating WebGL preview while hovering Fitness, Padel, CSP Pro and Canopy School. The preview follows the cursor with inertia and transitions between covers through overlapping outgoing/incoming particles.

The current tuning is based on the written reverse-engineering specification only. Exact size, offset, particle density, scatter radius, duration and easing still need frame-by-frame calibration once the specific reference video is available.

The original static catalogue preview is intentionally preserved as the fallback.

## Do not change without discussion

- V3 overall art direction
- signal yellow `#EFE158`
- monumental editorial typography system
- horizontal sticky solutions carousel
- directional dart cursor concept
- technical blueprint / engineering language
- repository-backed content integrity rule

## Handoff instructions for a new conversation

The recommended opening prompt is:

> Work on `ThinoApp/profils_sports_refonte`. Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/DECISIONS.md` and `docs/NEXT.md` first. The repository is the source of truth. Then fetch the latest implementation files before making changes.

If this file conflicts with the actual current repository implementation, treat the repository code and the most recent commits as authoritative and update this file accordingly.

- stabilized the directional cursor heading by sampling direction once per animation frame, filtering the movement vector and removing simultaneous pointermove/mousemove input
