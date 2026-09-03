# Current State / Next — Profils Sports Refonte

Last updated: 2026-09-03

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
