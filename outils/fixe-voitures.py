#!/usr/bin/env python3
"""Les voitures du concours de drift (mini-jeu du pré du Clos), vues de l'arrière.

Usage : python3 outils/fixe-voitures.py      (Pillow et numpy requis)

Entrées : assets-sources/drift/<pilote>-<vue>-base.png
          pilote : tom (la Renault 11 blanche), matt (l'Opel Corsa noire)
          vue : dos (de l'arrière), biais (de trois quarts, le nez à gauche), biais-droite (le nez à droite ; à défaut, le jeu
          retourne `biais`)
Sorties : public/sprites/drift-<pilote>-<vue>.png

Chaque sprite est remis sur sa grille de pixels, recadré sur sa silhouette et agrandi sans lissage à sa largeur en jeu (6 pixels
de planche par pixel du jeu, comme les autres planches) : le jeu le dessine à sa taille divisée par 6.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'drift'
SORTIE = RACINE / 'public' / 'sprites'
DENSITE = 6

# vue : largeur en jeu (pixels) ; la voiture de dos fait un peu moins large que de trois quarts
LARGEURS = {'dos': 58, 'biais': 66, 'biais-droite': 66}


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
    for f in sorted(SRC.glob('*-base.png')):
        nom = f.name.removesuffix('-base.png')
        vue = nom.split('-', 1)[1]
        im = agrandi(natif(f), LARGEURS[vue] * DENSITE)
        im.save(SORTIE / f'drift-{nom}.png', optimize=True)
        print(f'drift-{nom}.png : {im.width // DENSITE}x{im.height // DENSITE} en jeu')


if __name__ == '__main__':
    main()
