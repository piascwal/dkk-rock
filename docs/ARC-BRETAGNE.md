# Arc breton (en cours : étapes 1 et 2 faites)

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

1. ✅ Thèmes `foret`, `port`, `groix` (décors `sousbois`, `quais`, `falaises` : `src/rendu/fonds-bretagne.ts`) et les trois
   niveaux (`outils/niveaux/plans.py`, cartes `07-foret.ts`, `08-port.ts`, `09-groix.ts`). Ennemis de la tournée en attendant
   bigoudens, marins et goélands.
2. ✅ Arc « Breizh Tour » dans `arcs.ts` (ouvert après le Club Infini), épilogue `src/histoire/fin-bretagne.ts`. Sur la carte
   du monde : menhirs, dolmens, chênes, pentys, chalutiers, phares ; Groix est une île à part, séparée par un détroit que la
   route franchit en sillage de ferry. L'écran de la carte permet de passer d'un arc ouvert à l'autre (bouton ⇄).
3. Menhirs et dolmens en décor programmatique.
4. Goéland : déplacement en vol, attaque en piqué, rattaché à la région bretonne uniquement.
5. Phase ferry : défilement automatique, vagues d'ennemis par les côtés, bastingage.
6. Bigoudens et marins, avec leurs instruments comme armes, une fois les sprites reçus.

## Idées de gameplay à valider

- Sur le ferry : recharger le canon à un poste fixe, en alternance avec la défense au centre.
- Dans la forêt : une lumière qui se déplace, et les ennemis apparaissent en dehors du halo.
