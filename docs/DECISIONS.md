# Decisions — Profils Sports Refonte

This file records meaningful design, content and implementation decisions so future agents do not accidentally undo choices that were made intentionally.

## 2026-09-03 — `profils_sports_refonte` becomes the source of truth

Decision:

`ThinoApp/profils_sports_refonte` is now the active implementation repository.

Rationale:

The user wants all future changes to happen directly in GitHub so every iteration can be tested through GitHub Pages without downloading ZIP files.

Implication:

- read this repository before modifying anything
- write changes directly here
- use `ThinoApp/profils_sports` only as a legacy/content source unless explicitly told otherwise

---

## 2026-09-03 — Preserve the V3 visual direction

Decision:

The current V3 art direction is approved as the baseline.

Rationale:

The user explicitly likes the visual direction of V2/V3 and asked that it be preserved while making the site more authentic and data-driven.

Key characteristics:

- deep architectural blue/black
- signal yellow `#EFE158`
- architectural paper backgrounds
- monumental condensed display typography
- asymmetric editorial layouts
- technical blueprint / wayfinding cues
- strong cinematic motion

Do not replace this with a generic corporate or SaaS visual system without explicit approval.

---

## 2026-09-03 — Keep the horizontal sticky solutions carousel

Decision:

The horizontal sticky carousel is a protected interaction.

Rationale:

The user explicitly called out the carousel as something they particularly liked.

Implication:

- keep the scroll-driven horizontal movement
- keep the editorial / architectural pacing
- do not convert it into a generic Swiper-style component or uniform grid unless asked

---

## 2026-09-03 — Avoid AI-generated hero imagery

Decision:

Do not use the old Readdy AI stadium hero image as a central production visual.

Rationale:

For a company selling physical sports infrastructure and engineering, synthetic hero imagery damages credibility and contributes to the "AI slop" aesthetic the user wants to avoid.

Preferred alternatives:

- real Profils Sports project media when available
- real repository assets
- real video assets
- catalogue imagery
- no image rather than a fabricated image

---

## 2026-09-03 — Use real repository data, not placeholder marketing claims

Decision:

Content in the redesign should be backed by verified repository data whenever possible.

Rationale:

The legacy repo contains a mixture of real service/catalogue content and obvious demo/placeholder data.

Verified / acceptable sources include:

- service families and targets from constants
- client segments from constants
- catalogue structures and page counts
- technical methodology from `ApprocheIterative`
- actual repository assets

Unverified / prohibited by default:

- fictional project names
- fabricated clients
- budgets
- awards
- certifications
- satisfaction rates
- invented metrics
- invented partners

---

## 2026-09-03 — Service architecture preferred over legacy "Our Worlds" taxonomy

Decision:

The redesign prioritizes the more business-legible service structure:

- Accès libre
- Aménagement de sol
- Conseil & expertise
- Gymnases
- Installation & pose
- Maintenance
- Sports collectifs
- Stades

Rationale:

This architecture better communicates what Profils Sports actually does than the older top-level taxonomy such as GAMES / TRAINING / STREETWORK / CHILDS / LIGHTING / etc.

The old taxonomy may still be useful for catalogue/product grouping, but should not automatically become the primary site navigation.

---

## 2026-09-03 — Use technical methodology as a core differentiator

Decision:

The technical content from the legacy `ApprocheIterative` section should be surfaced prominently.

Rationale:

Content such as ERP feasibility, Eurocodes, CAPEX/OPEX, HSE, quality control, coordination, handover and DOE gives the brand real engineering credibility.

Implication:

The redesign should not rely only on vague phrases like "innovation", "performance" or "excellence". Technical substance should be visible.

---

## 2026-09-03 — Current implementation remains vanilla HTML/CSS/JS

Decision:

Keep the refonte implementation framework-free for now.

Rationale:

The current site is still a focused prototype / marketing experience and vanilla HTML/CSS/JS enables fast, direct iteration with minimal deployment complexity.

A framework can be introduced later if the product genuinely needs shared component architecture, routing, CMS integration or a larger interactive application surface.

Do not migrate to React/Vue/etc. without an explicit reason or user request.

---

## 2026-09-03 — GitHub Pages is the default preview workflow

