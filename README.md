# DKK : Rock Never Dies

Un jeu de plateforme et de tir **où tout se détruit**, dans l'esprit de Broforce, à jouer **en paysage
sur téléphone** (ou au clavier, ou à la manette), **seul ou jusqu'à 4**.

**Jouer : https://piascwal.github.io/dkk-rock/**

## L'histoire

2026. La musique a été remplacée par des boucles de quatre secondes, des voix autotunées et des
      refrains de trois mots. Le groupe de rock du collège, **les DKK**, se reforme dans le garage des
      parents de JBT pour débrancher **DJ Boucle**, qui hypnotise le monde avec un beat qui ne s'arrête
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

**La tournée :** le Garage → les Alpages Lounge → les Cimes Minimales (yétis fans de techno
minimale, et le Yéti Alpha) → la Plage du Tube de l'Été → la Ville Autotunée → le Club Infini
(DJ Boucle).

## Comment on joue

- Tout est destructible sauf le socle ; les caisses, le sable et la neige tombent quand on leur
  retire le sol ; les caissons de basses explosent en chaîne.
- Échelles, tyroliennes, saut et escalade contre les murs.
- **Pause :** « Recommencer le niveau » (et « Recommencer au drapeau » une fois un drapeau levé) refait la carte, détruite ou non,
  pour se sortir d'une impasse ; les vies et le score restent. Deux pressions (3 s pour confirmer) ; réservé à l'hôte.
- **Tonneaux WOG** (le WOG, une passion magique pour les membres des DKK ; l'histoire sera retravaillée) : ce sont des tuiles
  (`O` bois, `Q` or ; `outils/fixe-tuiles.py`), semées par le générateur (4 à 6 par niveau, un seul tonneau d'or, dans une cache).
  Cassé, un tonneau en bois libère un **cœur** (+1 vie, 5 au plus) ; un tonneau d'or, un **cœur d'or** : tous les points de vie
  et `DUREE_INVINCIBLE` (10 s) d'invincibilité, avec une forte aura (`rendu/aura.ts`, portée par `EntiteVue.aura`, protocole v4).
  Le tonneau sans pancarte est le décor ordinaire de l'arrière-plan.
- **Zone visible et traits de personnages :** la simulation ne connaît pas la caméra ; `ZONE_VISIBLE` (config) approxime
  l'écran autour des héros (`Contexte.visible`) : un ennemi hors zone ne tire pas, un héros n'atteint pas un ennemi hors zone.
  Les petits traits propres à un personnage (Tom : un cœur pixel art quand il croise un rondin) sont des entrées de `TRAITS`
  dans `src/rendu/traits-persos.ts`, côté rendu et d'après la vue (rien à changer dans la simulation ni le protocole) ; les
  emojis sont dans `src/rendu/emojis.ts`.
- **Cages** : un membre du groupe y est enfermé. Le libérer donne une vie (cinq au plus : au maximum, on change seulement de personnage), et on prend sa place. Chaque niveau en cache quatre ou cinq.
- **Armes à ramasser** (ampli à lampes, vinyle de jazz, accordéon-flamme, cornemuse, triangle
  laser, gong sacré, **chauffage soufflant**) ; **médiators d'or** : soin et spécial.
  Le **chauffage soufflant** est une arme-compagnon (`entites/chauffage.ts`, `DefArme.compagnon`) : il suit le héros à la place
  de Fadatchi en avançant par petits bonds, passe devant lui quand il tire et crache un gros jet de flammes par le centre du
  cercle de sa grille ; quand les munitions s'épuisent (ou que le héros change d'arme ou tombe), il s'en va et le kiwi revient.
  Sa planche (`public/sprites/chauffage.png`) vient de `outils/fixe-chauffage.py`.
- **Drapeaux** : point de reprise et sauvegarde. « Continuer » reprend au dernier drapeau.
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
page et `version.json` passent par le réseau d'abord, pour que les mises à jour soient vues.

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
  **Fin de niveau :** quand le camping-car a disparu, l'écran des _convertis au rock_ (`ui/convertis.ts`) liste les ennemis vaincus
  par type, avec leurs compteurs (« selon les DKK ») ; il vient de la vue (`EtatVue.convertis`, protocole v5), donc chez tous les
  joueurs ; un premier toucher termine le comptage, le suivant passe au récit.
  **Chaque monde a sa géométrie** (`outils/niveaux/signatures.py`) : le garage son _parking à étages_ (rampes en escalier, local
  dessous, niveau de pitons dessus), les alpages leur _falaise à corniches_ (échelles en zigzag, grotte à mi-hauteur), les cimes
  leur _glacier_ (bosses de glace qui glisse, crevasses, igloo à traverser), la plage son _ponton_ de planches sur pilotis et son
  phare, la ville ses _toits sur pilotis_ (on saute de toit en toit). Les pièces communes varient aussi : la traversée de gouffre
  existe en trois modes (`mixte`, `pont`, `iles`), et forteresses, barrages et gouffres changent de taille d'un niveau à l'autre.
  **Pas de longues lignes droites :** chaque niveau est un enchaînement de _lieux_ (`outils/niveaux/plans.py`, un plan par
  niveau) reliés par des raccords de 4 à 6 colonnes : forteresses à étages et sous-sol, traversées de gouffre (passerelle,
  tyrolienne ou îlots), barrages à escalader, gouffres à descendre, tours, échafaudages, murs. Sous terre, pas de galerie
  continue (`outils/niveaux/souterrain.py`) : des complexes de pierre, des cavernes et des caches, qu'on atteint par une
  échelle depuis la surface et qui sont des impasses gardées (butin, arme ou cage +1 vie). Le monde est peu profond :
  24 rangées sous la surface, puis le vide.
- **Un arc de l'histoire :** les niveaux d'un arc s'enchaînent, avec leur épilogue ; l'arc principal est « La tournée ».
  Pour un autre (un voyage en Jamaïque, par exemple) : ajouter ses niveaux à la fin de `NIVEAUX`, puis une entrée dans
  `ARCS` (`niveaux/arcs.ts`) avec son titre, son résumé, son épilogue et, si on veut, `apres` (le niveau à terminer pour
  l'ouvrir). Le menu « Choisir un niveau » les liste par arc. Entre deux niveaux, la carte du monde de l'arc montre le van
  qui roule vers le suivant (`rendu/carte-monde.ts`) : un nouveau thème doit y avoir sa région.
- **Un ennemi :** une définition dans `entites/ennemis/definitions.ts` (lettre de carte), un
  comportement dans `comportements.ts`, un dessin dans `rendu/dessins-ennemis.ts`.
- **Une arme :** un tir dans `entites/projectiles-defs.ts`, une entrée dans `entites/armes.ts`,
  son dessin dans `rendu/dessins-tirs.ts`.

## Licence

Apache-2.0, voir [LICENSE](LICENSE).
