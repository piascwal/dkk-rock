#!/usr/bin/env python3
"""JBT en super-héros, pour le rêve de JBT (un mini-jeu façon Jetpack Joyride).

Usage : python3 outils/fixe-reve.py      (Pillow et numpy requis)

Entrées : assets-sources/reve/jbt-<pose>-base.png
          pose : vol (allongé, les poings devant, la tête à droite : la traversée du ciel), dos (de dos, les bras levés : le
          décollage)
Sorties : public/sprites/reve-jbt-<pose>.png

Chaque sprite est remis sur sa grille de pixels, recadré sur sa silhouette et agrandi sans lissage à sa taille en jeu (6 pixels de
planche par pixel du jeu, comme les autres planches) : le jeu le dessine à sa taille divisée par 6.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'reve'
SORTIE = RACINE / 'public' / 'sprites'
DENSITE = 6

# pose : largeur en jeu (pixels)
LARGEURS = {'vol': 50, 'dos': 18}


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
    for f in sorted(SRC.glob('jbt-*-base.png')):
        pose = f.name.removesuffix('-base.png').removeprefix('jbt-')
        im = agrandi(natif(f), LARGEURS[pose] * DENSITE)
        im.save(SORTIE / f'reve-jbt-{pose}.png', optimize=True)
        print(f'reve-jbt-{pose}.png : {im.width // DENSITE}x{im.height // DENSITE} en jeu')


if __name__ == '__main__':
    main()
