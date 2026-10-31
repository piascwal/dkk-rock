# dkk-rock — notes pour Claude

Lire le README avant toute modification.

- Avant de proposer un changement : `npm run typecheck && npm run lint && npm run format:check && npm test`.
- Aucun fichier au-delà de 300 lignes de code (ESLint `max-lines`). Tout en français : code, commentaires, textes.
- La simulation (`src/jeu`, `src/entites`, `src/monde`) ne touche jamais au DOM : elle tourne aussi dans les tests.
- Le rendu ne lit que la vue (`EtatVue`), jamais les objets de la simulation : c'est ce qu'ont les clients distants.
- Un niveau modifié doit rester atteignable : le test `niveaux.test.ts` le vérifie.
- Refaire ou créer un niveau : suivre `docs/LEVEL-DESIGN.md` (le vide plutôt que le mur, les passerelles en haut, descendre par le terrain).
- Changer le format réseau (`src/reseau/protocole.ts`) : augmenter `VERSION_PROTOCOLE`.
- `@piascwal/lan-kit` est figé sur une étiquette ; d'autres jeux en dépendent : ne rien y changer pour ce jeu.
- Un nouvel arc ou un nouveau thème : faire évoluer la carte du monde (`src/rendu/carte-monde.ts`, une région par décor).
