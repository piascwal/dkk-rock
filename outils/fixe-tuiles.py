#!/usr/bin/env python3
"""Tuiles fournies en sprite (caisse, caisson de basses) : remises sur leur grille de pixels, recadrées, agrandies sans
lissage à 96 × 96 (6 pixels d'image par pixel du jeu, la tuile fait 16 px).

Usage : python3 outils/fixe-tuiles.py      (Pillow et numpy requis)

Entrées : assets-sources/tuiles/<nom>-base.png     Sorties : public/sprites/tuile-<nom>.png (voir IMAGES_TUILES dans
src/rendu/atlas-tuiles.ts)
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
COTE = 96
TUILES = ['caisse', 'caisson', 'caisson-rose', 'tonneau-wog', 'tonneau-or', 'bois', 'bidon']
# les tuiles qui gardent leurs proportions (un tonneau n'est pas carré) : centrées en bas de la case, et agrandies d'un
# facteur ENTIER (3) : chaque pixel de l'artiste reste un carré net, sans les pixels inégaux d'un redimensionnement
PROPORTIONS = {'tonneau-wog', 'tonneau-or', 'bidon'}
FACTEUR_ENTIER = 3


def main():
    for nom in TUILES:
        nat, _ = natif_et_case(RACINE / 'assets-sources' / 'tuiles' / f'{nom}-base.png')
        ys, xs = np.nonzero(nat[..., 3])
        nat = nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        h, w = nat.shape[:2]
        if nom in PROPORTIONS:
            cote = FACTEUR_ENTIER * max(h, w)
            agrandi = np.repeat(np.repeat(nat, FACTEUR_ENTIER, axis=0), FACTEUR_ENTIER, axis=1)
            nh, nw = agrandi.shape[:2]
            case = Image.new('RGBA', (cote, cote), (0, 0, 0, 0))
            case.alpha_composite(Image.fromarray(agrandi), ((cote - nw) // 2, cote - nh))
            case.save(RACINE / 'public' / 'sprites' / f'tuile-{nom}.png')
            print(f'tuile-{nom}.png : {w}x{h} pixels d’origine -> {cote}x{cote}, pixels ×{FACTEUR_ENTIER}')
            continue
        yy = np.minimum((np.arange(COTE) * h / COTE).astype(int), h - 1)
        xx = np.minimum((np.arange(COTE) * w / COTE).astype(int), w - 1)
        Image.fromarray(nat[np.ix_(yy, xx)]).save(RACINE / 'public' / 'sprites' / f'tuile-{nom}.png')
        print(f'tuile-{nom}.png : {w}x{h} pixels d’origine -> {COTE}x{COTE}')


if __name__ == '__main__':
    main()
