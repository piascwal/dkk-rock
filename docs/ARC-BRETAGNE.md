# Arc breton (en cours : étapes 1 et 2 faites)

Un arc à part, ouvert après la fin de l'arc principal, en trois niveaux.

## Décisions (retenues avec le client)

- **Ferry :** phase de défense en défilement. Le ferry avance seul vers la droite ; le héros reste sur le pont et se défend
  contre des vagues de bigoudens et de marins qui arrivent par les côtés et par la mer.
- **Goéland :** remplace le drone à LED, **dans l'arc breton seulement** (les niveaux existants gardent leur drone).
- **Arc :** un arc à part (son titre, son épilogue), mais sur la même carte du monde : on y progresse après le Club Infini.

## Niveaux

1. **La forêt** (thème « forêt mystique », sans prononcer le nom de la forêt) : sous-bois, brume, menhirs, dolmens, goélands.
2. **Le port** (ville portuaire) : il finit par le van, au bout du quai.
3. **La Traversée** : le ferry, un niveau à part (la phase de défense), entre le port et Groix ; rejouable depuis la carte.
4. **Groix** : l'île, avec ses marins et ses bigoudens.

Ordre de l'arc : forêt, port, traversée, Groix (`arcs.ts`). La traversée est le niveau 9 de la liste (ajouté à la fin pour ne pas
décaler les sauvegardes), mais vient avant Groix dans l'arc.

## Assets

- **Reçus (lot 22, `assets-sources/breton/`, 256 × 256) :** `bigouden-biniou.png`, `bigouden-harpe.png`,
  `bigouden-harpe-2.png` (bigoudènes avec leur instrument), `marin-accordeon.png`, `marin-clarinette.png` (marins), et les
  deux poses du goéland : `goeland-vol.png`, `goeland-pique.png`. Pas encore branchés (voir étapes 4 et 6).

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
4. ✅ Goéland (lettre `g`, genre `GOELAND`) : il plane au-dessus du héros, pique sur lui (son attaque, image de piqué), puis remonte. Il ne vit que dans les niveaux bretons ; le protocole passe en version 10 (nouveau genre).
5. ✅ Phase ferry, dans son propre niveau « La Traversée » (`10-ferry`, ni danseurs ni lanceurs : leurs explosions creuseraient le pont) : la pièce `ferry` du générateur (`outils/niveaux/ferry.py`) pose un quai, le repère
   `&` d'embarquement, un pont de bois de 24 tuiles, la proue et le van. Quand tous les héros sont à bord
   (`src/jeu/traversee.ts`), le pont se ferme derrière eux, cinq vagues montent à l'abordage par les deux côtés (marins,
   bigoudènes, goélands ; un pont vide fait venir la suivante plus tôt), puis la porte (à 19 tuiles du repère) s'ouvre sur le
   van. Le monde ne bouge pas : `EtatVue.traversee` transporte le temps de traversée et le fond défile (protocole version 13).
   Un héros qui réapparaît en pleine traversée revient sur le pont.
6. Bigoudènes ✅ (lettre `h`, genre `BIGOUDEN`, trois apparences tirées au sort ; elles gardent leurs distances et jouent un air de trois notes, puis soufflent ; protocole version 11). Marins ✅ (lettre `m`, genre `MARIN`, deux apparences, accordéon et clarinette ; ils foncent au corps-à-corps, frappent de leur instrument et ont un coup de reins toutes les 100 images ; au port et sur Groix seulement ; protocole version 12). Les trois ennemis bretons sont branchés ; restent la phase ferry (étape 5) et les niveaux à affiner.

## Idées de gameplay à valider

- Sur le ferry : recharger le canon à un poste fixe, en alternance avec la défense au centre (pas fait : la traversée est pour l'instant une défense simple).
- Dans la forêt : une lumière qui se déplace, et les ennemis apparaissent en dehors du halo.
