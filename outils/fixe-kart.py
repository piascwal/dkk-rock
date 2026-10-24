#!/usr/bin/env python3
"""Le Grand Prix de la Sarré (le mini-jeu de kart) : les cinq DKK et leurs voitures vus de dessus.

Usage : python3 outils/fixe-kart.py      (Pillow et numpy requis)

Entrée : assets-sources/kart/planche.jpg (les héros en haut, les voitures en bas, chacun sur sa case magenta)
Sorties : public/sprites/kart-<nom>.png (jbt, jbm, jbg, mat, tom ; clio, xantia, megane, corsa, r11)

La planche est un JPEG : le fond magenta est retiré avec le fondu des bords, puis on ne garde que les pixels pleins (sinon un liseré
violet entoure tout) et le contour, teinté de magenta par la compression, est repeint en gris très sombre. Chaque sprite est
recadré sur sa silhouette, à la résolution de la planche (le jeu le réduit avec lissage) ; les voitures sont tournées nez à droite.
"""
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
VOITURES = ('corsa', 'megane', 'clio', 'xantia', 'r11')
# les cases de la planche (x0, y0, x1, y1)
TUILES = {
    'jbt': (23, 54, 298, 327), 'jbm': (303, 54, 577, 327), 'jbg': (582, 54, 856, 327),
    'mat': (861, 54, 1135, 327), 'tom': (1140, 54, 1414, 327),
    'corsa': (32, 425, 290, 638), 'megane': (311, 425, 569, 638), 'clio': (590, 425, 848, 638),
    'xantia': (869, 425, 1127, 638), 'r11': (1148, 425, 1406, 638),
}

MAGENTA = np.array([255, 0, 255], float)


def detoure(a):
    a = a.astype(float)
    d = np.abs(a - MAGENTA).sum(-1)
    alpha = np.clip((d - 90) / 110, 0, 1)
    # on retire la part de magenta des pixels du bord
    c = np.where(alpha[..., None] > 0.01, (a - (1 - alpha[..., None]) * MAGENTA) / np.maximum(alpha[..., None], 0.01), 0)
    out = np.concatenate([np.clip(c, 0, 255), alpha[..., None] * 255], -1).astype(np.uint8)
    # le liseré violet du bord (contour fondu dans le magenta) : on ne garde que les pixels pleins
    out[alpha < 0.9] = 0
    out[alpha >= 0.9, 3] = 255
    # le contour, teinté de magenta par la compression : repeint en gris très sombre, à sa luminosité
    op = out[..., 3] > 0
    bord = op & ~(np.roll(op, 1, 0) & np.roll(op, -1, 0) & np.roll(op, 1, 1) & np.roll(op, -1, 1)
                  & np.roll(op, 2, 0) & np.roll(op, -2, 0) & np.roll(op, 2, 1) & np.roll(op, -2, 1))
    r, g, b = (out[..., k].astype(int) for k in range(3))
    teinte = bord & (r > g + 20) & (b > g + 20)
    lum = ((r + g + b) // 3).clip(0, 90)
    for k in range(3):
        out[..., k] = np.where(teinte, (lum * [0.8, 0.8, 0.9][k]).astype(int) + 14, out[..., k])
    return out


def recadre(a):
    ys, xs = np.nonzero(a[..., 3] > 40)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


if __name__ == '__main__':
    src = Image.open(RACINE / 'assets-sources' / 'kart' / 'planche.jpg').convert('RGB')
    for nom, (x0, y0, x1, y1) in TUILES.items():
        im = Image.fromarray(recadre(detoure(np.array(src.crop((x0 + 3, y0 + 3, x1 - 3, y1 - 3))))))
        if nom in VOITURES:
            im = im.transpose(Image.ROTATE_180)  # nez à droite : l'angle 0 du jeu
        # 256 couleurs suffisent à la taille où le jeu les dessine (le poids de la planche est divisé par trois)
        im = im.quantize(256, method=Image.Quantize.FASTOCTREE)
        im.save(RACINE / 'public' / 'sprites' / f'kart-{nom}.png', optimize=True)
        print(nom, im.size)
