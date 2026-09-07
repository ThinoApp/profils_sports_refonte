# Où la 3D est utile — analyse du 7 septembre 2026

## Décision actuelle

Le rotor des disciplines revient en 2D à la demande de l'utilisateur. Le logo original est affiché comme une image PNG transparente, déclinée en 3072 px et 1024 px sans recoloration ni reconstruction de ses contours. Sa rotation, les huit disciplines et les liens vers les catalogues restent fonctionnels. Cette itération n'ajoute aucune nouvelle scène 3D.

Le diagnostic visuel est aussi éditorial : les petites inscriptions du logo sont faites pour être lues à plat. Les extrusions, les reflets et la perspective ajoutaient des contours et du mouvement sans aider à choisir un catalogue.

## Lecture du site actuel

L'analyse s'appuie sur `index.html`, `hero-manifesto-transition.js`, `site-motion.js`, `approach-drag-inspection.js`, `catalogue-ribbon.js` et les sources métier documentées dans PROJECT_CONTEXT.

| Emplacement | Usage possible | Avis |
| --- | --- | --- |
| Méthode, visuel à droite des cinq étapes (`#approach`) | Maquette d'un équipement sportif qui passe du plan à l'assemblage et à l'entretien | Priorité : la profondeur aide à comprendre le métier |
| Solutions, « Aménagement de sol » ou « Installation & pose » | Coupe de revêtement ou assemblage éclaté d'un équipement réel | Très pertinent sur une future fiche détaillée, une fois les données techniques disponibles |
| Manifeste, « De la conception à l'exploitation » | Passage du plan plat à une maquette architecturale | Alternative de placement à la Méthode, pas une deuxième scène identique |
| Détail des catalogues | Ruban 3D déjà présent pour parcourir les pages | Garder son rôle actuel ; ajouter un objet 3D par page nuirait à la lecture |
| Hero et préloader | Volume architectural accompagnant le dessin du terrain | Faible priorité : vidéo, construction au curseur et titre ont déjà leur chorégraphie |
| Rotor, Clients, Contact | Objets ou logos tournants | Aucune valeur explicative suffisante pour justifier une nouvelle scène |

## Proposition prioritaire : une maquette de projet dans la Méthode

Utiliser l'emplacement actuel du visuel technique. Une seule maquette persiste pendant le passage entre les cinq étapes. Un terrain de padel est un candidat reconnaissable, avec catalogue authentique disponible ; le choix final et les éléments représentés doivent correspondre aux références retenues.

Direction visuelle : vue de trois quarts en projection orthographique, volumes mats couleur papier, ossature bleu profond, détails actifs en jaune signal, éclairage doux et ombres de contact. Les arêtes sont propres, les matériaux sobres et l'échelle lisible. Le plan technique initial sert de base à la montée des volumes.

1. **Faisabilité :** empreinte au sol, accès et implantation apparaissent sur le plan.
2. **Ingénierie :** la structure s'élève ; une séparation mesurée des composants explique leur assemblage.
3. **Pilotage :** la maquette reste stable et met en évidence les lots concernés. Le texte porte l'explication administrative et financière, sans chiffres ni graphiques inventés.
4. **Travaux :** les composants s'assemblent dans une séquence de pose lisible.
5. **Maintenance :** quelques zones inspectables sont mises en évidence et liées aux descriptions de maintenance.

Le moment spectaculaire serait la transformation continue du dessin en volume assemblé. Le mouvement explique une construction. Il ne nécessite pas une rotation automatique permanente.

Interaction proposée : survol, focus ou clic des étapes existantes ; clic sur mobile. Les changements rapides reprennent depuis l'état courant. La caméra conserve un angle stable et les retours entre étapes restent possibles. Éviter d'ajouter un second long défilement bloqué après le carrousel Solutions.

Le comparateur actuel photo/dessin et son curseur constituent un acquis à préserver. Une future intégration doit définir la relève du dessin vers la maquette à l'intérieur de cette surface, sans empiler plusieurs interactions concurrentes. Ce changement de la Méthode reste une proposition.

## Production et contenu nécessaires

Aucun modèle GLB/GLTF/OBJ/FBX/STL n'a été trouvé dans le dossier public du site legacy inspecté. Les photos et catalogues servent de références, pas de modèles 3D prêts à l'emploi.

Pour une représentation fidèle : utiliser un modèle fabricant ou construire un modèle à partir de plans et détails validés. Une première maquette conceptuelle peut rester volontairement schématique, explicitement présentée comme illustration de la méthode. Ne pas lui attribuer un nom de réalisation, des dimensions, une certification ou des performances non vérifiées.

Si cette proposition est retenue : chargement à l'approche de la section, une seule scène Three.js locale, arrêt hors écran et au repos, géométrie et textures dimensionnées pour le mobile. Prévoir une vue statique lisible si WebGL est indisponible et des états sans animation pour la réduction des mouvements. La fluidité doit être validée sur un téléphone réel.

## Suite recommandée

Commencer par un cadrage et un modèle de la maquette Méthode, puis valider trois états représentatifs : plan, assemblage éclaté, équipement terminé. Cela permet de juger la lisibilité, les proportions et l'intérêt de la 3D avant de développer les cinq transitions. Le ruban catalogue reste la seule autre expérience 3D majeure.
