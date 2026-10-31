# DKK : Rock Never Dies

Un jeu de plateforme et de tir **où tout se détruit**, dans l'esprit de Broforce, à jouer **en paysage
sur téléphone** (ou au clavier, ou à la manette), **seul ou jusqu'à 4**.

**Jouer : https://piascwal.github.io/dkk-rock/**

## L'histoire

2026. La musique a été remplacée par des boucles de quatre secondes, des voix autotunées et des
      refrains de trois mots. Le groupe de rock du collège, **les DKK**, se reforme au Clos, chez les
      parents de JBT, à Saint-Cézaire, pour débrancher **DJ Boucle**, qui hypnotise le monde avec un beat qui ne s'arrête
      jamais.

| Héros   | Instrument        | Arme de base                        | Spécial                               |
| ------- | ----------------- | ----------------------------------- | ------------------------------------- |
| **JBT** | batterie          | baguettes lancées à la chaîne       | grosse caisse qui roule et explose    |
| **JBM** | chant             | cri qui traverse les rangs          | contre-ut qui pulvérise tout autour   |
| **JBG** | guitare solo      | power chords rapides                | solo interminable                     |
| **Mat** | basse             | ondes lourdes qui creusent la roche | slap : piqué qui fait trembler le sol |
| **Tom** | guitare rythmique | rythmique en éventail               | larsen qui se colle et explose        |

