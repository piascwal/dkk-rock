# Arc breton (en cours : étapes 1 et 2 faites)

Un arc à part, ouvert après la fin de l'arc principal, en trois niveaux.

## Décisions (retenues avec le client)

- **Ferry :** phase de défense en défilement. Le ferry avance seul vers la droite ; le héros reste sur le pont et se défend
  contre des vagues de bigoudens et de marins qui arrivent par les côtés et par la mer.
- **Goéland :** remplace le drone à LED, **dans l'arc breton seulement** (les niveaux existants gardent leur drone).
- **Arc :** un arc à part (son titre, son épilogue), mais sur la même carte du monde : on y progresse après le Club Infini.

## Niveaux

1. **La forêt** (thème « forêt mystique », sans prononcer le nom de la forêt) : sous-bois, brume, menhirs, dolmens, goélands.
2. **Le port** (ville portuaire) : on y prend le ferry ; la traversée est la phase de défense.
3. **Groix** : l'île, avec ses marins et ses bigoudens.

## Assets

- **Menhirs :** sprite fourni (un seul reçu). **Dolmens :** dessinés en code (`decor-accessoires.ts`), pas encore de planche.
- **Attendus du client :** bigoudens et marins avec leurs instruments (utilisés comme armes), et deux sprites de goéland
  (en vol, et en piqué).

## Étapes (dans l'ordre)

1. ✅ Thèmes `foret`, `port`, `groix` (décors `sousbois`, `quais`, `falaises` : `src/rendu/fonds-bretagne.ts`) et les trois
   niveaux (`outils/niveaux/plans.py`, cartes `07-foret.ts`, `08-port.ts`, `09-groix.ts`). Ennemis de la tournée en attendant
   bigoudens, marins et goélands.
2. ✅ Arc « Breizh Tour » dans `arcs.ts` (ouvert après le Club Infini), épilogue `src/histoire/fin-bretagne.ts`. Une seule
   carte du monde pour tous les arcs (`MONDE` dans `arcs.ts`) : la route continue après le Club Infini vers l'est (menhirs,
   dolmens, chênes, pentys, chalutiers, phares), et Groix est une île à part, séparée par un détroit que la route franchit en
   sillage de ferry. Après l'épilogue de la tournée, le van roule directement vers la forêt.
3. ✅ Menhirs (sprite fourni, `assets-sources/decor/menhir-1-base.png`) et dolmens (dessinés en code) semés dans la forêt et sur Groix.
4. Goéland : déplacement en vol, attaque en piqué, rattaché à la région bretonne uniquement.
5. Phase ferry : défilement automatique, vagues d'ennemis par les côtés, bastingage.
6. Bigoudens et marins, avec leurs instruments comme armes, une fois les sprites reçus.

## Idées de gameplay à valider

- Sur le ferry : recharger le canon à un poste fixe, en alternance avec la défense au centre.
- Dans la forêt : une lumière qui se déplace, et les ennemis apparaissent en dehors du halo.
