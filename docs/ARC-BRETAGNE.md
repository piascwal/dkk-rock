# Arc breton (à faire)

Un arc à part, ouvert après la fin de l'arc principal, en trois niveaux.

## Décisions (retenues avec le client)

- **Ferry :** phase de défense en défilement. Le ferry avance seul vers la droite ; le héros reste sur le pont et se défend
  contre des vagues de bigoudens et de marins qui arrivent par les côtés et par la mer.
- **Goéland :** remplace le drone à LED, **dans l'arc breton seulement** (les niveaux existants gardent leur drone).
- **Arc :** un arc à part sur la carte du monde, avec le même principe que les arcs existants (`src/niveaux/arcs.ts`).

## Niveaux

1. **La forêt** (thème « forêt mystique », sans prononcer le nom de la forêt) : sous-bois, brume, menhirs, dolmens, goélands.
2. **Le port** (ville portuaire) : on y prend le ferry ; la traversée est la phase de défense.
3. **Groix** : l'île, avec ses marins et ses bigoudens.

## Assets

- **Générés programmatiquement en premier :** menhirs et dolmens (décor dessiné en code, `decor-accessoires.ts`), en attendant
  les sprites du client.
- **Attendus du client :** bigoudens et marins avec leurs instruments (utilisés comme armes), et deux sprites de goéland
  (en vol, et en piqué).

## Étapes (dans l'ordre)

1. Thème `bretagne` (couleurs, fonds, ciel) et les trois niveaux en carte ASCII, avec `outils/genere-niveaux.py`.
2. Entrée de l'arc dans `arcs.ts` et la carte du monde (`src/rendu/carte-monde.ts`) : une région par décor.
3. Menhirs et dolmens en décor programmatique.
4. Goéland : déplacement en vol, attaque en piqué, rattaché à la région bretonne uniquement.
5. Phase ferry : défilement automatique, vagues d'ennemis par les côtés, bastingage.
6. Bigoudens et marins, avec leurs instruments comme armes, une fois les sprites reçus.

## Idées de gameplay à valider

- Sur le ferry : recharger le canon à un poste fixe, en alternance avec la défense au centre.
- Dans la forêt : une lumière qui se déplace, et les ennemis apparaissent en dehors du halo.
