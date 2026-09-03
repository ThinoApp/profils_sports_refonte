# Project Context — Profils Sports Refonte

## Overview

This repository contains the active redesign of `profilssports.com`.

The redesign started as an exploration in Figma, then moved to a direct HTML / CSS / JavaScript implementation because the user wanted a highly animated, production-like prototype that could be iterated quickly.

The current active implementation is V4.

Active repository:

`ThinoApp/profils_sports_refonte`

Legacy/content repository:

`ThinoApp/profils_sports`

Live GitHub Pages preview:

`https://thinoapp.github.io/profils_sports_refonte/`

## User expectations

The user explicitly wants:

- bold and premium visual design
- unusually strong motion design
- direct implementation, not only recommendations
- authenticity based on real company data and assets
- avoidance of generic AI-generated visual language
- preservation of the horizontal carousel introduced in V2
- fast iteration directly through GitHub so ZIP downloads are no longer necessary

## Brand / art direction

Core creative direction:

**Architecture sportive × Ingénierie de performance × Équipement premium**

The desired personality is:

- precise
- monumental
- technical
- international
- physical
- editorial

The site should feel like an architecture studio / engineering company, not a SaaS template.

### Current palette

- Deep architectural ink: around `#091521`
- Secondary dark: around `#0E202B`
- Signal Yellow: `#EFE158`
- Architectural Paper: around `#F1EFE6`
- White: `#FFFFFF`

Yellow should behave like technical signage / wayfinding rather than decorative glow.

### Typography

Current implementation uses:

- Barlow Condensed for monumental headlines / numbers
- Archivo for body text and UI

This direction was chosen because it feels editorial, architectural and technical.

## Important design references / lessons

Research was previously done across Awwwards, Framer, Webflow and Land-book.

Key lessons retained:

- project photography should carry the experience
- typography should be editorial and confident
- negative space matters
- sections should not all be equal cards
- navigation and motion rhythm should feel authored
- real project case studies should eventually become central

An architecture-studio / monograph feel was considered a stronger fit than nightlife, music or SaaS aesthetics.

## Legacy site audit findings

The current/legacy site positions Profils Sports around high-performance sports infrastructure and equipment.

Verified/observed brand phrases include:

- Profils Sports International
- Sporting Excellence
- Design & Construction
- High-performance sports infrastructure

The old hero used a generated image from Readdy AI. That was considered a major credibility issue for a physical infrastructure / engineering brand.

The redesign therefore avoids leaning on synthetic hero imagery and instead uses real assets already present in the legacy repository, including video.

The legacy site also has inconsistent language metadata and some routes that have historically surfaced as broken/404. Those issues should be treated as part of the redesign cleanup.

## Information architecture direction

Recommended simplified top-level architecture:

- Projects
- Solutions
- Expertise
- Company
- Contact

Current V4 homepage is still a single-page prototype rather than the final multi-page architecture.

## Verified service data from the legacy repo

From `src/constants/nos-services.tsx`:

### Accès libre

- Aires de fitness
- Street workout
- Pumptrack
- Skatepark
- Terrains multisports

### Aménagement de sol

- BtoB
- EPDM
- SBR
- Gazons synthétiques
- Mulch
- Vente en gros
- Pose

### Conseil & expertise

- Aménagements design
- Sport
- Développement
- Innovation

### Gymnases

- Traçage
- Tribunes
- Installation et aménagement
- Maintenance

### Installation & pose

- Équipements et aménagements sports et loisirs

### Maintenance

- Aire de jeux pour enfants
- Matériel sports et loisirs
- Gymnase et stades

### Sports collectifs

- Football
- Basket-ball
- Handball
- Rugby
- Volley-ball

### Stades

- Installation et aménagement
- Tribunes
- Sièges de stade
- Tunnel d'accès

## Verified client segments from the legacy repo

From `src/constants/nos-clients.tsx`:

### Collectivités

- Communes
- Bases de loisirs
- Centres sportifs

### Entreprises privées

- Grandes enseignes
- Comités d’entreprise
- Centres commerciaux

### Événementiel

- Agences de communication
- Annonceurs

### Professionnels

- Clubs sportifs
- Associations sportives
- Fédérations sportives

### Institutionnels

- Hôpitaux
- Grandes écoles
- Universités
- Casernes

### Sports

- Clubs
- Associations
- Fédérations

### Tourisme

- Hôtels
- Campings
- Centre de vacances

### Urbanisme

- Ateliers d’architectes
- Maîtres d’œuvre
- Paysagistes

## Catalogue material in the legacy repo

The legacy repo contains actual catalogue page sequences used by the homepage catalogue component:

- Fitness — 74 pages
- Padel — 20 pages
- CSP Pro — 4 pages
- Canopy School — 4 pages

Total currently represented in V3: 102 catalogue pages.

There are also discipline icons/assets for:

- Billard
- Fitness
- Padel
- Pickleball
- Pilates
- Soccer
- Street Workout
- Tennis

The legacy repo also contains older generic catalogue labels such as:

- GAMES
- TRAINING
- STREETWORK
- CHILDS
- LIGHTING
- EQUIPMENTS
- URBAN
- ILLUMINATIONS

These labels may be useful as historical taxonomy, but should not automatically override the cleaner service architecture used in the redesign.

## Technical / engineering content from the legacy repo

