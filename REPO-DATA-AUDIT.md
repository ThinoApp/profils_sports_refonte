# Profils Sports — Repository data audit used in V3

## Sources considered reliable enough to surface in the concept

### `src/constants/nos-services.tsx`
Eight service families used directly in the horizontal carousel:
- Accès libre
- Aménagement de sol
- Conseil & expertise
- Gymnases
- Installation & pose
- Maintenance
- Sports collectifs
- Stades

Their detailed scopes were preserved (fitness areas, street workout, EPDM, SBR, turf, line marking, stands, football, basketball, etc.).

### `src/constants/nos-clients.tsx`
Eight client profiles used directly:
- Collectivités
- Entreprises privées
- Événementiel
- Professionnels
- Institutionnels
- Sports
- Tourisme
- Urbanisme

### `src/pages/Accueil/NosCatalogues/NosCatalogues.tsx`
Four concrete catalogue datasets are wired to real repository asset sequences:
- Fitness — Performance — 74 pages
- Padel — Sports de raquette — 20 pages
- CSP Pro — Outdoor — 4 pages
- Canopy School — Education — 4 pages

Total: **102 catalogue pages**.

The same component exposes eight visual sport icons:
Billard, Fitness, Padel, Pickleball, Pilates, Soccer, Street Workout, Tennis.

### `src/pages/Accueil/ApprocheIterative/ApprocheIterative.tsx`
Used to build the project-life-cycle section:
- Conception stratégique & faisabilité
- Conception sur mesure & ingénierie normée
- Pilotage administratif & financier
- Réalisation des travaux

Concrete vocabulary retained where present in source: ERP, accessibilité, sécurité incendie, Eurocodes, CAPEX/OPEX, HSE, DOE.

### Asset directories
- `public/assets/video/video1.mp4`
- `public/assets/video/video2.mp4`
- `public/assets/video/video3.mp4`
- `public/assets/img/slide-1.jpeg`
- `public/assets/img/slide-2.jpg`
- `public/assets/img/slide-3.jpeg`
- `public/assets/CATALOGUES*`
- `public/assets/icons/*`
- `public/assets/images/*`

V3 deliberately uses the deployed Profils Sports asset URLs rather than AI-generated imagery for its key brand moments.

## Repository content intentionally excluded from factual marketing claims

### `src/pages/References/index.tsx`
Contains obvious placeholder/demo data: generic `/api/placeholder` images, example projects in Lyon/Paris/Bordeaux/etc., budgets, awards and testimonials. These were **not** treated as real Profils Sports references.

### `src/pages/Partenaires/index.tsx`
Contains example partner names, Unsplash logos, placeholder domains and `555` phone data. Not used as real partner data.

### `src/pages/Concepteur/index.tsx`
Contains large unverified claims such as project counts, patents, satisfaction rates, ISO certifications and example projects. Not surfaced in V3.

### `src/pages/Accueil/Actu/Actu.tsx`
News copy appears to be editorial/demo content (including a bicycle range). Not surfaced as current factual news.

## Design principle

V3 keeps the V2 editorial/architectural visual world and horizontal scroll carousel, but replaces invented proof with repository-backed product/service/catalogue information. Real client project references should be added only once a verified dataset and real project photography are available.
