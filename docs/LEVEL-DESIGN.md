# Level design : les bonnes pratiques

Ce qu'on a appris en refaisant les niveaux à la manière de Broforce (Marseille d'abord, puis l'International Tour). À relire avant
de refaire un niveau ou d'en créer un. Les outils sont dans `outils/niveaux/` (le générateur : `outils/genere-niveaux.py`, les
plans : `outils/niveaux/plans.py`), et la mesure dans `outils/mesure-niveaux.py`.

## Le défaut à éviter : la ligne droite

Un niveau raté se traverse tout droit : une bande de sol à hauteur constante du départ au van, des bâtiments posés dessus, et il
suffit de casser les murs pour filer. Les vues d'ensemble (une carte par niveau, une tuile = quelques pixels) le montrent d'un
coup d'œil : les comparer avant et après chaque refonte.

## Chaque niveau sa structure

- **Pas de gabarit commun.** Un niveau n'est pas la même suite de modules (corniches, trois tours, miradors, cuvette, grotte
  traversante, plateau creusé, arène) avec un autre décor : le joueur aurait l'impression de refaire toujours le même niveau.
  Chacun a sa signature, tirée de son lieu : la canopée de la Forêt (des chaînes de cabanes dans les arbres), les quais du
  Port (presque à plat, au ras de l'eau), la côte de Groix (une grande montée par les falaises, puis la descente vers la plage).
- **Varier les formes d'un même module.** Une cuvette peut être un ravin raide (`pente=1`), une combe douce en terrasses
  (`pente=3, paliers=4`), à un versant à pic et l'autre doux (`pente_d`), avec un fortin ou un bateau en cale sèche au fond, ou
  rien. Une grotte traversante peut être basse et longue sous un toit épais. Comparer les vues d'ensemble des niveaux d'un même arc
  entre eux, pas seulement avant / après.

## Imposer la verticalité, sans mur

- **Le vide plutôt que le mur.** Ce qui sépare deux parties du niveau est un vide sans fond, trop large pour être sauté (plus de
  quatre tuiles), pas un mur. Un vide se contourne par le haut ou par le bas ; on ne le creuse pas.
- **Jamais de montée forcée face à un mur dur.** Pas de mur incassable, ni de pierre de taille, ni d'à-pic à escalader pour passer
  (le bastion, la passe haute, l'à-pic et son échafaudage ont été retirés des refontes) : le joueur voit tout de suite le truc et
  n'aime pas ça. La verticalité vient du vide et du terrain.
- **Du relief à grande échelle.** Le sol monte et descend tout au long du niveau (une ville se gravit : Marseille part du port pour
  finir à la Bonne Mère). Il n'y a pas de hauteur de référence. Les couches du terrain suivent sa surface (`_strates` dans
  `massifs.py`) : sinon une veine de terre tendre reste à la hauteur du terrain de départ et l'on y creuse tout droit.
- **Descendre par le terrain, pas par une échelle.** Pour faire passer le joueur sous terre, le sol descend en marches (une rangée
  toutes les deux colonnes) : une cuvette sans pont, ou une grotte qui traverse un massif. En allant tout droit, on se retrouve en
  bas sans l'avoir choisi. Une échelle peut rester, pour qui veut remonter, mais elle n'est jamais le seul chemin.

## De l'action partout

- **Pas de longue échelle dans le vide.** Une échelle de dix rangées plantée dans le ciel n'est qu'une ligne droite sans intérêt.
  Pour monter, on comble : un bâtiment (ses étages, ses échelles intérieures), ou des corniches de pitons en zigzag devant une
  paroi (quatre rangées entre deux, une courte échelle chaque fois, un garde sur chacune). Une échelle à travers la roche, d'une
  pièce à une autre, reste permise : elle est courte et mène quelque part.
- **Pas de grande étendue de roche pleine sous terre.** Sous les complexes, une seconde rangée de bunkers quand le massif est
  épais ; dans la roche qui reste, des cavernes (un plafond irrégulier, des corniches, des gardes, du butin) reliées par un boyau.
- **Tout ce qu'on voit doit pouvoir s'atteindre.** Une structure en hauteur sans accès (un château d'eau dont l'échelle s'arrête
  sous le plancher, un bloc dont on ne peut pas gagner le dessus) frustre : soit on la relie, soit on la retire. Les creux sans
  issue sont reliés par une échelle à travers la roche (`_relie_les_isoles` dans `massifs.py`). Être relié ne suffit pas : un
  passage d'une case de haut, une échelle qui s'arrête sous un plafond bas laissent le héros dehors. En fin de génération,
  `acces.py` refait le parcours du test (le même héros, deux cases de haut) et relie par une courte échelle, vers le haut ou
  vers le bas, chaque endroit où l'on pourrait se tenir sans y arriver (une caverne, une pièce de bunker, l'étage d'une tour).
- **Ne jamais creuser sous des marches ou un plancher.** Une caverne garde trois rangées de roche au-dessus d'elle, un boyau
  s'arrête avant de percer un sol par en dessous, une rampe ne passe jamais devant une porte : sinon l'escalier ou la porte du
  chemin principal disparaît (le test d'accessibilité le voit).

## Au-dessus et en dessous

- **Jamais une longue traversée sur le même plan.** Une étendue plate (une patinoire, un lac gelé, un pré, un quai) où l'on
  passe sans changer de hauteur reçoit quelque chose au-dessus et une raison de passer dessous (`relief.py`, appliqué à toute
  étendue plate d'au moins 34 colonnes). Ce qu'on y pose doit avoir du sens dans le lieu, et varie : un bâtiment (on monte dedans
  ou sur le toit), une butte (un guetteur au sommet, une grotte à son pied), un trou (le sol s'effondre, des rampes partent du
  fond vers les souterrains), une cabane de pêcheur sur un lac gelé ; des gradins seulement là où il y en aurait vraiment (autour
  d'une patinoire). Devant le bâtiment ou la butte, une fosse de trois marches où l'on entre en marchant et un passage dessous.
- **Une échelle ne suffit pas à donner envie de descendre.** L'entrée d'un souterrain se trouve sur le chemin, à l'horizontale :
  sur la remontée d'une cuvette, un palier et une ouverture dans la paroi où l'on entre en marchant (la courte échelle sert à
  passer par-dessus) ; au fond d'une fosse ; au bout d'une rampe.

## Les bâtiments

- **Séparés par le vide.** Deux tours voisines ne se touchent pas : entre elles, le vide. On passe de l'une à l'autre par une
  passerelle (de planches qui ploie, ou de métal, droite) ou une tyrolienne depuis le toit vers la tour suivante, plus basse.
- **Les passerelles en haut.** Elles partent d'un des deux derniers étages (les tyroliennes, du toit) : casser le mur du
  rez-de-chaussée ne mène qu'au vide, il faut monter dans la tour.
- **Pas de façade lisse.** D'un étage à l'autre, au hasard : il glisse à droite ou à gauche, déborde jusqu'au bord, rentre au
  milieu, ou garde la même largeur (pas toujours le même décalage). Là où l'étage du dessous dépasse, son toit fait une terrasse,
  avec une porte et un garde.
- **L'intérieur se traverse.** Des pièces coupées par des cloisons (une porte au ras du sol), des échelles jamais l'une au-dessus de
  l'autre (pour monter, il faut traverser l'étage), des gardes à chaque étage, des caisses, des caissons, des barils, du butin, des
  guetteurs sur le toit.
- **Rien dans les embrasures.** Jamais de caisse, de tonneau ou de cage dans une porte de cloison, au pied d'une échelle ou sur une
  trappe : le test d'accessibilité l'attrape, mais autant ne pas le faire.

## Les souterrains

- **Des structures, pas des bandes.** Sous les plateaux et sous les tours : des bunkers bâtis comme les tours (un à quatre étages,
  de largeurs différentes, des pièces, des échelles décalées), reliés par des boyaux qui serpentent, montent et descendent d'une
  marche à la fois. Pas de galeries droites à hauteur fixe.
- **Un treillis, pas un arbre.** Descendre doit mener plus loin, pas obliger à remonter par où l'on est venu : chaque passage
  souterrain ressort de l'autre côté.
- **On y entre en suivant le chemin.** Le fond des cuvettes et des grottes plonge en rampe vers les boyaux, qui passent sous les
  marches (jamais à travers : on casserait l'escalier) jusqu'à la porte d'un bunker. Les puits d'échelle depuis la surface restent
  un accès de plus, jamais le seul.
- **Bien garnis.** Deux à quatre gardes par étage de bunker, des gardes tout le long des boyaux, des poches avec une arme, un
  médiator, un tonneau ou une cage, une cage au fond de chaque bunker. Un souterrain vide ne vaut pas le détour.

## Les autres idées prises à Broforce

- **Le plateau creusé d'une caverne** : le terrain monte d'un coup, et au ras du sol on entre dans une vaste caverne qui le
  traverse ; ou l'on grimpe dessus par l'échelle de sa face.
- **Les miradors sur pilotis** : un guetteur en haut, une échelle pour pied, un poteau sous lequel on passe sans détour (un pied
  plein barrait la route).
- **Le pont de métal** : droit, avec un piton de place en place.
- **Les cages** varient les héros, elles ne facilitent pas le jeu : on peut en mettre beaucoup.
- **À venir** : des panneaux publicitaires sur les toits, avec un guetteur dessus (il faut les sprites).

## La boucle de travail

1. Écrire le plan de la refonte dans `outils/niveaux/plans.py` (`<niveau>_refonte`), en gardant les monuments du niveau.
2. Générer : `python3 outils/genere-niveaux.py <niveau>_refonte`, puis `python3 outils/pose-barils.py ../refontes/<fichier>`.
3. Vérifier : `npm test` (on atteint le van et chaque drapeau sans rien casser), `python3 outils/mesure-niveaux.py <fichier>`
   (la montée imposée même en cassant tout doit rester élevée), et les vues d'ensemble avant / après.
4. Déclarer la refonte dans `src/niveaux/refontes.ts` : elle se joue avec `?essai`, dans le menu « Niveaux refaits » (avant et
   après), sans toucher aux joueurs. Pour un niveau déjà publié, la nouvelle version va dans `ESSAIS` (plan `<niveau>_essai`) :
   « avant » est alors la version publiée.
5. Une fois validée, l'ajouter à `REFONTES_PUBLIEES` (ou, pour une nouvelle version, la mettre à la place de la refonte publiée)
   et augmenter `VERSION_PROTOCOLE`.