Ils sont aidés par **Fadatchi**, le kiwi du groupe (« espèce totalement disparue », selon JBM, qui
n'a jamais vérifié) : il picore les ennemis et pond des œufs explosifs.

Tout au long de la tournée, les héros découvrent la richesse des autres musiques (jazz modal,
techno de Detroit, musette, cumbia, yodel, Kraftwerk...)... et refusent de l'admettre.

**La tournée :** Saint-Cézaire (STC, le village perché au-dessus de la Siagne, où tout commence au
Clos) → le pré du Clos (le concours de drift, facultatif) → le Pont des Tuves (la descente à pied aux gorges de la Siagne, le
pont de 1802, et la bataille de figues du Viet Cong glaireux) → le Saut du Pont (le concours de plongeon, facultatif) → les Alpages Lounge → Gréau (yétis fans de techno
minimale, et le Yéti Alpha) → les Plages Électroniques de Cannes (on arrive en plein jour, la nuit tombe à mesure qu'on avance : coucher de soleil dans la
mer, puis le festival, sa foule, ses lasers, ses stroboscopes et sa grande scène ; `src/rendu/festival.ts`, `outils/niveaux/plage.py`) → la Ville Autotunée → le Rêve de JBT (un mini-jeu, facultatif) → le Club Infini
(DJ Boucle).

## Comment on joue

**L'écran titre est vivant** (`ui/titre-anime.ts`) : les cinq DKK en silhouette de part et d'autre des boutons rebondissent au tempo du jeu,
trois projecteurs aux couleurs du logo balaient la scène (un héros pris dans un faisceau sort de l'ombre), la rampe de LED bat la
mesure, et de temps en temps un passant traverse : Fadatchi, un yéti, un goéland ou le van. Sur un téléphone debout, les héros
se rangent plus petits le long du bas. En affichage économe, ou si le système demande moins d'animations : une image fixe.

**L'entrée des boss** (`ui/entree-boss.ts`) : quand le Yéti Alpha, le Champion du FISE ou DJ Boucle se réveille, un éclair blanc,
l'écran tremble, et un bandeau en travers de l'écran le présente en grand avec son nom en lettres qui tremblent et son titre
(2,4 s, un toucher ou une touche l'abrège). Une fois par boss et par niveau ; seul, la partie attend ; à plusieurs, elle continue
dessous. Elle ne lit que la vue (la barre de vie du boss qui apparaît) : les clients distants la voient aussi.

**La traversée du van** (`ui/transition-van.ts`) : quand on choisit un niveau sur la carte du monde, le van (à réacteur pour un niveau
en altitude) tire, d'un seul bloc rigide, un grand drap sombre et, dessus, une banderole au nom du niveau. Il entre par la gauche en
ralentissant et s'arrête : le drap couvre l'écran et le nom se lit pendant près de 2 s, le niveau se lance dessous ; puis le van
repart en trombe avec le drap et la banderole, dont le bord arrière découvre le niveau de gauche à droite (3,9 s en tout ; un
toucher saute l'arrêt ; rien en affichage économe).

**Les retours de jeu** : un quart de cœur perdu fait trembler le cœur et en fait sortir un éclat, un cœur vidé éclate, un cœur
regagné gonfle avec un éclat doré (`ui/hud-effets.ts`) ; le cœur d'un tonneau WOG jaillit et rebondit deux fois ; un reflet
traverse le tonneau d'or et deux étoiles scintillent autour ; le baril allumé tremble et rougeoie de plus en plus fort pendant sa
mèche (`f` de sa vue : les ticks restants) ; en battle royale, « +1 » saute au-dessus de celui qui élimine et le nom de l'éliminé
se barre dans le fil ; les boutons des menus s'enfoncent et rebondissent.

- Tout est destructible sauf le socle ; les caisses, le sable et la neige tombent quand on leur
  retire le sol ; les caissons de basses explosent en chaîne.
- Échelles, tyroliennes, saut et escalade contre les murs. Une tyrolienne se descend toute seule dans le sens de la pente,
  mais le joystick choisit le sens : on la remonte (plus lentement), ou on va où l'on veut sur un câble plat. Une jointure (un
  poteau au milieu, `$` dans la carte) la fait changer de pente sans qu'on lâche : descendre, filer à plat, remonter, d'un trait.
- **Pause :** « Recommencer le niveau » (et « Recommencer au drapeau » une fois un drapeau levé) refait la carte, détruite ou non,
  pour se sortir d'une impasse ; les vies et le score restent. Deux pressions (3 s pour confirmer) ; réservé à l'hôte.
- **Ennemis touchés** : ils clignotent en blanc (sprite compris) pendant un instant, et ceux qui tiennent plus d'un coup montrent leur barre de vie au-dessus de la tête pendant deux secondes.
- **Barils explosifs** (Saint-Cézaire et ville, marqueur `%`) : des tonneaux WOG en feu, à terre ; on peut les empiler (dans l'éditeur, rangé avec les tuiles à côté des tonneaux WOG ; une case au-dessus d'une autre), sprites entiers : le plus haut est dessiné en dernier, son pied recouvre un peu le dessus de celui qu'il porte. Le premier tir qui les touche (le leur comme celui d'une explosion voisine) les allume ; deux secondes plus tard, ils explosent (rayon 48 px, 5 dégâts aux héros comme aux ennemis : un cinquième de plus qu'un caisson de basses) et cassent ce qui se casse autour. Personne ne les vise, mais les tirs des ennemis les allument aussi. Ils sont pleins : héros et ennemis butent contre eux et peuvent monter dessus (`Carte.obstacles`, tenu à jour par la partie ; `monde/physique.ts`).
- **Tonneaux WOG** (le WOG, une passion magique pour les membres des DKK ; l'histoire sera retravaillée) : ce sont des tuiles
  (`O` bois, `Q` or ; `outils/fixe-tuiles.py`), semées par le générateur (un raccord sur deux en bois, et un tonneau d'or bien en vue au milieu du parcours, posé seul, jamais sur un tonneau en bois, en plus de celui d'une cache).
  Cassé, un tonneau en bois libère un **cœur** (un cœur de plus dans le HUD de celui qui le ramasse, s'il en a perdu, 3 au maximum ; pas de vie en plus : seules les cages en donnent) ; un tonneau d'or, un **cœur d'or** : tous les points de vie
  et `DUREE_INVINCIBLE` (10 s) d'invincibilité, avec une forte aura (`rendu/aura.ts`, portée par `EntiteVue.aura`, protocole v4).
  Le tonneau sans pancarte est le décor ordinaire de l'arrière-plan.
- **Zone visible et traits de personnages :** la simulation ne connaît pas la caméra ; `ZONE_VISIBLE` (config) approxime
  l'écran autour des héros (`Contexte.visible`) : un ennemi hors zone ne tire pas, un héros n'atteint pas un ennemi hors zone.
  Les petits traits propres à un personnage (Tom : un cœur pixel art quand il croise un rondin) sont des entrées de `TRAITS`
  dans `src/rendu/traits-persos.ts`, côté rendu et d'après la vue (rien à changer dans la simulation ni le protocole) ; les
  emojis sont dans `src/rendu/emojis.ts`.
- **Chargement :** les planches des cinq héros et de Fadatchi partent seules, avant les 140 autres (`chargeFeuilles`) ; l'écran
  titre montre une petite barre tant qu'elles ne sont pas là (5 s au plus) : l'intro ne démarre plus sans ses personnages.
- **Cartes Sibylle des fontaines** (la carte Magic, `public/sprites/carte-sibylle.png`) : cachées dans tous les niveaux (une
  pour 20 colonnes au mieux, de 6 à 36 ; 28 à Saint-Cézaire ; aucune dans les mini-jeux), pour pousser à explorer au lieu de
  filer tout droit. Leurs cachettes se calculent d'après la carte (`niveaux/cachettes.ts`, les mêmes chez tous les joueurs) :
  `niveaux/accessibilite.ts` donne les cases qu'on atteint sans rien casser et le nombre de gestes qu'il faut pour y arriver ;
  le chemin direct est le plus court du départ au van, et le **détour** d'une case est ce nombre de gestes en partant de ce
  chemin : aucune carte à moins de 4 gestes (6 d'abord), jamais à même le sol à découvert, jamais dans l'eau ni sur une échelle,
  jamais à moins de 6 tuiles d'un tonneau WOG, d'une cage, d'une arme, d'un médiator, d'un baril, d'un drapeau, du départ ou du
  van. Quatre sortes de lieux, servies à tour de rôle : les étages des structures (sous un toit), leurs sommets, le fond des
  caves, le reste ; dans chacune, les culs-de-sac d'abord (le bout d'un couloir, un toit qu'on atteint par une échelle). Une carte
  au moins par tranche de 40 colonnes quand elle a de quoi en cacher, trois au plus (une grande tour n'avale pas toutes les
  cartes), puis les meilleures cases restantes ; le parc du FISE, tout en plaine, se contente de cases voisines du chemin. La
  carte lévite dans une aura verte (`rendu/sibylle.ts`) ; prise, elle rapporte 250 points et elle est acquise pour de bon (la
  sauvegarde la retient aussitôt, par `id` de niveau : `Sauvegarde.sibylles`) : elle ne revient plus, ni en recommençant le
  niveau, ni en le rejouant. L'écran de fin de niveau affiche les cartes trouvées sur le total du niveau (`EtatVue.sibylles`,
  protocole v27) ; la carte du monde du menu, une fois le van arrivé sur un niveau, aussi (en bas à droite). L'histoire s'en
  mêle dès l'intro de Saint-Cézaire : Mat a perdu la sienne, JBM se fixe pour objectif de récupérer toutes les Sibylles du monde.
- **Cages** : un membre du groupe y est enfermé. Le libérer donne une vie (sans limite : on commence à cinq, et chaque cage fait monter le compteur ; une bulle « +1 VIE » flotte au-dessus tant qu'elle est fermée), et on prend sa place. Chaque niveau en cache quatre ou cinq.
- **Chaos visuel** (sans dégât en plus) : quand la tuile qui porte un accessoire de décor est détruite, des morceaux colorés
  s'envolent (`rendu/debris-decor.ts`, notes en plus pour les enceintes) ; les bonus (armes, médiators, cœurs) sont enfermés dans
  une boîte de verre qui ondule et brille (`rendu/bulle-bonus.ts`) ; dans les mondes sombres (ville, club), un liseré lumineux
  détache les personnages du fond (`Theme.lueur`, cyan pour les héros, rose pour les autres) ; des enceintes dans chaque monde.
- **Armes à ramasser** : lecteur minidisc (disque à ondes), pile alcaline (rafale), flipper (le
  dauphin rebondit en le disant, puis explose), frisbee (guidé vers les ennemis), machine à donuts (explosifs), boîtier de CD « L5 » (trois boîtiers en éventail, un plaisir coupable),
  **chauffage soufflant** (compagnon) ; l'icône de l'arme remplace « TIR » sur le bouton ; **médiators d'or** : un spécial de plus (3 au plus ; ils ne soignent pas).
  Le **chauffage soufflant** est une arme-compagnon (`entites/chauffage.ts`, `DefArme.compagnon`) : il suit le héros à la place
  de Fadatchi en avançant par petits bonds, passe devant lui quand il tire et crache un gros jet de flammes par le centre du
  cercle de sa grille ; quand les munitions s'épuisent (ou que le héros change d'arme ou tombe), il s'en va et le kiwi revient.
  Sa planche (`public/sprites/chauffage.png`) vient de `outils/fixe-chauffage.py`.
- **Drapeaux** : point de reprise et sauvegarde (en jeu : réapparition au dernier drapeau, ou « Recommencer au drapeau » dans la pause).
  « Continuer », depuis le menu, repart du début du niveau en cours, avec ses vies et son score.
- Ennemis : fêtards autotunés, videurs costauds, danseurs du tube de l'été (kamikazes),
  lanceurs de drops, drones à LED, influenceurs (le flash éblouit), yétis (n'attaquent que sur
  le temps), robots vocodeurs ; boss : Yéti Alpha, DJ Boucle et ses enceintes (son anneau
  d'hypnose inverse les commandes).

Commandes : joystick et boutons à l'écran ; clavier flèches/ZQSD/WASD, Espace saut, J tir, L
spécial, Échap pause ; manette standard. **Sur ordinateur (une souris), Options → Touches du clavier** montre à quoi sert chaque
touche et les réaffecte : on touche une touche, on appuie sur la nouvelle (Échap annule) ; trois touches au plus par action,
« × » en retire une, « + » en ajoute une, une touche déjà prise passe à la nouvelle action (sauf si l'autre n'en aurait plus aucune) ;
Entrée et les touches de fonction sont réservées, Échap ne sert qu'à la pause. Les touches sont gardées dans le navigateur
(`entrees/touches.ts`, `ui/touches-ui.ts`) ; la pause est une action comme les autres.

- **Viser :** haut tire droit en l'air, haut + côté en diagonale ; en l'air, bas tire vers le sol.
- **Contre un mur :** pas d'escalade, des sauts. Saut en poussant vers le mur = petit saut qui remonte la paroi (on
  enchaîne) ; sans direction ou en poussant à l'opposé = on décolle du mur (plus loin si on pousse). En haut du mur, on a
  un instant pour sauter de n'importe quel côté et passer le bord.
- **Échelons et pitons :** les échelles gardent un barreau sur deux (et leur sommet) incassable, les plateformes
  « pitons » sont scellées : on peut tout détruire autour sans se couper la route.

## Les mini-jeux

Entre certains niveaux, l'histoire fait une pause pour un mini-jeu ; une fois rencontré, il se rejoue depuis le menu
**Mini-jeux** de l'écran titre (seul, ou à plusieurs : Pause → Inviter des amis).

**Le concours de drift du pré du Clos** (au Clos, à Saint-Cézaire, juste après le village, avant la descente aux Tuves) : vue de derrière la voiture, chaque
joueur choisit son pilote — **Tom** et sa Renault 11, ou **Matt** et son Opel Corsa — et a **une minute** pour saccager le
plus de pelouse possible. Gaz : HAUT ou SAUT ; frein et marche arrière : BAS ; volant : GAUCHE / DROITE (pas de frein à main : gaz et
volant à pleine vitesse suffisent à partir en travers ; sur téléphone, le joystick reste affiché, son manche qui se balance, et
seul le bouton GAZ reste à droite). Les roues qui glissent arrachent l'herbe, puis la terre, puis font de la boue ; le score est la part du pré qui n'est
plus de la pelouse. À plusieurs, chacun conduit à son tour, puis le podium ; le record reste dans la sauvegarde.

Côté code : la simulation est dans `src/jeu/drift*.ts` (la pelouse, la voiture, le concours, la phase `drift` de la
Partie), le rendu en vue arrière (sol projeté comme en « mode 7 », panorama à 360°, voitures, écrans) dans
`src/rendu/drift*.ts` ; les sprites des voitures sortent de `outils/fixe-voitures.py` (sources dans
`assets-sources/drift/`).

**Le saut du pont des Tuves** (juste après le pont) : vu de face, façon Doodle Jump mais en chute. Le vieux pont en dos
d'âne pointu, de pierres brutes, moussu et mangé de lierre (exagérément haut : 60 m), et sous lui rien que le paysage, qui défile
moins vite : le ciel, les collines et Saint-Cézaire sur sa crête, les pentes boisées, la Siagne turquoise en amont et ses vasques
de tuf ; de part et d'autre, des rives de feuillage, de tuf et de mousse, et une cascade dont l'eau coule en filets jusqu'à la vasque. Ce même pont se retrouve au loin, sur la rivière, dans le fond du niveau des Tuves.
D'abord un survol montre la rivière et son trou d'eau (à retenir : on ne le revoit plus avant l'arrivée ; un appui le passe).
Tom, en jean, se place sur le dos d'âne (GAUCHE / DROITE), puis tend ses jambes comme un élastique : joystick tiré vers le bas
(ou SAUT tenu), il se ramasse et une flèche montre l'impulsion ; la tension monte, mais tenue trop longtemps les jambes flanchent
et elle retombe ; tirer de côté le fait partir de l'autre, comme une fronde. Au lâcher, il monte bras pliés, d'autant plus haut
que la tension était forte (trop faible, il bascule du parapet et ne contrôle rien un moment), puis bascule et redescend bras
tendus, en slip de bain, la caméra avec lui : GAUCHE / DROITE le dirigent (il garde son élan), des branches de figuier sortent
des rives (une branche heurtée l'arrête, le sonne et coûte 5 points), des couloirs de vent le déportent, trois hirondelles le
bousculent. La note est la précision : 100 au milieu du trou d'eau, 70 à son bord ; en eau peu profonde, elle chute vite et les
galets coûtent 10 points : Tom y reste planté la tête dans les galets, les jambes hors de l'eau ; sur la berge, zéro, planté la
tête la première dans un nuage de terre. Dans le trou d'eau, il touche le fond, se retourne, remonte et nage la brasse jusqu'à
la berge. À plusieurs, chacun saute à son tour (les gorges changent à chaque saut), puis le podium ; le record reste dans la
sauvegarde. La simulation est dans `src/jeu/plongeon*.ts` (aiguillée avec le drift par `jeu/mini-jeux.ts`), le rendu dans
`src/rendu/plongeon*.ts`, les deux sprites de Tom sortent de `outils/fixe-plongeon.py` (sources dans `assets-sources/plongeon/`).

**Le rêve de JBT** (entre la Ville Autotunée et le Club Infini) : la nuit avant la tour, JBT veut raconter son rêve, et au
lieu de le raconter on le joue, façon Jetpack Joyride. JBT, en super-héros à cape, décolle de son lit sur un toit et traverse
le ciel de nuit à toute vitesse, de plus en plus vite, pour retrouver la pleine lune qu'il a perdue de vue : on **tient** pour monter (un
toucher n'importe où sur l'écran, ou un clic, ou le bouton VOLE ; pas de joystick dans ce mini-jeu), on **lâche** pour redescendre. Il ramasse les piles alcalines (en ligne, en
vague, en biais, en bloc ; les dorées en valent dix) et évite les arcs électriques entre deux astéroïdes (droits, couchés, en
biais, certains tournent ; des portes au plafond et au sol), les pluies de météorites en feu qui foncent en ondulant, et les
étoiles filantes, annoncées au bord de l'écran par une alerte avant de traverser à toute allure. JBT est petit pour avoir de la marge : cinq vies, cinq chocs et le réveil sonne ;
au bout du ciel, la lune (qui grandissait au loin depuis le départ) arrive, et JBT y plante sa tête : on ne voit plus que son
survêtement, ses baskets et sa cape. Le score : les piles, plus 100 pour la lune. Le ciel défile en plans (la voûte et la Voie
lactée, une géante à anneaux, des nuages mauves, des moutons qu'on compte, la ville et la tour du Club Infini, les toits). Le
parcours se tire d'après le numéro du vol (`jeu/reve-parcours.ts`), donc les invités le recalculent ; la simulation est dans
`src/jeu/reve*.ts`, le rendu dans `src/rendu/reve*.ts`, les deux sprites de JBT (de dos, en vol) sortent de
`outils/fixe-reve.py` (sources dans `assets-sources/reve/`).

**Le Grand Prix de la Sarré** (juste après Gréau, facultatif) : la surprise des DKK pour Mat, fou de F1 : la piste du karting
de la Sarré, où chacun court avec sa propre voiture (JBT et sa Clio, JBM et sa Xantia, JBG et sa Mégane, Mat et sa Corsa, Tom
et sa Renault 11), vue d'en haut façon Micro Machines. Chaque joueur choisit son pilote (son héros est proposé d'office), chaque
voiture a ses notes (vitesse, tenue de route, poids). Gauche et droite tournent, saut (ou haut) accélère, bas freine et recule,
tir lance le bonus pris dans les caisses « ? » : le turbo, la flaque d'huile (qui fait tourner sur soi-même), le marteau (qui
aplatit la voiture de devant), le bouclier, le ressort (un saut par-dessus tout). Seul, on court trois tours contre les quatre
autres (l'ordinateur, chacun avec son caractère, qui ralentit quand il sort de l'écran) ; à plusieurs, c'est la règle de l'écran :
la caméra suit le premier, qui en sort perd la manche, le dernier en piste la gagne, et le premier à huit manches remporte le
Grand Prix. La conduite est volontairement arcade : les voitures se heurtent et rebondissent (étincelles), et celle qui reste trop
longtemps hors de l'asphalte est remise sur la piste, clignotante et intouchable un instant. Les bonus se voient : flammes et
traits de vitesse du turbo, marteau qui s'abat, éclaboussures d'huile, saut en parabole avec son ombre, bulle du bouclier, et des
textes qui jaillissent (« TURBO ! », « BAM ! »...), un coup de marteau fait trembler l'écran. Le podium montre les DKK de face,
avec leur instrument. La piste et la conduite sont dans `src/jeu/kart*.ts`, le rendu dans `src/rendu/kart*.ts` (les effets des bonus : `kart-effets.ts` et `kart-flottants.ts`, d'après la seule vue) ; les
voitures et les héros vus de dessus viennent de `assets-sources/kart/planche.jpg` (`outils/fixe-kart.py`).

**L'avion de JBG** (entre la fin de la tournée et le Breizh Tour) : en hommage à l'avion pour Madrid que JBG a raté, il court
après celui de la Ville Autotunée vers la Bretagne, façon Subway Surfers. L'avion des DKK roule au bout de la piste, l'arrière
tourné vers JBG : JBT, JBM et Mat collés aux hublots, Tom qui fait des signes à la porte, l'échelle qui pend. Il accélère, et
décolle au bout d'une minute. JBG change de voie (haut, bas : trois voies) et saute (un toucher sur l'écran, un clic ou le
bouton SAUTE) par-dessus les cônes, les valises tombées et les flaques de kérosène ; il esquive les agents de piste (certains
traversent), les trains de chariots et les camions-escaliers ; il grimpe sur les camions à tapis par leur rampe et court
dessus. Chaque faux pas le fait trébucher et l'avion file. Pour lire le tarmac (`rendu/avion-lisibilite.ts`) :
sa voie est éclairée, chaque obstacle de sa voie a une marque au sol de la couleur du geste à faire (rouge : changer de voie,
jaune : sauter, cyan : monter sur le tapis), et ce qui arrive dans la seconde est annoncé au bord droit, voie par voie ; trois
cartes montrent toujours la voie libre avant chaque obstacle, les obstacles frôlés ne comptent pas. Il ramasse les cartes d'embarquement (5 points) et des bonus : le
solo (il pulvérise ce qui est devant lui), les ressorts (il saute plus haut), la trottinette (plus vite, et elle encaisse un
choc), l'aimant (les cartes viennent à lui). Quand l'avion est à portée, sur la voie du haut, il saute sur l'échelle : 300
points, plus 10 par seconde d'avance sur le décollage. Le tarmac se tire d'après le numéro de la course
(`jeu/avion-parcours.ts`) ; la simulation est dans `src/jeu/avion*.ts`, le rendu dans `src/rendu/avion*.ts`.

## L'éditeur de niveau

Menu principal → **Éditeur de niveau** : on peint une carte au doigt (téléphone, en portrait comme en paysage) ou à la souris. On part
d'un niveau de base (le départ, le van et le sol), d'un niveau **complètement vide** (que du ciel : tout est à poser) ou d'un niveau
du jeu ; la carte se dessine comme en jeu (l'herbe ou la neige sur la terre, les coins
arrondis, la végétation). La palette (le bouton en bas) range tout ce qu'on peut poser : les tuiles avec les textures du thème,
les gens (chaque apparence à part, comme les trois bigoudènes, les gens du coin de chaque ville, qu'on peut poser ailleurs, et les
boss), les objets (le départ, le van, les drapeaux, les cages, le butin, les tyroliennes, les déclencheurs de dialogue), le décor
(les accessoires du jeu) et les modules (ceux du jeu : forteresses, tours, caves, gouffres, détours de pierre de taille, monuments
des villes, rampes du FISE... et les siens). Outils : la main (déplacer), le pinceau, le rectangle plein, la gomme, la pipette et la
sélection ; un doigt peint, deux doigts déplacent et zooment, un doigt qui reste appuyé fait apparaître les outils (et la palette,
et annuler) en rond autour de lui : on glisse vers l'un d'eux et on lève le doigt, ou on lève au centre puis on touche ; à la souris, clic droit ou barre d'espace pour déplacer, molette pour
zoomer, Ctrl+Z pour annuler (le menu a une **Aide : touches et gestes** qui liste tous les raccourcis du clavier, de la souris et du doigt ; ? ou F1 l'ouvre aussi). **Tester** joue le niveau tout de suite (on revient à l'éditeur au bilan, ou en quittant) ; le menu
vérifie qu'on va du départ à la fin sans rien casser, change le nom, le thème et la taille, et **exporte** le niveau (un fichier
`.json` à partager, télécharger ou copier) : envoyez-le à Claude pour l'ajouter au jeu, tel quel ou retouché, comme nouveau niveau
ou à la place d'un niveau existant. Le brouillon se garde tout seul dans le navigateur, et l'export se réimporte.

**Apparences du décor** : un accessoire qui a plusieurs apparences (les trois figuiers, par exemple) se pose au hasard d'un simple
toucher sur sa vignette ; un appui long sur la vignette ouvre ses apparences en grand, pour choisir celle qu'on veut (le bouton
« Retour » revient à la liste). L'apparence choisie s'enregistre avec l'accessoire (`decor` : le quatrième nombre). L'éditeur se tient
aussi en portrait : l'écran « Tournez votre téléphone » ne le recouvre plus. **Tissus** : `/` (rouge) et `\` (blanc, pour les voiles) se
joignent sans couture ; seul le bas ondule, quand rien ne le continue.

**Tyroliennes poteau par poteau** (objet « Tyrolienne : poteau par poteau ») : on touche la case du premier poteau, puis celle
de chaque poteau suivant (toujours dans le même sens) ; on retouche le dernier poteau pour finir (il est orange tant qu'on trace).
Rien n'est déduit : chaque tyrolienne garde ses poteaux, elle peut en croiser une autre, passer au-dessus ou en dessous, commencer
avant qu'une autre ne finisse. Toucher le bout d'une tyrolienne finie la reprend ; la gomme retire un poteau. Elles sont rangées à
part dans l'export et dans le niveau (`tyroliennes` : les poteaux de chacune). Les caractères `(` `)` `$` restent pour les cartes
du jeu : chaque départ y est relié au poteau le plus proche à sa droite.

**Mes niveaux** : Menu → Enregistrer dans Mes niveaux garde le niveau dans le navigateur (un niveau du même nom est remplacé) ;
Menu → Mes niveaux les rouvre ou les supprime. Ils se jouent en battle royale, seul contre l'ordinateur ou en ligne (l'hôte
envoie le niveau aux autres joueurs). « Vérifier le parcours » dit aussi pour combien de joueurs la carte est faite.

**Rogner la carte** : Menu → Nom, thème et taille → « Rogner à la souris » (`src/editeur/rognage.ts`). La carte entre dans la vue avec
un cadre jaune qu'on tire par ses poignées (les quatre coins, le milieu de chaque côté, ou n'importe où le long d'un bord) : le
rogné se teinte en rouge, l'ajouté en vert, la taille s'affiche ; « Appliquer » recadre (tout ce qui est posé suit : décor, gens,
départs, tyroliennes tracées), « Annuler » laisse la carte telle quelle ; un doigt qui ne saisit rien déplace la vue (Entrée
applique, Échap annule). Les nombres de la fenêtre restent : les colonnes s'ajoutent à droite, les rangées en haut.

**Copier** : l'outil sélection (le carré en pointillés) trace un rectangle ; une barre propose alors **Copier** (le morceau entre dans le
presse-papier, qui se pose comme un module : on touche la carte pour le coller, autant de fois qu'on veut, son bas sur la rangée
touchée ; il reste aussi dans la palette, Modules → Copie ; Ctrl+C et Ctrl+V au clavier) ou **Module**.

**Mes modules** : l'outil sélection fait aussi un module d'un rectangle de la carte (ses tuiles, ses gens, son
décor, ses tyroliennes tracées poteau par poteau, coupées au bord du rectangle s'il y a lieu ; le départ et le van restent dans le niveau) ; on le nomme, il rejoint la palette
(Modules → Mes modules) et se pose comme ceux du jeu, par sa rangée de sol. Le menu → Mes modules les liste, les exporte (un par un ou tous, un fichier `dkk-modules`), en
importe et en supprime.

Le code est dans `src/editeur/` (chargé seulement à l'ouverture de l'éditeur) ; les modules du jeu sont les pièces du générateur,
exportées par `python3 outils/exporte-modules.py` dans `src/editeur/modules.json`. Les icônes viennent de
[Lucide](https://lucide.dev) (licence ISC), tirées par `outils/icones-editeur.py` dans `src/editeur/icones.ts`.

Intégrer un export :

- un **niveau** : sa `carte` devient `src/niveaux/cartes/NN-*.ts`, son `decor` le décor placé, ses `gens` la liste `gens` du
  niveau (sur la case d'une lettre : `ottawa/a` pour le gens d'une ville, `_/h#2` pour une apparence précise, voir
  `src/entites/ennemis/gens.ts`), son `theme` celui du niveau ; puis un texte et une ligne dans `src/niveaux/index.ts` (voir
  « Ajouter du contenu ») ;
- des **modules** : chacun devient une pièce du générateur (`outils/niveaux/*.py`, ses lignes telles quelles, posée par sa rangée
  de sol), placée dans les plans des villes voulues ; `outils/exporte-modules.py` la remet ensuite dans la palette.

## Battle royale

Menu principal (Continuer, **Battle royale**, Rejoindre des amis…) → **Battle royale** → **Solo** ou **Multi**, puis une carte (on voit pour combien de joueurs elle est faite ; pas
d'ennemis du niveau, on n'y affronte que les autres joueurs), et :

- **solo**, contre l'ordinateur (1 à 7 adversaires, de niveau facile, moyen ou difficile) : de quoi s'entraîner ou essayer une carte ;
- **multi**, en ligne : un salon s'ouvre (Wi-Fi, ou un lien envoyé par le partage du téléphone via « Inviter des amis ») ; les
  amis le rejoignent, s'échauffent sans se blesser, et chacun prend une **case** du salon (« Venir ») ; l'hôte comble les cases
  libres avec des joueurs de l'ordinateur (« + IA », « ✕ » pour en retirer un) puis lance la partie (jusqu'à 8 joueurs).

Deux modes, au choix dans les réglages (et, chez l'hôte, au salon) : **chacun pour soi**, ou **en équipes** — rouge contre bleue,
quatre cases chacune (`src/jeu/equipes.ts`) : prendre une case, c'est choisir son camp ; hors ligne, les camps s'équilibrent
d'eux-mêmes. En équipes, les tirs alliés ne blessent pas, chaque joueur a la couleur de son équipe (repère, fil, VERSUS),
l'ordinateur ne vise que le camp d'en face, et la dernière équipe en lice gagne. Pas de flèches vers les adversaires : on se cherche.

Les cartes sont faites pour ce mode, pas celles de l'histoire : petites (72 × 36 tuiles), closes, tout en hauteur, pour se
chercher en haut, en bas, à gauche et à droite par les échelles, les plateformes et les tyroliennes (certaines à jointures). Quatre
arènes : **la Tour de Mixage** (le club), **les Échafaudages** (un chantier), **le Port** (deux bateaux et leurs mâts), **le
Sommet** (une montagne creusée de grottes). S'y ajoutent les siennes : dans l'éditeur, Menu → **Nouvelle arène** (une page close,
sans van), puis Enregistrer dans Mes niveaux ; ou « Importer un niveau (.json) » depuis le menu du battle royale (un export de
l'éditeur, le sien ou celui d'un ami). Une carte sans van ni DJ Boucle est une carte de battle royale ; « Tester » dans l'éditeur la
joue contre l'ordinateur. Dans les objets de l'éditeur, les **8 départs** (un par joueur, de sa couleur) : chacun commence sur le
sien, et l'on réapparaît sur le départ le plus loin des autres (sans départs placés, au hasard sur la carte).

Chaque manche s'ouvre sur un écran **VERSUS** (`src/ui/versus.ts`) : la carte de chaque joueur tombe ou monte à sa place (le
portrait du personnage tiré au sort pour cette manche, sans doublon tant qu'il y en a, et son pseudo ; « Ordi N » pour
l'ordinateur), le « VS » claque, puis 3, 2, 1. Trois vies chacun ; les tirs blessent les autres joueurs (jamais soi-même), sans
aucune protection après un coup reçu ; une élimination revient à celui qui a touché en dernier, et le fil en haut à droite
l'annonce (« A a éliminé B », « B s'est éliminé tout seul » ; `src/ui/fil-elim.ts`). Les cœurs se comptent au quart près, façon Zelda :
un tir d'un autre joueur retire ses dégâts en quarts (une baguette un quart, un accord un demi-cœur, une explosion deux cœurs),
un coup d'ennemi un cœur entier. On réapparaît loin des autres, avec quelques
secondes de protection. Les cages et les cœurs redonnent une vie (5 au plus).
Le dernier en lice gagne ; le classement s'affiche, et « Rejouer » relance une manche sur la même carte. Plusieurs joueurs peuvent
jouer le même héros : un repère de couleur au-dessus de chacun dit qui est qui.

Les joueurs de l'ordinateur suivent le chemin que trouve le parcours d'accessibilité vers l'adversaire le plus proche (sur la
carte telle qu'elle est : sauts, échelles, tyroliennes qu'ils vont attraper sous leur poteau), tirent à hauteur, creusent quand
ils sont coincés, et partent errer ailleurs s'ils tournent en rond. Leur niveau règle leur portée, leur temps de réaction et
leurs rafales : facile (110 px, près d'une seconde pour réagir, des rafales courtes et ratées), moyen (le niveau par défaut),
difficile (190 px, aucune hésitation).

La taille conseillée vient de la surface où l'on peut se tenir (le même calcul que « le niveau est atteignable ») : environ 30
cases par joueur au plus, 110 au moins, de 2 à 8. Le code : `src/jeu/arene.ts` (les règles), `src/jeu/arene-ia.ts` (l'IA),
`src/niveaux/arenes.ts` et `outils/arenes.py` (les arènes : le script vérifie les liens des tyroliennes et leurs câbles ;
`tests/arene.test.ts`, que tout s'atteint depuis le départ), `src/ui/menus-arene.ts` et `src/ui/arene-ui.ts` (menus, salon,
classement), `src/niveaux/mes-niveaux.ts` (Mes niveaux, l'import, et la relecture d'un niveau reçu d'un hôte).

## À plusieurs

Grâce à [lan-kit](https://github.com/piascwal/lan-kit) (figé sur `v0.2.0`), **sans serveur** :
l'hôte ouvre sa partie depuis la pause (« Inviter des amis ») ; sur le même Wi-Fi, les autres la
voient dans « Rejoindre des amis » ; ailleurs, l'hôte crée un **code** ou un **lien d'invitation**.
On peut rejoindre en cours de route, jusqu'à 4 (8 en battle royale).

L'hôte fait tourner la simulation ; les autres envoient leurs commandes (1 octet, 60 fois par
seconde) et reçoivent des instantanés (30 par seconde, moins de 4 Ko) qu'ils lissent, plus les
évènements fiables (tuiles détruites, sons, dialogues).

## Installer le jeu, jouer hors ligne

Le jeu est une application installable (PWA) : sur Android ou un ordinateur, le bouton « Installer le jeu » apparaît
dans le menu ; sur iPhone, Partager → Sur l'écran d'accueil. Installé, il s'ouvre en plein écran, en paysage, avec
Fadatchi pour icône, et il se joue hors ligne (seul : jouer à plusieurs demande le réseau). Dans le navigateur, le plein
écran est demandé au premier toucher, sur l'écran d'intro.

Un service worker (`sw.js`, généré au déploiement d'après `outils/sw-modele.js`) garde tous les fichiers en cache ; la
page et `version.json` passent par le réseau d'abord, pour que les mises à jour soient vues. Mais si le réseau ne répond
pas en trois secondes (ou pas du tout, hors ligne), on sert la copie du cache : le jeu démarre quand même. Le filet de
secours (`public/secours.js`, qui vide le cache au bout de six secondes si le jeu n'a pas démarré) ne touche plus au cache
hors ligne. Seule une toute première ouverture, sans aucun cache, a besoin du réseau.

## Version et mise à jour

Le numéro de version s'affiche sur l'écran titre et dans le menu pause, par exemple `v0.1.12 · a1b2c3d` :
« majeur.mineur » de `package.json`, puis le numéro d'exécution de la CI, qui augmente à **chaque
déploiement**, puis le commit publié. En développement : « version de développement ».

À l'ouverture du jeu (et au retour sur l'onglet), le jeu compare sa version à `version.json`, publié avec le
site : s'il en existe une plus récente, un bandeau propose de recharger (le rechargement contourne le cache de
la page). Les images (sprites, portraits) portent la version dans leur adresse, pour qu'un ancien sprite ne
reste jamais en cache.

## Développer

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck && npm run lint && npm run format:check && npm test
npm run build      # dist/, servi sous /dkk-rock/
```

**Recette des écrans** (`outils/recette.mjs`) : avec `npm run dev` lancé à côté, `npm run recette` parcourt tous les écrans (menus,
battle royale, histoire, jeu, pause, éditeur) sur sept tailles d'appareil (téléphones couchés et debout, tablette, ordinateur), en
fait une capture et signale ce qui cloche : un menu qui défile, un bouton hors de l'écran ou recouvert, une cible trop petite au doigt,
un texte coupé, une erreur JavaScript. Captures et rapport dans `recette/`. Il faut Playwright :
`npm i -D playwright && npx playwright install chromium` (ou `PLAYWRIGHT=<chemin du module>` s'il est installé ailleurs).

Chaque poussée sur `main` est vérifiée puis publiée par GitHub Actions
(réglage du dépôt, une seule fois : Settings → Pages → Source « GitHub Actions »).

**Pile :** TypeScript strict, Vite, Canvas 2D, Web Audio, Vitest, ESLint, Prettier. Les sons sont
synthétisés ; les personnages sont des sprites (`public/sprites`, voir docs/ASSETS.md), les autres éléments dessinés en code.

### Architecture

```
src/
  config.ts          constantes globales (tuile, vue, gravité, tempo...)
  moteur/maths.ts    outils, aléatoire reproductible
  monde/             tuiles (types, points de vie), carte, physique
  entites/           héros, armes, tirs, ennemis et boss, objets, Fadatchi
  jeu/               la Partie (simulation), règles, explosions, sauvegarde, la vue (EtatVue)
  niveaux/           format ASCII, cartes/, textes/ (dialogues), index
  histoire/          épilogue et défaite
  rendu/             caméra, trois plans de fond, décor du plan proche, tuiles, sprites, particules
  audio/             synthé, bruitages, séquenceur musical
  entrees/           clavier, touches (réaffectables), manette, tactile
  reseau/            protocole binaire, hôte, client (sur lan-kit)
  ui/                menus, HUD, dialogues, portraits (HTML)
  app.ts             relie le tout : boucle à pas fixe, solo, hôte ou invité
```

Trois règles : la **simulation** ne touche pas au DOM (elle tourne dans les tests) ; le **rendu**
ne lit que la **vue** (`EtatVue`), comme un client distant ; tout ce qui vient du **réseau** est
validé.

### Ajouter du contenu

- **Remplacer un personnage par un vrai sprite :** voir [docs/ASSETS.md](docs/ASSETS.md).
- **Refaire ou créer un niveau :** les bonnes pratiques de level design sont dans [docs/LEVEL-DESIGN.md](docs/LEVEL-DESIGN.md).
- **Le héros :** plus d'écran de choix, comme dans Broforce. Une partie neuve tire un membre au hasard, la reprise rend le
  dernier joué, et chaque fois qu'un nouveau arrive (début de partie, cage ouverte) une animation coupe la scène pour le
  présenter (`ui/recrue.ts`, détectée dans `app.ts` d'après la vue : aucun changement du protocole). Seul, la partie attend
  pendant l'animation ; à plusieurs, elle continue.
- **Un niveau :** une carte ASCII dans `src/niveaux/cartes/` (légende dans `format.ts`), ses textes dans
  `src/niveaux/textes/`, une ligne dans `src/niveaux/index.ts` et dans un arc (`niveaux/arcs.ts`). Les cinq premières
  cartes sont générées par `python3 outils/genere-niveaux.py` puis modifiables à la main ; l'aperçu de chaque carte est
  dans `assets-sources/niveaux/`. Le test d'accessibilité vérifie qu'on atteint la fin sans rien détruire. Sous le
  terrain il n'y a plus de socle : creuser trop, c'est tomber.
  **Refaire un niveau sans gêner les joueurs** (le chantier du level design, à la manière de Broforce : du relief, des vides
  qu'on ne creuse pas, plusieurs routes) : la refonte s'écrit à côté de l'original, dans `src/niveaux/refontes/` (le plan
  `marseille_refonte` de `outils/niveaux/plans.py`, publiée : des suites de tours pleines de pièces séparées par le vide, qu'on
  franchit par une passerelle (de planches ou de métal) ou une tyrolienne, toujours en haut des tours : il faut y monter,
  `outils/niveaux/blocs.py` ; des miradors sur pilotis, des cuvettes sans pont et des grottes sous les massifs où l'on descend
  par des marches pour remonter en face (des rampes en partent vers les souterrains), et un plateau creusé d'une caverne qu'on traverse ou qu'on gravit, `outils/niveaux/plateaux.py` ; pas de mur dur
  à escalader : la verticalité vient du vide et du terrain ; et sous chaque plateau et chaque tour des
  complexes souterrains (des bunkers à étages reliés par des boyaux sinueux, une seconde rangée plus bas, des cavernes ;
  aucun creux sans issue), `outils/niveaux/massifs.py` ; puis `python3 outils/pose-barils.py ../refontes/21-marseille`), et se
  déclare dans `src/niveaux/refontes.ts`. Elle garde l'`id` et la place du niveau : les sauvegardes ne bougent pas. Les joueurs
  ne l'ont qu'une fois son `id` ajouté à `REFONTES_PUBLIEES` (augmenter alors `VERSION_PROTOCOLE`) ; avant, on l'essaie en
  ouvrant le jeu avec `?essai` à la fin de l'adresse (rien n'est retenu : sans lui, c'est le jeu de tout le monde ; un
  bandeau le rappelle) : le menu « Niveaux refaits » propose chaque niveau refait dans sa version d'avant et dans sa version
  refaite, sans rien sauvegarder.
  `python3 outils/mesure-niveaux.py` compare les cartes : la montée et la casse du chemin le moins cher, la montée imposée
  même en cassant tout (faible : on traverse tout droit en cassant les murs), les gouffres et les falaises.
  **Les forteresses ne se grimpent pas par la façade** : à chaque étage, un balcon de quatre tuiles à gauche (un ennemi dessus : on
  se cogne dessous en sautant de mur en mur) et une annexe fermée à droite ; chacun a sa porte sur l'étage, il faut passer par
  l'intérieur (`_avancees` dans `outils/niveaux/structures.py`).
  **Fin de niveau :** quand le camping-car a disparu, l'écran des _convertis au rock_ (`ui/convertis.ts`) empile en ligne les sprites des
  ennemis convertis, mélangés (toujours dans le même ordre pour une même pile) et à peine chevauchés (une autre ligne
  passe dessous quand elle est pleine ; `ui/pile-convertis.ts`), qui apparaissent l'un après l'autre en cinq ou six secondes
  avec un éclat chacun ; en dessous, le temps de la run, le score et le total
  (« selon les DKK »). Tout vient de la vue (`EtatVue.convertis`, `temps` : protocole v22), donc chez tous les joueurs ; un
  premier toucher finit la pile, le suivant passe au récit. La carte du monde entre deux niveaux ne remet pas le brouillard sur
  les niveaux déjà faits un jour (`etatsDuTrajet`, `niveaux/arcs.ts`).
  **Chaque monde a sa géométrie** (`outils/niveaux/signatures.py`) : Saint-Cézaire ses lieux à lui (`outils/niveaux/stc.py` : le
  Clos, les restanques d'oliviers, les remparts, la place de la fontaine des Mulets et sa mairie, les calades sous leurs passages
  voûtés, la chapelle Notre-Dame de Sardaigne), en pierre calcaire (`{`) sous des toits de tuiles (`^`) ; le Pont des Tuves
  (`outils/niveaux/tuves.py`) descend : le sentier, ses lacets de corniches, le canal de la Siagne (l'eau `~`, qu'on traverse
  et qui ralentit), le pont de pierre qu'on gravit par les marches de ses culées, son tablier tout en haut, au-dessus du
  vide des gorges (une arche, des piliers, la rivière loin dessous ; une échelle remonte de l'eau jusqu'au tablier), le lit de la rivière (la boue `;`), puis les figuiers du Viet Cong
  glaireux (ennemi `v`) qui lancent des figues : leur lait brûle tout ce qu'il traverse (planches, caisses, boue) et ne
  s'arrête que sur la terre ou la pierre ; le niveau est plus profond que les autres (`profondeur` dans son plan) et son fond
  suit le chemin (la rivière reste derrière, à toutes les hauteurs). **Un premier plan** passe devant le jeu
  (`src/rendu/premier-plan.ts`, un par monde qui en déclare un) : des éléments tout proches, clairsemés, translucides,
  qui défilent plus vite que le jeu en largeur ; en hauteur, ils sont cloués au monde, comme le terrain (en sautant, en
  montant ou en descendant, rien ne bouge de son propre chef). Ils sont posés sur le terrain, à un endroit du niveau (on les
  croise, puis ils sont derrière nous), et ceux qui le demandent sont étirés vers le bas jusqu'au fond du niveau, là où l'on
  tombe : leur pied ne se voit jamais. Aux Tuves : de grands arbres feuillus (le tronc plonge jusqu'au fond, avec leur branche
  et leurs lianes), des mottes d'herbe et de fougères sur un sol sombre, des cascades qui tombent d'un rocher du ciel
  (`premier-plan-tuves.ts`). Pour en donner un à un autre monde : une définition de plus dans `PREMIERS_PLANS`
  (les sortes d'éléments, et où les poser) ; la forêt bretonne a aussi le sien (`premier-plan-foret.ts`) : ses vieux chênes
  du fond, plus grands et plus sombres, translucides, au tronc qui plonge jusqu'au fond du niveau ; le _parking à étages_
  (rampes en escalier, local dessous, niveau de pitons dessus) attend un nouveau monde, les alpages leur _falaise à corniches_ (échelles en zigzag, grotte à mi-hauteur), les cimes
  leur _glacier_ (bosses de glace qui glisse, crevasses, igloo à traverser), la plage son _ponton_ de planches sur pilotis et son
  phare, la ville ses _toits sur pilotis_ (on saute de toit en toit). Les pièces communes varient aussi : la traversée de gouffre
  existe en trois modes (`mixte`, `pont`, `iles`), et forteresses, barrages et gouffres changent de taille d'un niveau à l'autre.
  **Pas de longues lignes droites :** chaque niveau est un enchaînement de _lieux_ (`outils/niveaux/plans.py`, un plan par
  niveau) reliés par des raccords de 4 à 6 colonnes : forteresses à étages et sous-sol, traversées de gouffre (passerelle,
  tyrolienne ou îlots), à-pics, gouffres à descendre, tours, échafaudages, murs. **Pas de mur incassable pour forcer à
  monter** : l'à-pic (`barrage` dans `outils/niveaux/verrous.py`) est un gouffre sans fond de 7 tuiles, qu'on ne franchit
  qu'en montant l'échafaudage collé au bord, puis par une tyrolienne ou un pont de singe. Les modules du vide
  (`outils/niveaux/hauteurs.py`) : le _pont de singe_ (un gouffre sans fond, un pont de planches qui ploie), la _descente_
  (une tyrolienne vers un massif plus bas), la _grotte_ (une paroi qu'on gravit par l'intérieur, d'étage en étage), les
  _corniches_ (la même par l'extérieur) et les _tours_ : deux bâtiments à étages (pièces, échelles, ennemis à chaque étage)
  face à face au-dessus du vide, qu'on relie par une passerelle entre deux portes (`pont`) ou par une tyrolienne de toit en
  toit (`tyro`), comme dans Broforce. Un niveau **en hauteur** (`altitude` dans le plan : les Cimes) part d'un monde
  vide où chaque pièce pose son massif : on monte de la vallée au sommet, et tomber entre deux massifs, c'est mourir.
  **Le van à réacteur** (`envol` dans les textes du niveau, sprite `van-reacteur`) remplace le van d'origine là où le niveau
  finit au sommet : il décolle, nez en l'air, réacteur en feu (`rendu/reacteur.ts`). Partout ailleurs, le van d'origine part
  sur la route. Sous terre, pas de galerie
  continue (`outils/niveaux/souterrain.py`) : des complexes de pierre, des cavernes et des caches, qu'on atteint par une
  échelle depuis la surface et qui sont des impasses gardées (butin, arme ou cage +1 vie). Le monde est peu profond :
  24 rangées sous la surface, puis le vide.
- **Un arc de l'histoire :** les niveaux d'un arc s'enchaînent, avec leur épilogue ; l'arc principal est « La tournée ».
  Viennent ensuite le « Breizh Tour » (l'avion de JBG, un mini-jeu facultatif, puis la forêt, le port, la traversée, Groix)
  puis « Le FISE », puis l'« International Tour ».
  **L'International Tour** (après le FISE, sur une seconde île à l'est de la carte du monde, qu'on rejoint par les airs : la route
  y devient des pointillés au-dessus de la mer, `rendu/carte-iles.ts`) : une ville qui a marqué chaque membre du groupe, chacun
  en guide dans l'intro de la sienne, dans l'ordre de la tournée : Limerick (le stage de fin d'études d'informatique de Mat à l'Université de Limerick : la
  Shannon, le château du roi Jean, le pub, les moutons, le Munster, les Cranberries), New York (l'expérience de vie de JBM : les
  rats et leur pizza, les châteaux d'eau, Wall Street, le métro, le pont de Brooklyn), Ottawa (les trois mois de Mat au Canada :
  la neige à moins vingt, le Glebe Collegiate où il a suivi des cours, la patinoire de hockey sur la rivière gelée, la colline du
  Parlement et la tour de la Paix, le marché By, la poutine et les castors), Lund (le voyage étudiant de Tom : la nuit
  d'hiver à quinze heures, la cathédrale et le géant Finn, les étudiants en salopette, les vélos, l'élan), Beauvais, l'étape la
  plus « exotique », où JBT a été prof de sport (son aéroport international, donc ville internationale ; le chœur gothique le
  plus haut du monde, jamais fini ; Jeanne Hachette ; l'avion low-cost) et la finale à Marseille, où JBG a vécu (JBG : le Vieux-Port, le Panier, la pétanque, l'OM, les calanques, la Bonne Mère), avec l'épilogue
  `histoire/fin-international.ts`. Les monuments sont des pièces du générateur (`outils/niveaux/international.py` : la
  cathédrale sans nef et ses arcs-boutants, l'avion, le château à tours rondes, l'université, le pub, la Shannon et son pont, la cathédrale
  romane, les maisons rouges, les gratte-ciel, le métro, le pont de Brooklyn, la colline de la Bonne Mère, les calanques ; à Ottawa, `outils/niveaux/ottawa.py` : la patinoire, le bloc
  du Centre qu'on ne passe qu'en montant dans la tour de la Paix, le Glebe Collegiate dont on ne ressort qu'en bas), et
  ce qui change la façon d'y jouer (`outils/niveaux/international_jeu.py` : le gymnase de JBT à Beauvais, son mur d'escalade,
  sa corde et sa poutre ; le lac gelé de Lund, sa glace qui glisse et ses trous, et la butte de luge). Toutes les villes forcent
  à monter et descendre (corniches, grottes, tyroliennes, à-pics, galeries) sur 650 à 730 colonnes ; chaque montée est suivie d'une
  descente, pour que les caves aient leur place. La pierre de taille (`[`, cinq fois plus dure que la pierre) barre le chemin
  ici et là (`outils/niveaux/detours.py` : le bastion, la passe haute, le puits) : on fait le tour par-dessus ou par-dessous
  plutôt que de la casser. Les
  fonds sont peints en code au chargement du niveau (`rendu/fonds-international*.ts`, `rendu/fonds-ottawa.ts`), comme les gens
  du coin (`entites/ennemis/locaux.ts`, dessinés dans `rendu/dessins-locaux.ts` et `rendu/dessins-ottawa.ts`) : dans ces villes, les lettres ordinaires « a » et
  « c » des cartes deviennent un passager perdu et un passager pressé, un habitué du pub et un mouton, un étudiant en
  salopette et un cycliste, un trader et un rat, un hockeyeur (et sa rondelle qui glisse au sol) et un castor, un supporter de
  l'OM et un livreur en scooter ; chaque ville a en plus son spécial (z : la gargouille, u : le pilier du Munster, j : l'élan,
  n : le pigeon (le battement d'ailes et le piqué sont faits par `outils/anime-pigeon.py`), w : la bernache du Canada, i : le gardien de but, q : le bouliste et sa boule de pétanque ; le bouliste, le supporter de l'OM, le livreur en scooter, le trader, les deux passagers de Beauvais, l'étudiant et les deux cyclistes de Lund sont animés à la main par `outils/anime-bouliste.py`, `outils/anime-supporter.py`, `outils/anime-scooter.py`, `outils/anime-trader.py`, `outils/anime-passagers.py` et `outils/anime-lund.py` (outils communs dans `outils/anime_commun.py` ; une image reçue sur fond magenta se prépare avec `outils/prepare-magenta.py`), qui découpent leur sprite et en tirent repos, marche, attaque et touché, puis `outils/fixe-ennemis.py` en fait la planche).
  Aucune image en plus à télécharger (protocole v31).
  **Le FISE** (Montpellier, sur les berges du Lez) est fait à la main, zone par zone (`outils/niveaux/fise.py`) : l'entrée
  (l'arche et le logo officiel), le grand parc noir à plateaux roses (tuiles `L` et `U`), le food court à l'ombre des platanes
  et ses pissotières, le Freestyle Park de bois (half-pipe : descente, plat, remontée ; mini spine ; tuile `A`), la scène de
  breakdance, une seule plateforme (BREAK, le jury au centre, DANCE ; danseurs ennemis `k`), le flat BMX (FLAT), les tribunes, un second parc, le big air, le village des marques, puis la finale sur la main
  stage avec le Champion (`P`). Son décor n'est jamais semé au hasard : le générateur le place et l'écrit avec la carte
  (`DECOR_FISE`, voir `DefNiveau.decor`) ; ce dont on n'a pas encore le sprite est un carré d'attente
  (`decor-accessoires.ts`). Au fond (`rendu/fonds-fise.ts`) : la ville beige, le Lez turquoise et sa berge en pente où le
  public s'assoit, les pins parasols, le tram (ligne 1 aux hirondelles, ligne 3 aux motifs marins), et les trois bâtiments du
  parcours à leur place : l'Hôtel de Ville au départ, l'Arbre Blanc au milieu, l'Hôtel de Région à la finale. Les logos
  officiels (`assets-sources/decor/fise/logo-fise-*.png`) habillent l'arche, les bâches des barrières et la carte d'intro
  (`outils/fise-logos.py`). Les riders (lot 24) foncent sur le héros et reviennent ; le pro du BMX saute en figure.
  Le breakdance et le flat ont de petites plateformes à deux étages et beaucoup de _caissons de basses_ explosifs : le bleu
  (tuile `T`, 5 de dégâts) et le violet (tuile `I`, la LED violette du club : il explose plus large, 56 px au lieu de 40, mais
  fait moins mal, 3 de dégâts). Sous le food court, le flat et le village, l'envers du décor : trois _soirées_ souterraines,
  des complexes de métal façon boîte de nuit (`soirees` dans `fise.py`), qu'on atteint par une échelle.
  Au repos, les riders parcourent tout leur module (bornes `zones` dans la carte, `roule` dans
  `comportements-riders.ts`) : ils descendent les bords, montent les marches, font de petits sauts à des hauteurs variées ;
  un assaut sur chaque grande scène (flat, breakdance, food court, village ; `Niveau.assaut`,
  `src/jeu/assauts.ts`) fait tomber du haut de l'écran des pros du BMX en figure (`Voltigeur`), lentement, pour qu'on voit
  leurs tours avant qu'ils se posent sur leurs roues. Le flat et le breakdance sont coupés de monticules de caisses, de caissons
  et de tonneaux d'essence (`_monticules` dans `fise.py`). La barrière de la finale ne doit jamais être percée : `tests/fise-boss.test.ts`.
  **La barrière du boss** (tuile `|`, indestructible) garde le van du Yéti Alpha et du Champion : elle ne s'ouvre qu'à leur
  mort (`ouvreBarrieres` dans `jeu/chargement.ts`) ; le test d'accessibilité la compte comme ouverte.
- **Un ennemi :** une définition dans `entites/ennemis/definitions.ts` (lettre de carte), un
  comportement dans `comportements.ts`, un dessin dans `rendu/dessins-ennemis.ts`.
- **Une arme :** un tir dans `entites/projectiles-defs.ts`, une entrée dans `entites/armes.ts`,
  son dessin dans `rendu/dessins-tirs.ts`.

## Licence

Apache-2.0, voir [LICENSE](LICENSE).
