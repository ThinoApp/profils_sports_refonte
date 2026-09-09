# Solutions — architectural maquette

September 9, 2026. Replaces the approved former horizontal photo carousel only within `#solutions`. Published on the official OVH-hosted site the same day.

## Visitor experience

A left-hand menu chooses the métier. The same large model transforms alongside it; scrolling never selects a different service. Controls below the model explain its components and offer a reversible animated top view. On mobile the maquette stays above the menu, except on short screens where ordinary document flow takes priority.

| Métier | What the visitor sees |
| --- | --- |
| Stades | Pitch, goals, instanced seats, stepped stands and an open access tunnel |
| Sports collectifs | Shared playing surface with basketball equipment and a central net |
| Accès libre | Workout bars, ladder modules and an undulating pumptrack |
| Gymnases | Columns, roof trusses and a half-clad roof exposing the interior |
| Aménagement de sol | Three separated illustrative layers, explicitly not a construction recipe |
| Installation & pose | The surface, equipment, frame and roof separate, pause, then assemble |
| Maintenance | Assembled structure with a single inspection sweep and selectable components |
| Conseil & expertise | Structural outlines and relationships across the whole model |

The technical shapes support the verified service copy from the existing page/legacy service taxonomy. No dimensions, certifications, project references or performance claims are introduced. This is a study model, not a supplier CAD model.

## Ownership

- `index.html`: semantic service menu, model region, explanations and illustrative disclaimer.
- `solutions-scene.css`: scoped V3 styling, desktop two-column composition and touch/short-screen layout.
- `solutions-model.js`: scene, materials, modular geometry, state destinations and one deforming yellow tube.
- `solutions-scene.js`: lazy initialization, interruption-safe state transitions, mouse inspection, native controls, translation and lifecycle.
- `assets/solutions/0.png` … `7.png`: fallback renders of the actual same Three.js model. No photos or external textures.
- `scripts/check-solutions.mjs`: Chromium regression checks and optional still capture.

The old horizontal scripts remain guarded by their original opt-in DOM attributes, which this section no longer supplies. No framework or additional Three.js copy is introduced. Hero, Method, globe and catalogue remain independent.

## Motion and fallbacks

Destination interpolation starts from a snapshot of the current component and camera state. A direct jump cancels the obsolete installation sequence. The yellow tube retains its vertex topology across states. Four hundred-plus seat/back instances share two meshes. Shadows use a capped map; DPR is capped at 1.5. Pointer tilt is subtle, not free auto-rotation. Rendering sleeps after the focal sequence settles and suspends offscreen or behind the catalogue.

Reduced motion shows final/static configurations immediately; Installation intentionally stays exploded to retain the explanation. No WebGL or lost context restores the corresponding local still while keeping menu/part explanations usable. Context restoration rebuilds the currently selected state and discards stale transitions. Without JavaScript all service paragraphs remain visible.

## Checks

Start the project's static server, then run:

```sh
node scripts/check-solutions.mjs
```

Optional environment variables: `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `SOLUTIONS_URL` (default `http://127.0.0.1:8767/`), `SOLUTIONS_CAPTURES` (default `/tmp/profils-solutions-check`). Set `SOLUTIONS_CAPTURE_STILLS=1` only when intentionally regenerating the committed model stills from the browser.

The script checks all eight configurations, persistent model identity, interrupted transitions, complete installation, maintenance sweep, keyboard navigation, FR/EN, top view, non-captured scrolling, idle/modal/offscreen suspension, real WebGL context loss/recovery, touch/mobile, reduced motion, absent WebGL and absent JavaScript.

September 9 verification: this suite and the existing Hero, globe/catalogue and Method suites pass in headless Chromium. Desktop/mobile renders inspected. Fixed stale animation state after real context recovery and stale component explanations on a menu change. The Method test's interruption measurement is now atomic; its runtime was not changed.

Physical Safari/iPhone GPU smoothness remains an on-device validation task; software-GPU browser tests do not establish real-device frame rate.
