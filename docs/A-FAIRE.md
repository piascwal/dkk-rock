# À faire plus tard

Idées et finitions notées en route, pour ne pas les perdre.

## Sprites

- **Drone à LED :** les hélices sont fixes dans le sprite fourni. Quand de nouvelles images arriveront (hélices dans une
  autre position), les ajouter à `assets-sources/ennemis/drone-N-base.png` et relancer `outils/fixe-ennemis.py`.
- **Danseur du tube de l'été, lanceur de drops :** une seule apparence chacun ; en prévoir d'autres pour la variété.
- Voir `docs/ASSETS.md` pour la liste de ce qui reste à fournir.

## Décor dessiné en code, à remplacer par du pixel art

Pour peupler les niveaux comme Broforce, le décor est dessiné en code en attendant de vrais sprites ; chaque élément se
remplace un par un (voir `docs/ASSETS.md`, et `outils/fixe-objets.py` pour les planches du décor) :

- **Ciel** (`rendu/ciel.ts`) : nuages (par monde) et oiseaux.
- **Plans de fond** (`rendu/fonds.ts`, `fonds-arbres.ts`) : forêts de sapins et d'arbres ronds, palmiers, maisons, immeubles.
- **Accessoires** (`rendu/decor-accessoires.ts`) : tonneau, sacs de sable, bidon, pneus, fougère, souche, champignons,
  tronc, cairn, pot de fleurs, panneau fléché, torche et feu de camp animés.
- **Ce qui pend et s'accroche** (`rendu/vegetation.ts`) : lianes, mousse, glaçons, câbles, garde-corps des passerelles.

## Niveaux

- **Niveau 6 (le Club Infini) :** sans relief ni galeries ; lui ajouter une approche extérieure avant la tour.
- **Arc de l'histoire en Jamaïque** (les reggae-men deviennent des amis) : le mécanisme d'arcs est prêt (`niveaux/arcs.ts`),
  il manque les niveaux, les textes et les ennemis.
- **Décors de premier plan non jouables :** prévoir une couche devant les héros quand les sprites seront fournis.

## À ne pas oublier

- **Nouvel arc ou nouveau thème → la carte du monde** (`src/rendu/carte-monde.ts`) : elle se construit d'après les
  niveaux de l'arc et leur thème, mais un thème nouveau (la Jamaïque, par exemple) doit y avoir sa région (`REGIONS`,
  une entrée par décor) ; vérifier ensuite l'allure de la carte de l'arc.
