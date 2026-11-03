#!/usr/bin/env python3
"""Un panneau publicitaire reçu en JPEG sur fond magenta → assets-sources/decor/panneaux/<nom>-base.png (fond transparent).

Usage : python3 outils/prepare-panneau.py <image.jpg> <nom>      (Pillow, numpy et scipy requis)
        puis ajouter le panneau à OBJETS dans outils/fixe-objets.py et python3 outils/fixe-objets.py (la planche du jeu),
        et à PANNEAUX dans src/rendu/decor-panneaux.ts (ses catégories).

Le fond magenta est retiré (les miettes de moins de 2000 pixels, du bruit JPEG, aussi) ; le liseré violet que le fond laisse
autour des contours devient le contour sombre. Rien n'est redimensionné : fixe-objets.py ramène le panneau à sa taille en jeu.
"""
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = pathlib.Path(__file__).resolve().parent.parent / 'assets-sources' / 'decor' / 'panneaux'
CONTOUR = (28, 22, 30)


def prepare(chemin):
    a = np.array(Image.open(chemin).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fond = (r > 140) & (b > 130) & (g < 120) & ((r + b) / 2 - g > 110)
    etiquettes, n = ndimage.label(~fond)
    tailles = ndimage.sum(np.ones_like(etiquettes), etiquettes, range(1, n + 1))
    plein = np.isin(etiquettes, 1 + np.nonzero(tailles > 2000)[0])
    sortie = np.zeros(a.shape[:2] + (4,), np.uint8)
    sortie[..., :3] = a
    sortie[..., 3] = np.where(plein, 255, 0)
    # le liseré violet des bords (deux pixels de large au plus) devient le contour sombre
    bord = plein & ~ndimage.binary_erosion(plein, iterations=2)
    lisere = bord & (r - g > 25) & (b - g > 25) & (abs(r - b) < 90)
    sortie[lisere, :3] = CONTOUR
    ys, xs = np.nonzero(plein)
    return sortie[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def main():
    chemin, nom = sys.argv[1], sys.argv[2]
    SRC.mkdir(parents=True, exist_ok=True)
    img = Image.fromarray(prepare(chemin))
    img.save(SRC / f'{nom}-base.png')
    print(f'{nom}-base.png : {img.width} x {img.height}')


if __name__ == '__main__':
    main()
