# Gabarit d'un nouveau personnage jouable

À donner à une IA d'image, avec la planche `docs/gabarit-personnage.png` (les poses en mannequin) et une image du personnage
au repos (sa référence de style). La planche se refait avec `python3 outils/gabarit-personnage.py`.

## Ce qu'il faut produire

Onze images en tout : une bande de 4 poses pour chacune des dix animations, puis deux images seules.

| #   | Animation     | Poses (de gauche à droite)                                                        | Remarque                                  |
| --- | ------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Repos         | respire : neutre, genoux à peine pliés, neutre (regard un peu levé), genoux pliés | boucle, très peu de mouvement             |
| 2   | Course        | contact (jambe avant devant), passage, contact (l'autre jambe), passage           | instrument en main, buste penché en avant |
| 3   | Saut          | impulsion (accroupi), montée (jambes tendues), sommet (genoux repliés), descente  | les poses 2 à 4 sont en l'air             |
| 4   | Échelle       | vu **de dos** : main gauche haute, milieu, main droite haute, milieu              | instrument dans le dos                    |
| 5   | Mur           | de profil, collé à une paroi à sa droite, mains et pieds dessus, il grimpe        | instrument dans le dos                    |
| 6   | Tyrolienne    | suspendu à un câble par les deux mains, jambes qui se balancent                   | instrument dans le dos                    |
| 7   | Tir           | il joue de son arme de base : main qui monte, frappe, recul, retour               |                                           |
| 8   | Visée         | debout, instrument pointé : en haut, diagonale haute, diagonale basse, en bas     | seuls les bras et l'instrument bougent    |
| 9   | Touché / mort | recul, il décolle, il tombe, couché sur le dos                                    |                                           |
| 10  | Spécial       | armer, lancer (ou déclencher), accompagner, revenir en garde                      | dessiner aussi l'objet lancé à part       |
| 11a | Portrait      | tête et épaules, de face                                                          | pour les dialogues                        |
| 11b | Présentation  | en pied, de face ou de trois quarts, instrument en main                           | pour l'intro                              |

## Règles communes (à recopier dans chaque demande)

- **Pixel art**, même style que l'image de référence : contour sombre, aplats, ombrage simple, pas de flou ni d'anticrénelage.
- **Fond magenta uni `#FF00FF`**, sans ombre portée, sans sol dessiné, sans décor, sans texte.
- Le personnage **regarde vers la droite** (sauf l'échelle, de dos, et le portrait, de face).
- **4 cases de même taille côte à côte**, une pose par case, sans bordure ni numéro. Dans chaque case, le personnage a **la même
  taille** (environ 85 % de la hauteur de la case) et ses **pieds touchent le même bas de case** (sauf en l'air).
- **Mêmes vêtements, mêmes couleurs, même instrument** dans toutes les poses : il ne change que la position du corps.
- Le **personnage entier** dans chaque case (instrument compris), rien de coupé.
- Taille conseillée : **4 cases de 512 × 512 px** (une image de 2048 × 512). Le jeu le ramène à ~40 pixels de haut.

## Modèle de demande

> Voici [le personnage] au repos (image 1) et un gabarit de poses en mannequin (image 2, ligne « [nom de l'animation] »).
> Dessine [le personnage] dans ces 4 poses, de gauche à droite, en pixel art dans le même style que l'image 1 : [description
> des 4 poses, reprise du tableau]. Fond magenta uni #FF00FF, 4 cases de 512 × 512 côte à côte sans bordure, le personnage
> regarde vers la droite, même taille et pieds au même niveau dans chaque case, mêmes vêtements et même instrument, rien de coupé,
> pas de texte, pas d'ombre au sol.

Une animation par demande : les IA tiennent mieux le personnage sur 4 poses que sur 40.

## Ensuite

Me donner les images (une par animation, dans l'ordre du tableau) : je les remets sur une grille de pixels, retire le fond, les
aligne sur les pieds et en fais la planche du jeu (`public/sprites/<nom>-instrument.png`), le portrait et la silhouette de l'intro.
