#!/usr/bin/env python3
"""Le battement d'ailes du pigeon de New York, fait à la main à partir de son sprite de vol.

Usage : python3 outils/anime-pigeon.py      (Pillow et numpy requis)

Entrée  : assets-sources/ennemis/pigeon-1-base.png (le vol, ailes levées)
Sorties : pigeon-2-base.png (ailes à mi-hauteur) et pigeon-3-base.png (ailes baissées), mêmes dimensions que l'entrée ;
          fixe-ennemis.py les range sur la ligne du vol (voir ETATS). Le piqué, pigeon-4-base.png, n'est pas touché.

Les ailes (les plumes au-dessus du corps, à gauche de la tête) tournent d'un bloc autour de l'épaule ; le corps, la tête et la
queue restent en place. Là où l'aile découverte laissait un trou, on reprend la couleur du corps juste en dessous.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from anime_commun import SRC, tourne
from prepare_instrument import natif_et_case

EPAULE = (84, 86)  # où les ailes s'attachent, sur la grille native (recadrée sur la silhouette)
DEGRES = {2: 10, 3: 20}  # le numéro de l'image → l'angle de l'aile : positif, elle baisse


def recadre(chemin):
    nat, _ = natif_et_case(chemin)
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def masques(nat):
    """L'aile (les plumes au-dessus du corps et à gauche de la tête) et le reste."""
    h, w = nat.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r, g, b = (nat[..., i].astype(int) for i in range(3))
    op = nat[..., 3] > 0
    beige = (r > 100) & (r - b > 12) & (abs(r - g) < 30) & (r >= g - 5)
    aile = op & (yy <= 118) & (xx <= 117) & ~beige
    return aile


def image_aile(nat, aile, angle):
    """Le vol avec l'aile tournée de `angle` degrés autour de l'épaule ; les trous laissés par l'aile reprennent le corps dessous."""
    reste = nat.copy()
    reste[aile] = 0
    calque = np.zeros_like(nat)
    calque[aile] = nat[aile]
    tournee = tourne(calque, EPAULE, angle, marge=0)
    sortie = reste.copy()
    for y, x in zip(*np.nonzero(tournee[..., 3])):
        sortie[y, x] = tournee[y, x]
    # les pixels qu'on découvre (ils étaient de l'aile, ils ne sont plus couverts) : la couleur du corps juste en dessous
    h = nat.shape[0]
    for y, x in zip(*np.nonzero(aile & (sortie[..., 3] == 0))):
        # seulement un trou dans le corps : du corps juste dessous, et du corps à côté (pas le ciel au-dessus du dos)
        dessous = next((k for k in range(y + 1, min(h, y + 4)) if reste[k, x, 3]), None)
        cote = any(sortie[y, x + d, 3] for d in (-2, -1, 1, 2) if 0 <= x + d < nat.shape[1])
        if dessous is not None and cote:
            sortie[y, x] = reste[dessous, x]
    return sortie


def vers_base(nat, chemin):
    """Le sprite remis dans le format des fichiers de base (deux fois agrandi, centré dans 512 × 512)."""
    up = np.repeat(np.repeat(nat, 2, 0), 2, 1)
    base = np.zeros((512, 512, 4), np.uint8)
    oy, ox = (512 - up.shape[0]) // 2, (512 - up.shape[1]) // 2
    base[oy : oy + up.shape[0], ox : ox + up.shape[1]] = up
    Image.fromarray(base).save(chemin)


def main():
    nat = recadre(SRC / 'pigeon-1-base.png')
    aile = masques(nat)
    for numero, angle in DEGRES.items():
        vers_base(image_aile(nat, aile, angle), SRC / f'pigeon-{numero}-base.png')
        print(f'pigeon-{numero}-base.png : ailes à {angle}°')


if __name__ == '__main__':
    main()
