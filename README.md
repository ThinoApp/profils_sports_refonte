# Profils Sports International — Redesign Concept V3

Static HTML/CSS/JS prototype preserving the V2 editorial / sports-architecture direction while replacing generic or invented content with data extracted from the private `ThinoApp/profils_sports` repository.

## Run
Open `index.html` directly, or serve the directory locally:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## What changed from V2
- Hero now uses the real repository video asset (`video3.mp4`) via the deployed Profils Sports domain.
- Horizontal scroll carousel is preserved and expanded to the 8 real service families.
- Catalogue module now uses the 4 actual catalogue datasets and their real cover thumbnails: Fitness, Padel, CSP Pro, Canopy School.
- Added 8 real sport discipline assets from the repository.
- Added repository-backed iterative project approach (feasibility, Eurocodes, CAPEX/OPEX, HSE, DOE, construction).
- Added the 8 client profiles defined in the product constants.
- Replaced illustrative/fake metrics with derived repository counts only.
- Kept FR/EN toggle, custom cursor, magnetic controls, scroll progress, horizontal motion and reduced-motion support.

See `REPO-DATA-AUDIT.md` for what was used and what was deliberately excluded as placeholder/demo content.
