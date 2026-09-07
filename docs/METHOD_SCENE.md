# Méthode — maquette architecturale intégrée

## Direction validée

La maquette agrandie et détaillée du prototype `codex/method-three-views` (commit `aa6b44e`) est la source visuelle approuvée. La vidéo du 7 septembre inspire les cadrages continus et la révélation des éléments techniques ; ses panneaux immobiliers et ses chiffres ne sont pas reproduits.

La scène remplace le comparateur dans `#approach`, sans nouvelle section. Le Hero, le carrousel Solutions, le ruban des catalogues et le rotor 2D restent inchangés. Les trois états expérimentaux deviennent cinq étapes opérationnelles.

| Étape | État de la maquette |
| --- | --- |
| Faisabilité | Plan, implantation, tracés et accès schématiques |
| Ingénierie | Perspective et séparation des composants |
| Pilotage | Lots sol, structure et éclairage mis en évidence une fois ; sélection manuelle disponible |
| Travaux | Assemblage successif depuis la position courante des pièces |
| Maintenance | Installation assemblée ; sélection par boutons ou clic sur un élément 3D |

Les textes métier existants sont conservés. Le modèle et les annotations restent illustratifs : aucune cote d'exécution, garantie, donnée financière ou performance constructeur n'est simulée.

## Éclairage et interaction

Le bouton Éclairage commande quatre SpotLight avec ombres, les lentilles émissives et une baisse mesurée de l'éclairage ambiant. L'état est conservé entre les étapes. La vue de dessus désactive temporairement le bouton sans effacer le choix. Aucune valeur de lux, puissance ou conformité n'est affichée.

Les étapes se sélectionnent au clic, au focus ou après un court survol sur ordinateur. Les flèches et Début/Fin naviguent entre leurs boutons. Le canvas accepte le glissement horizontal, les flèches gauche/droite et Début pour recentrer. Le défilement vertical tactile reste natif. Les composants de maintenance se sélectionnent aussi sans pointage 3D, via les boutons sous la maquette.

## Fichiers et cycle de vie

- `index.html` : contenu sémantique, commandes natives et image par défaut.
- `method-scene.css` : composition desktop/mobile et états statiques.
- `method-scene.js` : cinq états, interaction, langue, rendu et repli.
- `method-model.js` : géométrie et matériaux dérivés du prototype validé, chargés à proximité de la section.
- `assets/method/{plan,engineering,assembled}.webp` : rendus locaux du modèle, pas des images générées ni des photographies de réalisations.
- `scripts/check-method.mjs` : contrôles navigateur reproductibles.

Une seule scène et un seul canvas. Les petites fixations utilisent des instances. Le ratio de pixels est plafonné à 2 sur ordinateur et 1,5 sur tactile ; les ombres des projecteurs sont limitées à 512 px. Le rendu s'arrête au repos, hors écran, dans un onglet caché et derrière le catalogue. Les transitions reprennent depuis les positions courantes et se figent hors écran ; aucun mouvement automatique permanent.

Avec mouvement réduit, les changements spatiaux et d'éclairage sont immédiats. Sans WebGL ou en cas d'échec de chargement, les étapes et explications restent utilisables avec les images locales ; les contrôles purement 3D sont masqués. Sans JavaScript, les cinq explications restent affichées. Une perte de contexte WebGL restaure l'image puis reconstruit la scène si le contexte revient.

Les anciens fichiers `approach-drag-inspection.*` restent dans l'historique de travail mais ne sont plus chargés. Le prototype expérimental n'est pas inclus dans cette branche d'intégration.

## Vérification

Lancer un serveur statique à la racine : `python3 -m http.server 8766`.

Avec Playwright installé dans l'environnement de vérification :

```sh
node scripts/check-method.mjs
```

Variables optionnelles : `PLAYWRIGHT_MODULE` (module Playwright absolu), `CHROME_PATH`, `METHOD_URL` et `METHOD_CAPTURES`. Le test injecte uniquement dans son navigateur l'instrumentation de comptage des images et d'inspection de la scène ; aucun état de diagnostic global n'est exposé par le site.

Couverture : les cinq étapes, interruption de l'assemblage, sources lumineuses, préférence d'éclairage conservée, clavier, FR/EN, pause au repos et derrière le catalogue, repli et restauration de contexte, mobile, mouvement réduit, WebGL absent et JavaScript désactivé. Le rendu et la fluidité sur Safari/iPhone physique restent à valider sur appareil.