Decision:

GitHub Pages is the active preview/deployment environment.

URL:

`https://thinoapp.github.io/profils_sports_refonte/`

Rationale:

This removes the need for ZIP downloads and creates a direct edit → deploy → refresh workflow.

Implication:

Changes pushed to `main` should remain compatible with static GitHub Pages hosting.

---

## 2026-09-03 — Directional dart cursor replaces generic dot/ring cursor

Decision:

The custom desktop cursor should match the supplied video reference: a directional white dart rather than a circular cursor treatment.

Expected behavior:

- points in direction of mouse travel
- keeps its last heading when stopped
- follows with light inertia
- small velocity stretch
- hover scale
- click compression

Rationale:

The user specifically requested the cursor interaction from the attached video.

---

## 2026-09-03 — Native cursor fallback is mandatory

Decision:

Never hide the native cursor unless the custom cursor has been safely enabled.

Rationale:

A bug occurred where `cursor: none` was applied globally while the JavaScript cursor was gated behind a pointer media query. On some browser/device combinations this resulted in no cursor at all.

Current compatibility rules:

- prefer `(any-pointer:fine)` over only `(pointer:fine)`
- support pointermove and mousemove as needed
- restore native cursor when reduced motion / unsupported device prevents custom cursor
- custom cursor must sit above the rest of the UI

---

## 2026-09-03 — Catalogue preview becomes a localized WebGL interaction

Decision:

Apply the cursor-follow particle transition only to the `#catalogues` section. Keep the hero, horizontal solutions carousel, approach, clients and contact interactions unchanged.

Implementation:

- floating preview follows the pointer through `requestAnimationFrame` interpolation
- Three.js + custom `ShaderMaterial` + `THREE.Points` render the transition
- outgoing and incoming particle systems overlap temporally
- stable states use sharp texture planes rather than visible particle mosaics
- catalogue textures are preloaded before WebGL mode is enabled
- the existing static catalogue preview remains the fallback for touch, reduced motion, WebGL/CORS failure and keyboard use

Calibration note:

The supplied written prompt defines the required architecture and starting parameters, but the reference video for this specific particle effect has not been supplied in the current handoff. The current values are therefore an initial implementation baseline and must be calibrated against that video before claiming exact visual/timing parity.

---

## 2026-09-03 — Catalogue left column becomes a motion blueprint stage

Decision:

When the floating WebGL catalogue preview is active, the former static preview area in the left column remains occupied by an animated technical path scene rather than becoming empty.

Implementation:

- four authored SVG motion blueprints correspond to Fitness, Padel, CSP Pro and Canopy School
- each route uses animated path drawing, moving markers, technical grid/crosshair language and signal-yellow wayfinding
- the active blueprint follows the current catalogue hover/focus state
- the floating WebGL image remains independent and continues to follow the cursor
- touch / reduced-motion / WebGL fallback behavior remains unchanged

Rationale:

This fills the large negative space created by moving the catalogue image to the cursor while reinforcing the architecture / engineering / sports positioning instead of adding decorative particles or generic illustration.

---

## 2026-09-03 — Catalogue blueprint uses continuous geometry morphing

Decision:

The catalogue blueprint stage must behave as one persistent geometric system. Hovering another catalogue no longer swaps one SVG for another; the existing route continuously deforms into the next route.

Implementation:

- a single runtime SVG remains mounted for the entire catalogue interaction
- Fitness, Padel, CSP Pro and Canopy School routes are normalized into 96 equally sampled points
- each point uses spring physics and damping to converge toward the next catalogue geometry
- rapid hover changes redirect the current intermediate geometry instead of restarting an animation
- route runners and technical nodes remain attached to the living path during morphing
- the WebGL image preview remains independent and unchanged

Rationale:

This produces structural continuity: the next blueprint visually emerges from the previous one rather than appearing as a replacement or transition effect.

---

## 2026-09-03 — Hero and manifesto become one scroll-driven shared scene

Decision:

The homepage Hero and the following “De la conception à l’exploitation” section are treated as one continuous desktop scene. The Hero stays in a full-viewport coordinate system while a scroll-driven clip mask closes toward the real central media rectangle of the manifesto behind it.

Implementation:

