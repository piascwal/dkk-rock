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

- Tout est destructible sauf le socle ; les caisses, le sable et la neige tombent quand on leur
  retire le sol ; les caissons de basses explosent en chaîne.
- Échelles, tyroliennes, saut et escalade contre les murs.
- **Pause :** « Recommencer le niveau » (et « Recommencer au drapeau » une fois un drapeau levé) refait la carte, détruite ou non,
  pour se sortir d'une impasse ; les vies et le score restent. Deux pressions (3 s pour confirmer) ; réservé à l'hôte.
- **Ennemis touchés** : ils clignotent en blanc (sprite compris) pendant un instant, et ceux qui tiennent plus d'un coup montrent leur barre de vie au-dessus de la tête pendant deux secondes.
- **Bidons d'essence** (Saint-Cézaire et ville, marqueur `J`) : des tuiles comme les caisses, on monte dessus, et elles arrêtent le héros ; un tir les casse.
- **Barils explosifs** (Saint-Cézaire et ville, marqueur `%`) : rouges, à terre. Le premier tir qui les touche (le leur comme celui d'une explosion voisine) les allume ; deux secondes plus tard, ils explosent (rayon 48 px, 5 dégâts aux héros comme aux ennemis : un cinquième de plus qu'un caisson de basses) et cassent ce qui se casse autour. Personne ne les vise, mais les tirs des ennemis les allument aussi.
- **Tonneaux WOG** (le WOG, une passion magique pour les membres des DKK ; l'histoire sera retravaillée) : ce sont des tuiles
  (`O` bois, `Q` or ; `outils/fixe-tuiles.py`), semées par le générateur (un raccord sur deux en bois, et un tonneau d'or bien en vue au milieu du parcours, posé seul, jamais sur un tonneau en bois, en plus de celui d'une cache).
  Cassé, un tonneau en bois libère un **cœur** (un cœur de plus dans le HUD de celui qui le ramasse, s'il en a perdu, et +1 vie, 5 au plus) ; un tonneau d'or, un **cœur d'or** : tous les points de vie
  et `DUREE_INVINCIBLE` (10 s) d'invincibilité, avec une forte aura (`rendu/aura.ts`, portée par `EntiteVue.aura`, protocole v4).
  Le tonneau sans pancarte est le décor ordinaire de l'arrière-plan.
- **Zone visible et traits de personnages :** la simulation ne connaît pas la caméra ; `ZONE_VISIBLE` (config) approxime
  l'écran autour des héros (`Contexte.visible`) : un ennemi hors zone ne tire pas, un héros n'atteint pas un ennemi hors zone.
  Les petits traits propres à un personnage (Tom : un cœur pixel art quand il croise un rondin) sont des entrées de `TRAITS`
  dans `src/rendu/traits-persos.ts`, côté rendu et d'après la vue (rien à changer dans la simulation ni le protocole) ; les
  emojis sont dans `src/rendu/emojis.ts`.
- **Cartes Sibylle des fontaines** (la carte Magic, `public/sprites/carte-sibylle.png`) : de 5 à 12 par niveau (une pour 45
  colonnes ; aucune dans les mini-jeux), pour pousser à explorer au lieu de filer tout droit. Leurs cachettes se calculent d'après
  la carte (`niveaux/cachettes.ts`, les mêmes chez tous les joueurs) : en haut des structures et au fond des caves, nettement
  au-dessus ou en dessous du terrain alentour, toujours accessibles sans rien casser (`niveaux/accessibilite.ts`, le modèle des
  tests), jamais dans l'eau ni sur une échelle, et à plus de 6 tuiles d'un tonneau WOG, d'une cage, d'une arme, d'un médiator,
  d'un baril, d'un drapeau, du départ ou du van ; les plus hautes et les plus profondes d'abord, sommets et caves en alternance,
  espacées sur tout le niveau. La carte lévite dans une aura verte (`rendu/sibylle.ts`) ; prise, elle rapporte 250 points et elle
  est acquise pour de bon (la sauvegarde la retient aussitôt, par `id` de niveau : `Sauvegarde.sibylles`) : elle ne revient
  plus, ni en recommençant le niveau, ni en le rejouant. L'écran de fin de niveau affiche les cartes trouvées sur le total du
  niveau (`EtatVue.sibylles`, protocole v27) ; la carte du monde du menu, une fois le van arrivé sur un niveau, aussi (en bas à
  droite).
- **Cages** : un membre du groupe y est enfermé. Le libérer donne une vie (cinq au plus : au maximum, on change seulement de personnage), et on prend sa place. Chaque niveau en cache quatre ou cinq.
- **Chaos visuel** (sans dégât en plus) : quand la tuile qui porte un accessoire de décor est détruite, des morceaux colorés
  s'envolent (`rendu/debris-decor.ts`, notes en plus pour les enceintes) ; les bonus (armes, médiators, cœurs) sont enfermés dans
  une boîte de verre qui ondule et brille (`rendu/bulle-bonus.ts`) ; dans les mondes sombres (ville, club), un liseré lumineux
  détache les personnages du fond (`Theme.lueur`, cyan pour les héros, rose pour les autres) ; des enceintes dans chaque monde.
- **Armes à ramasser** : lecteur minidisc (disque à ondes), pile alcaline (rafale), flipper (le
  dauphin rebondit en le disant, puis explose), frisbee (guidé vers les ennemis), machine à donuts (explosifs), boîtier de CD « L5 » (trois boîtiers en éventail, un plaisir coupable),
  **chauffage soufflant** (compagnon) ; l'icône de l'arme remplace « TIR » sur le bouton ; **médiators d'or** : soin et spécial.
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
spécial, Échap pause ; manette standard.

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

**L'avion de JBG** (entre la fin de la tournée et le Breizh Tour) : en hommage à l'avion pour Madrid que JBG a raté, il court
après celui de la Ville Autotunée vers la Bretagne, façon Subway Surfers. L'avion des DKK roule au bout de la piste, l'arrière
tourné vers JBG : JBT, JBM et Mat collés aux hublots, Tom qui fait des signes à la porte, l'échelle qui pend. Il accélère, et
décolle au bout d'une minute. JBG change de voie (haut, bas : trois voies) et saute (un toucher sur l'écran, un clic ou le
bouton SAUTE) par-dessus les cônes, les valises tombées et les flaques de kérosène ; il esquive les agents de piste (certains
traversent), les trains de chariots et les camions-escaliers ; il grimpe sur les camions à tapis par leur rampe et court
dessus. Chaque faux pas le fait trébucher et l'avion file. Il ramasse les cartes d'embarquement (5 points) et des bonus : le
solo (il pulvérise ce qui est devant lui), les ressorts (il saute plus haut), la trottinette (plus vite, et elle encaisse un
choc), l'aimant (les cartes viennent à lui). Quand l'avion est à portée, sur la voie du haut, il saute sur l'échelle : 300
points, plus 10 par seconde d'avance sur le décollage. Le tarmac se tire d'après le numéro de la course
(`jeu/avion-parcours.ts`) ; la simulation est dans `src/jeu/avion*.ts`, le rendu dans `src/rendu/avion*.ts`.

## À plusieurs

Grâce à [lan-kit](https://github.com/piascwal/lan-kit) (figé sur `v0.2.0`), **sans serveur** :
l'hôte ouvre sa partie depuis la pause (« Inviter des amis ») ; sur le même Wi-Fi, les autres la
voient dans « Rejoindre des amis » ; ailleurs, l'hôte crée un **code** ou un **lien d'invitation**.
On peut rejoindre en cours de route, jusqu'à 4.

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
  entrees/           clavier, manette, tactile
  reseau/            protocole binaire, hôte, client (sur lan-kit)
  ui/                menus, HUD, dialogues, portraits (HTML)
  app.ts             relie le tout : boucle à pas fixe, solo, hôte ou invité
```

Trois règles : la **simulation** ne touche pas au DOM (elle tourne dans les tests) ; le **rendu**
ne lit que la **vue** (`EtatVue`), comme un client distant ; tout ce qui vient du **réseau** est
validé.

### Ajouter du contenu

- **Remplacer un personnage par un vrai sprite :** voir [docs/ASSETS.md](docs/ASSETS.md).
- **Le héros :** plus d'écran de choix, comme dans Broforce. Une partie neuve tire un membre au hasard, la reprise rend le
  dernier joué, et chaque fois qu'un nouveau arrive (début de partie, cage ouverte) une animation coupe la scène pour le
  présenter (`ui/recrue.ts`, détectée dans `app.ts` d'après la vue : aucun changement du protocole). Seul, la partie attend
  pendant l'animation ; à plusieurs, elle continue.
- **Un niveau :** une carte ASCII dans `src/niveaux/cartes/` (légende dans `format.ts`), ses textes dans
  `src/niveaux/textes/`, une ligne dans `src/niveaux/index.ts` et dans un arc (`niveaux/arcs.ts`). Les cinq premières
  cartes sont générées par `python3 outils/genere-niveaux.py` puis modifiables à la main ; l'aperçu de chaque carte est
  dans `assets-sources/niveaux/`. Le test d'accessibilité vérifie qu'on atteint la fin sans rien détruire. Sous le
  terrain il n'y a plus de socle : creuser trop, c'est tomber.
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
  puis « Le FISE ».
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
