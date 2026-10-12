#!/usr/bin/env python3
"""Planches fixes (une seule image, sans animation) des ennemis fournis en sprite de base.

Usage : python3 outils/fixe-ennemis.py      (Pillow et numpy requis)
Entrées : assets-sources/ennemis/<nom>-base.png      Sorties : public/sprites/<nom>.png

Le sprite est remis sur sa grille de pixels, recadré sur sa silhouette, puis réduit à la hauteur voulue (SPRITES)
en gardant la palette (vote majoritaire par case, comme pour les héros). Aucun pixel n'est redessiné.
"""
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'ennemis'
SORTIE = RACINE / 'public' / 'sprites'
# hauteur de chaque sprite en jeu, en pixels (un héros fait 40 px)
SPRITES = {'videur-polo': 46, 'videur-costume': 46, 'fetard-1': 40, 'fetard-2': 40, 'fetard-3': 40, 'fetard-4': 40}


def natif(chemin):
    brut = np.array(Image.open(chemin).convert('RGBA'))
    nat = brut[4::8, 4::8]
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def reduit(a, echelle):
    """Réduit par cases : une case est opaque si la moitié de ses pixels l'est, couleur la plus fréquente."""
    h, w = a.shape[:2]
    nh, nw = round(h * echelle), round(w * echelle)
    ys, xs = np.linspace(0, h, nh + 1), np.linspace(0, w, nw + 1)
    res = np.zeros((nh, nw, 4), np.uint8)
    for j in range(nh):
        for i in range(nw):
            y0, x0 = int(ys[j]), int(xs[i])
            blk = a[y0 : max(y0 + 1, int(ys[j + 1])), x0 : max(x0 + 1, int(xs[i + 1]))].reshape(-1, 4)
            pleins = blk[blk[:, 3] > 0]
            if len(pleins) * 2 < len(blk):
                continue
            couleurs, nb = np.unique(pleins, axis=0, return_counts=True)
            res[j, i] = couleurs[nb.argmax()]
    return Image.fromarray(res)


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    for nom, hauteur in SPRITES.items():
        nat = natif(SRC / f'{nom}-base.png')
        echelle = hauteur / nat.shape[0]
        im = reduit(nat, echelle)
        im.save(SORTIE / f'{nom}.png')
        print(nom, 'taille en jeu', im.width, 'x', im.height)


if __name__ == '__main__':
    main()