- one normalized scroll progress drives the full transition
- the Hero is cropped with `clip-path: inset()` rather than uniformly scaled
- the manifesto already exists behind the Hero during the transition
- the final mask geometry is measured from the actual central media bounding box
- Hero video layers crossfade internally into an architectural project-plan media treatment only near the end
- manifesto grid, marker, headline, copy and three project-cycle items reveal at separate progress ranges
- the header changes theme without changing geometry
- reverse scrolling is inherently reversible because every state is derived from the same scroll progress
- mobile and `prefers-reduced-motion` retain the normal non-pinned Hero + manifesto flow

Rationale:

This creates a signature transition based on framing and continuity rather than decorative zooms, fades or page-transition effects, while translating the reference interaction into Profils Sports’ architecture / engineering language.

---

## 2026-09-03 — Intro becomes a construction curtain

Decision:

Replace the basic wordmark loader with a short branded opening sequence that behaves like the construction of a sports field and opens directly onto the Hero.

Implementation:

- architectural grid appears first
- monumental PROFILS / SPORTS lockup enters through masked typography
- signal-yellow field marking grows across the viewport
- a subtle stadium-plan ellipse reinforces the sports/infrastructure theme
- progress is shown as a restrained numeric construction indicator
- two dark architectural curtains separate and reveal the already-running Hero beneath
- the intro is capped at roughly 2.3 seconds and never waits indefinitely on media
- reduced-motion skips the sequence entirely

Rationale:

The intro should establish the brand world immediately rather than behave like a generic loading screen. The movement borrows best-practice patterns from award-winning web intros (masked type, staged graphic construction, split reveal) while keeping the visual language specific to Profils Sports.

---

## 2026-09-04 — Intro becomes a deterministic architectural impact sequence

Decision:

The pre-loader is a short, four-beat construction sequence: implantation, structure, equipment and opening play. The centred sports field is its sole visual subject; `SPORT TAKES SHAPE.` belongs exclusively to the Hero and appears only after the field has resolved into the brand mark.

Implementation:

- the sequence has a fixed 2.65-second field build, a 640ms field-to-logo resolve and a 2.36-second overlapping logo/Headline exit
- Hero video readiness never blocks the opening; its redundant telemetry label is intentionally omitted
- top metadata, the corner phase counter, the bottom phase rail, the four corner brackets and the full-screen centre axes are intentionally omitted so the scene focuses on the field blueprint and primary progress readout
- the field is centred and its six structural segments are drawn sequentially by one persistent signal-yellow cursor
- each disconnected field segment is separated by a short curved pen-up transfer; drawing pauses during that transfer so the cursor never teleports or drifts away from the line it is constructing
- the Hero shutters and typography begin only when the intro reaches its impact beat
- the loader does not repeat the Hero headline; the real Hero typography performs its only entrance beneath the opening gates
- the pre-loader root becomes transparent and non-interactive on the impact beat, allowing the opening gates to progressively expose the live Hero instead of hiding it behind an opaque root until teardown
- the pre-loader and Hero shutter timings are synchronised; supporting Hero content starts 390ms into the gates while the headline remains masked
- after placing the logo in the Header, the same cursor returns through three measured sweeps and reveals `SPORT`, `TAKES` and `SHAPE.` directly beneath its tip
- teardown occurs only after the Hero title, supporting content, flight path and logo landing have all reached their settled states
- only after the field drawing reaches 100%, its SVG geometry contracts into a proxy of the authentic Profils Sports logo
- that same logo proxy and a signal-yellow cursor share a measured SVG Bézier path to the exact header-logo geometry, including compensation for the header's opening transform
- the real header logo remains hidden until the moving proxy lands and crossfades into it, preventing a duplicate logo or visible swap
- a 512px local derivative of the authentic logo is preloaded for both the proxy and Header, avoiding a late or blank morph caused by the oversized remote source
- the same cursor that draws the field curves into the emerging logo and continues along its flight path, avoiding a cursor swap between phases
- pointer, Enter, Space or Escape can skip the intro after its opening beat
- direct hash navigation and `prefers-reduced-motion` skip the intro entirely
- no additional runtime or media dependency is introduced

Rationale:

