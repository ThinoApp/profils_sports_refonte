# Current State / Next — Profils Sports Refonte

Last updated: 2026-09-03

## Current version

V4 redesign deployed through GitHub Pages.

Live preview:

`https://thinoapp.github.io/profils_sports_refonte/`

Primary branch:

`main`

## Recently completed

- moved the active redesign workflow to `ThinoApp/profils_sports_refonte`
- configured GitHub Pages deployment through GitHub Actions
- established repository-backed homepage content from verified legacy sources
- preserved the horizontal sticky solutions carousel
- implemented and hardened the directional dart cursor with native fallback
- added the V4 hero `DRAG TO INSPECT` experience
- made the cursor become a horizontal drag instrument inside the inspector
- added PHOTO → PLAN → STRUCTURE → SURFACE → ÉQUIPEMENTS inspection states
- added subtle multi-speed depth to the horizontal solutions carousel
- transformed the Method section into state-based sticky scrollytelling
- added architectural anchor transitions
- documented the V4 interaction decisions for future agents

## Current implementation files

- `index.html`
- `styles.css`
- `script.js`
- `repo-data.json`

## Current priorities

1. Validate V4 visually on the live GitHub Pages build, especially hero composition and cursor behavior.
2. Tune the hero inspector scale/position after testing on common desktop viewport sizes.
3. Validate the long Method scrollytelling pacing and reduce its scroll length if it feels too slow.
4. Polish responsive behavior for the hero inspector, carousel and large typography on tablet/mobile.
5. Build a proper Project / Reference page template once real verified project data is available.
6. Build a richer Catalogue detail / browsing experience using the real catalogue page sequences.
7. Continue replacing generic/legacy media with verified Profils Sports project imagery when available.

## Protected V4 interactions

Do not remove or fundamentally redesign without explicit discussion:

- horizontal sticky solutions carousel
- directional dart cursor and its native fallback
- hero drag inspector
- PHOTO → PLAN → STRUCTURE → SURFACE → ÉQUIPEMENTS state model
- Method scrollytelling
- architectural blueprint language
- signal yellow `#EFE158`

## Known issues / watch points

### Cursor

The custom cursor must only hide the native cursor after successful fine-pointer detection. V4 uses `any-pointer:fine`, pointer + mouse movement compatibility handling, and restores the native cursor when the custom cursor is unavailable.

Inside the hero inspector, the cursor changes from a directional dart into a horizontal double-arrow / drag instrument and expands while dragging.

### Hero inspector

The interaction supports pointer drag and keyboard arrows/Home/End. On reduced-motion environments the technical state is revealed without relying on motion.

The inspector currently uses existing Profils Sports imagery as its photographic base rather than fabricated project media.

### External media

The refonte still references several assets directly from `www.profilssports.com`. A later production-hardening pass should decide whether approved assets are copied locally or moved to a durable asset host.

### Data quality

Do not reuse demo content from legacy references/partners pages as factual projects, awards, budgets, certifications or client claims.

## Handoff instructions for a new conversation

Recommended opening prompt:

> Work on `ThinoApp/profils_sports_refonte`. Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/DECISIONS.md` and `docs/NEXT.md` first. The repository is the source of truth. Then fetch the latest implementation files before making changes.

If this file conflicts with the actual current repository implementation, treat the repository code and latest commits as authoritative and update this file accordingly.
