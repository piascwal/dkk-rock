#!/usr/bin/env python3
"""Les héros sans instrument, pour l'intro : public/sprites/intro-heros.png (5 images de 128×128, JBT, JBM, JBG, Mat, Tom).

Usage : python3 outils/fixe-intro.py     Les sprites de base (assets-sources/heros/<nom>-base.png, cases de 8 px) sont lus
au centre de chaque case : aucun pixel n'est redessiné.
"""
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
NOMS = ['jbt', 'jbm', 'jbg', 'mat', 'tom']


def main():
    planche = Image.new('RGBA', (128 * len(NOMS), 128), (0, 0, 0, 0))
    for i, nom in enumerate(NOMS):
        brut = np.array(Image.open(RACINE / 'assets-sources' / 'heros' / f'{nom}-base.png').convert('RGBA'))
        nat = brut[4::8, 4::8]
        # pieds en bas de l'image
        ys = np.nonzero(nat[..., 3].any(1))[0]
        decale = 127 - ys.max()
        im = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
        im.alpha_composite(Image.fromarray(nat), (0, int(decale)))
        planche.alpha_composite(im, (i * 128, 0))
    planche.save(RACINE / 'public' / 'sprites' / 'intro-heros.png')
    print('intro-heros.png')


if __name__ == '__main__':
    main()