The previous intro waited for video readiness and could block the page for almost ten seconds. Its slow progress also allowed the Hero animation to finish invisibly underneath it. The deterministic sequence is more spectacular, more coherent with the technical visual language and materially faster.

---

## 2026-09-04 — Hero becomes editorial and action-led

Decision:

Reduce the number of simultaneous visual signals in the Hero while preserving the monumental `SPORT / TAKES / SHAPE.` title and its post-preloader cursor reveal exactly as the primary signature interaction.

Implementation:

- the Hero title markup (`.hero-title .hero-line > b`) is not changed, so the intro continues to measure and reveal the real glyph geometry
- the static stadium-plan layer, repository/debug coordinates and four-cell proof strip are removed from the enhanced runtime Hero
- the brand cue is reduced to `SPORTING EXCELLENCE` + `DESIGN & CONSTRUCTION`
- supporting copy is compressed to one verified project-cycle statement
- the lower-right area becomes a clear project-start action (`CADRER LE PROJET`) with Solutions as a secondary route
- the video overlay is lighter so real media carries more of the composition
- technical drawing language is intentionally deferred to the Hero → manifesto scroll transition instead of competing with the initial Hero
- pointer interaction on the clipped Hero is enabled only while the transition stage is in its initial `hero` phase, making the CTA genuinely actionable without blocking the manifesto later

Rationale:

The previous Hero combined video, monumental type, stadium drawing, tagline, repository coordinates, four proof cells, explanatory copy and navigation at once. Removing secondary telemetry restores editorial hierarchy and makes the first screen read as one statement plus one next action rather than a collection of interface modules.

---

## 2026-09-04 — Method becomes a liquid engineering inspection surface

Decision:

Adapt the supplied NOTHIN liquid interaction specifically to the `#approach` Method visual as an inspection metaphor rather than a site-wide decorative effect.

Implementation:

- the existing project photo remains the visible surface
- a localized transparent Three.js canvas reveals an engineering blueprint only under a viscous SDF membrane driven by the pointer
- the liquid head uses damped spring motion; deposited trail geometry retracts locally instead of being pulled back toward the cursor
- a restrained Profils Sports signal-yellow meniscus marks the liquid boundary without a glow treatment
- each of the five existing Method rows changes the hidden blueprint content and geometry using verified vocabulary only
- the original blueprint remains unchanged as fallback when WebGL, a fine pointer, desktop layout or motion support is unavailable
- the renderer is scoped to the Method media, and its RAF loop suspends when off-screen or idle after the liquid trail has expired
- no touch-specific liquid simulation is enabled; mobile keeps the static authored experience

Rationale:

The reference effect is strongest when interpreted as “revealing what exists beneath the surface.” In the Method section this maps directly to Profils Sports’ positioning: the finished sports environment remains visible while the pointer exposes the engineering, feasibility, delivery and maintenance systems beneath it. Restricting the effect to one chapter preserves the hierarchy of the preloader, Hero, Solutions carousel and Catalogue interactions.

---

## 2026-09-04 — Method inspection uses hover + drag, not liquid

Decision:

Replace the localized liquid/SDF reveal in the Method / `#approach` visual with a restrained split-surface hover + drag interaction.

Implementation:

- the project photo remains the visible base layer
- a stage-specific technical drawing occupies a second full-size layer beneath it
- a one-pixel signal-yellow divider defines the boundary between `PROJET` and `INGÉNIERIE`
- hover gently previews the interaction without taking over the composition
- dragging the surface moves the divider directly and leaves the inspection position where the user releases it
- double-click resets the divider to its initial position
- each of the five Method rows still updates the technical geometry and verified labels
- no WebGL, particle simulation, fluid membrane, blur or glow is used
- reduced-motion, mobile and non-fine-pointer users retain the original static blueprint fallback

Rationale:

The liquid membrane added visual mass and made the Method feel like an effect demo rather than an engineering interface. A direct comparison gesture better communicates the intended idea: visible project on one side, underlying engineering on the other.

---

## Future decision logging

When making a change that significantly affects any of the following, add a dated entry here:

- information architecture
- visual identity
- interaction model
- technology stack
- data sourcing rules
- deployment architecture
- protected / approved user-facing behavior
