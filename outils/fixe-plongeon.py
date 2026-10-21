#!/usr/bin/env python3
"""Tom en slip de bain, pour le concours de plongeon du pont des Tuves (un mini-jeu).

Usage : python3 outils/fixe-plongeon.py      (Pillow et numpy requis)

Entrées : assets-sources/plongeon/tom-<pose>-base.png
          pose : plonge (bras tendus devant : l'entrée dans l'eau), chute (bras repliés sous le menton : la chute)
Sorties : public/sprites/plongeon-tom-<pose>.png

Chaque sprite est remis sur sa grille de pixels, recadré sur sa silhouette et agrandi sans lissage à sa longueur en jeu (6 pixels
de planche par pixel du jeu, comme les autres planches) : le jeu le dessine à sa taille divisée par 6. Tom y est allongé, la
tête à droite : le jeu le tourne pour qu'il pique vers la rivière.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'plongeon'
SORTIE = RACINE / 'public' / 'sprites'
DENSITE = 6

# pose : longueur en jeu (pixels), de la pointe des pieds au bout des doigts
LONGUEURS = {'plonge': 60, 'chute': 52}


def natif(chemin):
    nat, _ = natif_et_case(chemin)
    ys, xs = np.nonzero(nat[..., 3] > 8)
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def agrandi(a, largeur):
    h, w = a.shape[:2]
    nw, nh = largeur, round(h * largeur / w)
    ys = np.minimum((np.arange(nh) * h / nh).astype(int), h - 1)
    xs = np.minimum((np.arange(nw) * w / nw).astype(int), w - 1)
    return Image.fromarray(a[np.ix_(ys, xs)])


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    for f in sorted(SRC.glob('tom-*-base.png')):
        pose = f.name.removesuffix('-base.png').removeprefix('tom-')
        im = agrandi(natif(f), LONGUEURS[pose] * DENSITE)
        im.save(SORTIE / f'plongeon-tom-{pose}.png', optimize=True)
        print(f'plongeon-tom-{pose}.png : {im.width // DENSITE}x{im.height // DENSITE} en jeu')


if __name__ == '__main__':
    main()
