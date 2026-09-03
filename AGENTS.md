# Profils Sports Refonte — Agent Instructions

## Source of truth

The active redesign repository is:

`ThinoApp/profils_sports_refonte`

This repository is the source of truth for implementation, deployment and iteration.

The legacy/content repository is:

`ThinoApp/profils_sports`

Use the legacy repository as a source for verified business content, assets, catalogue structure and terminology. Do not modify the legacy repository unless explicitly requested.

## Project goal

Complete redesign of `profilssports.com` with a premium, international and technical positioning.

Core positioning:

**Sports Architecture × Performance Engineering × Premium Equipment**

The site should feel closer to an architectural monograph / engineering studio than to a SaaS landing page.

## Visual direction

Preserve the current V4 visual and motion language unless the user explicitly requests a new direction.

Core principles:

- monumental editorial typography
- deep architectural blue / black
- Profils Sports signal yellow `#EFE158`
- architectural paper / off-white sections
- strong real-world sports and infrastructure imagery
- asymmetric layouts
- technical blueprint / wayfinding language
- high-craft motion design
- premium editorial pacing

Avoid:

- generic SaaS cards
- uniform grids of identical rounded cards
- gradient-heavy UI
- fake glassmorphism
- generic AI-generated sports visuals
- pseudo-3D decoration without purpose
- excessive rounded corners
- generic "AI slop" aesthetics
- invented marketing claims

## Protected interactions

Do not remove or fundamentally redesign these without explicit approval:

- horizontal sticky solutions carousel
- directional mouse cursor inspired by the supplied reference video
- cinematic hero treatment
- hero drag / inspection interaction
- state-based Method scrollytelling
- architectural anchor transitions
- catalogue interaction
- blueprint / technical visual language
- FR / EN support

## Data integrity

Never invent or present as fact:

- project names
- client names
- locations
- budgets
- awards
- certifications
- visitor numbers
- satisfaction metrics
- project counts
- patent counts
- years of experience

Some legacy pages contain obvious demonstration / placeholder data. Treat those as unverified until independently validated by the user or by a trusted source.

Prefer verified content from:

- `src/constants/nos-services.tsx`
- `src/constants/nos-clients.tsx`
- `src/pages/Accueil/NosCatalogues/NosCatalogues.tsx`
- `src/pages/Accueil/ApprocheIterative/ApprocheIterative.tsx`
- real assets under `public/assets/`

## Verified service families currently used

- Accès libre
- Aménagement de sol
- Conseil & expertise
- Gymnases
- Installation & pose
- Maintenance
- Sports collectifs
- Stades

## Verified client profiles currently used

- Collectivités
- Entreprises privées
- Événementiel
- Professionnels
- Institutionnels
- Sports
- Tourisme
- Urbanisme

## Verified catalogue material currently used

The legacy repo contains structured catalogue imagery for:

- Fitness — 74 pages
- Padel — 20 pages
- CSP Pro — 4 pages
- Canopy School — 4 pages

The site also exposes discipline assets for:

- Billard
- Fitness
- Padel
- Pickleball
- Pilates
- Soccer
- Street Workout
- Tennis

## Technical direction

Current implementation is intentionally lightweight vanilla HTML / CSS / JavaScript.

Main files:

- `index.html`
- `styles.css`
- `script.js`
- `repo-data.json`

Avoid introducing a framework unless the user explicitly asks for it or the site genuinely outgrows the current architecture.

## Deployment

Primary branch:

`main`

GitHub Pages deployment is configured through GitHub Actions.

Live preview:

`https://thinoapp.github.io/profils_sports_refonte/`

Every push to `main` should trigger a new GitHub Pages deployment.

## Working procedure

Before editing:

1. Read this file.
2. Read `docs/PROJECT_CONTEXT.md`.
3. Read `docs/DECISIONS.md`.
4. Read `docs/NEXT.md`.
5. Fetch the latest version of every file you plan to modify.
6. Treat the repository contents as newer than conversation summaries if they disagree.

While editing:

- preserve existing interactions unless the task changes them
- keep responsive behavior in mind
- avoid claims that are not verified
- reuse authentic Profils Sports assets wherever possible
- make focused changes rather than rewriting unrelated areas

After editing:

1. Verify the resulting HTML / CSS / JS are internally consistent.
2. Preserve accessibility and `prefers-reduced-motion` fallbacks.
3. Update `docs/NEXT.md` when the current state or priorities change.
4. Add an entry to `docs/DECISIONS.md` when a meaningful structural or visual decision is made.
5. Mention the commit SHA in the handoff response when possible.

## Cursor interaction

The current desktop cursor is a directional white dart based on a user-supplied reference video.

Expected behavior:

- follows pointer position with light inertia
- rotates toward the movement vector
- preserves its heading when movement stops
- slightly stretches with velocity
- scales on interactive targets
- compresses on click
- falls back to the native cursor if custom cursor support cannot be safely enabled

Do not restore unconditional `cursor: none` behavior without a robust fallback.

## Current implementation status

The current redesign is V4 and is deployed through GitHub Pages.

For the latest priorities and known issues, always consult:

`docs/NEXT.md`
