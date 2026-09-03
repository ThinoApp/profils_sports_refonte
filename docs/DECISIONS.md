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

## Future decision logging

When making a change that significantly affects any of the following, add a dated entry here:

- information architecture
- visual identity
- interaction model
- technology stack
- data sourcing rules
- deployment architecture
- protected / approved user-facing behavior
