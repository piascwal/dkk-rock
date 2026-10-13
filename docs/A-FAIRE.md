# À faire plus tard

Idées et finitions notées en route, pour ne pas les perdre.

## Sprites

- **Drone à LED :** les hélices sont fixes dans le sprite fourni. Quand de nouvelles images arriveront (hélices dans une
  autre position), les ajouter à `assets-sources/ennemis/drone-N-base.png` et relancer `outils/fixe-ennemis.py`.
- **Danseur du tube de l'été, lanceur de drops :** une seule apparence chacun ; en prévoir d'autres pour la variété.
- Voir `docs/ASSETS.md` pour la liste de ce qui reste à fournir.

## Niveaux

- **Niveau 6 (le Club Infini) :** sans relief ni galeries ; lui ajouter une approche extérieure avant la tour.
- **Arc de l'histoire en Jamaïque** (les reggae-men deviennent des amis) : le mécanisme d'arcs est prêt (`niveaux/arcs.ts`),
  il manque les niveaux, les textes et les ennemis.
- **Décors de premier plan non jouables :** prévoir une couche devant les héros quand les sprites seront fournis.

## À ne pas oublier

- **Nouvel arc ou nouveau thème → la carte du monde** (`src/rendu/carte-monde.ts`) : elle se construit d'après les
  niveaux de l'arc et leur thème, mais un thème nouveau (la Jamaïque, par exemple) doit y avoir sa région (`REGIONS`,
  une entrée par décor) ; vérifier ensuite l'allure de la carte de l'arc.