One of the most valuable content sources is `src/pages/Accueil/ApprocheIterative/ApprocheIterative.tsx`.

It provides significantly stronger business substance than generic marketing copy.

Verified themes include:

### Conception stratégique & faisabilité

- analyse des besoins et objectifs d'exploitation
- études de faisabilité
- urbanisme
- ERP
- accessibilité
- sécurité incendie
- conception architecturale
- dimensionnement
- intégration des systèmes
- coordination réglementaire
- optimisation économique

### Conception sur mesure & ingénierie normée

- traduction des objectifs client en solutions techniques
- personnalisation des structures, revêtements et équipements
- ingénierie structurelle conforme aux Eurocodes
- solutions propriétaires et modulaires
- industrialisation

### Pilotage administratif & financier

- dossiers administratifs
- conformité ERP
- structuration contractuelle
- garanties
- budget global
- tableaux de bord
- arbitrages
- flux financiers
- fiscalité
- reporting
- CAPEX / OPEX

### Réalisation des travaux

- préparation chantier
- planification
- coordination des entreprises
- installation des équipements
- contrôle qualité
- sécurité
- conformité
- réception
- essais
- DOE
- HSE

This content is currently used to create the technical / blueprint visual language of V3.

## Media / asset findings

The legacy repo contains:

- logos under `public/assets/images/`
- catalogue imagery
- brochure imagery
- discipline icons
- three MP4 videos under `public/assets/video/`

The legacy homepage defines:

`/assets/video/video3.mp4`

as its hero video.

Other carousel components use:

- `video1.mp4`
- `video2.mp4`

The redesign currently references the live Profils Sports asset URLs rather than duplicating heavy media into the refonte repository.

## V3 homepage structure

The current V3 includes:

1. cinematic video hero
2. repository-backed proof strip
3. manifesto / positioning section
4. horizontal sticky solutions carousel
5. catalogue section using real catalogue cover assets
6. discipline / icon content
7. technical approach / blueprint section
8. client profiles
9. contact / CTA area
10. bilingual FR / EN interactions

## Horizontal carousel

The horizontal sticky solutions carousel is a protected interaction because the user explicitly likes it.

Current behavior:

- section is very tall in document flow
- inner content is sticky for one viewport
- vertical scroll drives horizontal translation
- left-side title / context remains anchored
- right-side solution panels move horizontally
- progress line reflects scroll progress

Do not casually replace this with a normal slider or a generic card grid.

## Directional cursor

The user supplied a reference video showing a custom mouse cursor.

The intended cursor is:

- a small white directional dart
- rotates according to pointer travel direction
- keeps last heading when movement stops
- has light positional inertia
- slightly stretches under speed
- scales on hover targets
- compresses on pointer down

A compatibility bug was found because CSS hid the native cursor unconditionally while JavaScript depended on `(pointer:fine)`.

The current implementation was fixed to:

- use `(any-pointer:fine)`
- restore native cursor when custom cursor is not safe to enable
- support both `pointermove` and `mousemove`
- force a high z-index for the custom cursor

Do not remove that fallback.

## Data quality warnings

Several legacy pages contain likely placeholder/demo content.

Examples include pages that define projects such as fictional city infrastructure, artificial budgets, invented client testimonials, awards, certifications, satisfaction values or partner brands.

Treat these as unverified.

Do not migrate them into the redesign unless the user confirms them.

Especially avoid presenting as fact:

- made-up stadium / aquatic project names
- project budgets
- visitor numbers
- satisfaction percentages
- awards
- ISO certifications
- FIFA / Olympic certifications
- patent counts
- fabricated partner organizations

## Current deployment workflow

GitHub Pages is configured using GitHub Actions.

A workflow exists under:

`.github/workflows/deploy-pages.yml`

The user manually enabled GitHub Pages with GitHub Actions as the source.

Current working loop:

1. agent reads latest repository state
2. agent edits files directly in GitHub
3. commit to `main`
4. GitHub Pages deploys automatically
5. user refreshes the public preview URL

This replaces the previous ZIP-download workflow.

## Implementation philosophy

Keep the current codebase simple while it remains effective.

Prefer:

- focused HTML
- authored CSS
- lightweight JavaScript
- no unnecessary framework
- no heavy dependency stack
- real assets
- strong motion with graceful fallbacks

If the project grows into multiple rich pages with shared components and data-heavy interactions, a framework migration can be discussed later, but should not be introduced implicitly.


## V4 motion system

V4 keeps the approved V3 visual world and adds a more state-driven motion grammar inspired by the interaction principles observed on Heron AI, without copying its visual identity.

Key additions:

- a hero drag inspector that moves through PHOTO → PLAN → STRUCTURE → SURFACE → ÉQUIPEMENTS
- the directional cursor becomes a horizontal drag instrument inside the inspector
- the solutions carousel keeps its protected horizontal sticky behavior and adds subtle multi-speed depth between media, copy and numbering
- the Method section becomes a long sticky scrollytelling sequence where the technical project builds across five verified lifecycle states
- anchor navigation uses a short architectural blue-black wipe with a signal-yellow construction line
- motion remains disabled or simplified under `prefers-reduced-motion`
- the native cursor fallback remains mandatory when the custom cursor cannot safely run

The interaction system should remain purposeful: motion communicates project state, inspection, progression or navigation rather than adding decorative effects.
