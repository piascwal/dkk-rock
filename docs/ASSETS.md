# Remplacer les personnages par de vrais sprites

Aujourd'hui, tous les personnages sont **dessinés en code** (`src/rendu/dessins-*.ts`). Vous pouvez
les remplacer **un par un** par des images : tant qu'une planche manque, le dessin en code sert de
repli. Rien d'autre à changer.

## Format d'une planche

- Un **PNG à fond transparent**, dans `public/sprites/`.
- Une grille d'images **de taille identique** (`w` × `h` pixels). Le personnage regarde **vers la
  droite** (le jeu le retourne tout seul) ; ses **pieds sont au milieu du bord bas** de l'image.
- **Une ligne par animation**, dans cet ordre (le numéro de ligne est la valeur de `ANIM`) :

| Ligne | Animation  | Quand                             |
| ----- | ---------- | --------------------------------- |
| 0     | debout     | à l'arrêt (obligatoire)           |
| 1     | court      | en marche                         |
| 2     | saut       | en l'air                          |
| 3     | échelle    | sur une échelle                   |
| 4     | tyrolienne | accroché au câble                 |
| 5     | mur        | collé à un mur                    |
| 6     | mort       | touché à mort                     |
| 7     | alerte     | l'ennemi vous repère (« ! »)      |
| 8     | perdu      | l'ennemi vous perd de vue (« ? ») |
| 9     | étourdi    | réservé                           |
| 10    | attaque    | tire (héros) ou attaque (ennemi)  |

Une ligne absente ou vide retombe sur la ligne 0. Les images d'une ligne se suivent de gauche à
droite et bouclent.

## Déclarer la planche

Dans `src/rendu/feuilles.ts`, une entrée par genre (voir `G` dans `src/jeu/vue.ts` : `G.JBT`,
`G.FETARD`, `G.YETI_ALPHA`, `G.KIWI`...) :

```ts
export const FEUILLES: Partial<Record<Genre, Feuille>> = {
  // 32×32 px ; debout 2 images, court 6, saut 1, échelle 4 ; une image dure 6 ticks (1/10 s)
  [G.JBT]: { fichier: 'jbt.png', w: 32, h: 32, images: [2, 6, 1, 4], rythme: 6 },
};
```

`echelle` agrandit l'image (2 = deux fois plus grande) si la planche est plus fine que le jeu.
Une planche faite pour le jeu a des personnages d'environ 24 à 32 px de haut (une tuile = 16 px).

## Déjà fait : Fadatchi

Le kiwi est animé à partir de trois poses de référence (`assets-sources/fadatchi/`) par
`python3 outils/anime-kiwi.py` (Pillow et numpy). Le script remet les poses sur leur grille de
pixels, les recale, découpe la tête au cou pour le coup de bec, retourne vers la droite et réduit
à la taille du jeu : aucun pixel n'est redessiné. Il sert de modèle pour les autres personnages.

## Déjà fait : JBT, JBM et Tom

Les trois héros viennent de leur sprite de base (`assets-sources/heros/`) par
`python3 outils/anime-heros.py [jbt|jbm|tom]`. Le script découpe le sprite en membres (bras, cuisses,
tibias ; polygones et pivots dans `outils/gabarits.py`), les fait tourner autour des articulations
(`outils/squelette.py`), puis réduit à 28 px de haut en gardant la palette. Tom et JBT partagent le même
gabarit de corps ; JBM a le sien. Il produit aussi les portraits de `public/portraits/` (tête et épaules,
pleine définition) pour les dialogues et le choix du héros.

Lignes de la planche : repos 4 images, course 6, saut, échelle 2, tyrolienne, mur, mort, tir 2.
L'instrument n'est pas sur la planche : le jeu le dessine par-dessus, à l'épaule (`epaule` dans
`feuilles.ts`), et le fait pivoter avec la visée.

**Pour JBG et Mat** : même principe. Il faut leur sprite de base (de profil, pieds visibles), puis
l'entrée du gabarit correspondant dans `outils/gabarits.py` (le corps de Tom et JBT, ou celui de JBM,
si la pose est la même ; sinon de nouveaux polygones).

## À savoir

- Le **bras** d'un héros ne suit pas la visée (seul l'instrument pivote) : des lignes dédiées (tir en
  l'air, en diagonale) pourront être ajoutées plus tard.
- Idéalement, continuer par JBG et Mat, puis les ennemis les plus fréquents (fêtard,
  videur, danseur, yéti).
